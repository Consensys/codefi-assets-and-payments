import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import web3Utils from 'web3-utils';

import {
  keys as BalancesKeys,
  ERC1400Balances,
  ERC1400StateBalance,
  ERC1400ClassBalances,
  ERC721Balances,
  ERC20Balances,
} from 'src/types/balance';

import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { EthServiceType, EthService } from 'src/types/ethService';
import { ListAllBalancesOutput } from 'src/modules/v2Balance/balances.dto';
import { PartitionService } from 'src/modules/v2Partition/partition.service';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { keys as TokenKeys, Token } from 'src/types/token';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import { TokenState } from 'src/types/states';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import {
  TokenIdentifierEnum,
  WorkflowInstanceEnum,
} from 'src/old/constants/enum';

// APIs
import { UserType, User } from 'src/types/user';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  keys as LinkKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { EntityType } from 'src/types/entity';
import { checkLinkStateValidForUserType } from 'src/utils/checks/links';
import {
  ScVersion,
  SmartContract,
  SmartContractVersion,
  TokenCategory,
} from 'src/types/smartContract';
import { NetworkService } from 'src/modules/v2Network/network.service';

@Injectable()
export class BalanceService {
  constructor(
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
    private readonly partitionService: PartitionService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly networkService: NetworkService,
  ) {}

  /**
   * [Pre-list all balances for a specific token and ]
   *
   * It is recommended to call this function before listing balances.
   *
   * It will retrieve all partition balances in a single call to the BalanceReader
   * smart contract and store the results in cache memory.
   * This will avoid making numerous calls to the node when listing partition balances
   * one-by-one right after.
   */
  async preListAllBalancesForUserToken(
    tenantId: string,
    callerId: string,
    userId: string,
    userType: UserType,
    tokenId: string,
  ) {
    try {
      // Retrieve user and token
      const token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        tokenId,
        true,
        undefined,
        undefined,
        false,
      );

      // BalanceReader doesn't work for ERC721 tokens
      if (token[TokenKeys.STANDARD].includes('ERC721')) {
        return;
      }

      // Retrieve token links
      const userEntityLinks: Array<Link> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityIdAndUserId,
          undefined, // userEntityLinkId
          undefined, // idempotencyKey
          userId,
          tokenId,
          undefined, // objectId
          undefined, // entityType
          WorkflowType.LINK,
          undefined, // otherWorkflowType
          false,
        );

      // Filter investor-token links
      const userTokenLinks: Array<Link> = userEntityLinks.filter(
        (userEntityLink: Link) => {
          return userEntityLink[LinkKeys.ENTITY_TYPE] === EntityType.TOKEN;
        },
      );

      // Filter investor-token links
      const investorTokenLinks: Array<Link> = userTokenLinks.filter(
        (userEntityLink: Link) => {
          return checkLinkStateValidForUserType(
            userEntityLink[LinkKeys.STATE],
            userType,
            userEntityLink[LinkKeys.ENTITY_TYPE],
          );
        },
      );

      if (investorTokenLinks.length === 0) {
        return;
      }

      // Pre-list balances for a list of user-token links
      await this.preListBalancesForUserTokenLinks(
        tenantId,
        callerId,
        [token],
        investorTokenLinks,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'pre-listing all balances for a specific user and a specific token',
        'preListAllBalancesForUserToken',
        false,
        500,
      );
    }
  }

  /**
   * [Pre-list supplies for a list of tokens]
   *
   * It is recommended to call this function before listing suppiles for a list of tokens.
   *
   * It will retrieve partition supplies in a single call to the BalanceReader
   * smart contract and store the results in cache memory.
   * This will avoid making numerous calls to the node when listing partition supplies
   * one-by-one right after.
   */
  async preListSuppliesForTokens(
    tenantId: string,
    callerId: string,
    rawTokensList: Array<Token>,
  ) {
    try {
      const { validNetworkKeysMap, chainIdToFirstMatchingNetworkKey } =
        await this.networkService.retrieveValidNetworksMap(tenantId);

      const erc1400Params: {
        [networkKey: string]: Array<string>;
      } = {};
      for (let index = 0; index < rawTokensList.length; index++) {
        const token: Token = rawTokensList[index];
        const chainId: string = token[TokenKeys.DEFAULT_CHAIN_ID];
        const networkKey: string =
          token[TokenKeys.DEFAULT_NETWORK_KEY] ||
          chainIdToFirstMatchingNetworkKey[chainId]; // Before the migration is done in Metadata-Api, there might be some old tokens remaining without 'defaultNetworkKey'

        if (token[TokenKeys.STANDARD].includes('ERC1400')) {
          if (!erc1400Params[networkKey]) {
            erc1400Params[networkKey] = [];
          }

          // When the deployment is still pending, the supplies can not be fetched, we shall not fetch them
          const tokenAddress: string = token[TokenKeys.DEFAULT_DEPLOYMENT];
          if (
            tokenAddress &&
            web3Utils.isAddress(tokenAddress) &&
            erc1400Params[networkKey].indexOf(tokenAddress) < 0
          ) {
            erc1400Params[networkKey].push(tokenAddress);
          }
        }
      }

      // In case a network doesn't exist anymore (once it has been deleted), we shall not try to fetch data
      // from the chain because the calls would fail
      await Promise.all(
        Object.keys(erc1400Params).map((networkKey: string) => {
          if (
            validNetworkKeysMap[networkKey] &&
            erc1400Params[networkKey] &&
            erc1400Params[networkKey].length > 0
          ) {
            return this.ethHelperService
              .createEthService(
                tenantId,
                EthServiceType.WEB3,
                undefined, // chainId - TO BE DEPRECATED (replaced by 'networkKey')
                networkKey,
                false,
              )
              .then((ethService: EthService) => {
                if (ethService) {
                  // ethService can be undefined in case network doesn't exist anymore or is not alive
                  return Promise.all([
                    this.apiSCCallService.batchTokenSuppliesInfos(
                      callerId,
                      erc1400Params[networkKey],
                      ethService,
                    ),
                    this.apiSCCallService.batchTokenRolesInfos(
                      callerId,
                      erc1400Params[networkKey],
                      ethService,
                    ),
                    this.apiSCCallService.batchTokenExtensionSetup(
                      callerId,
                      erc1400Params[networkKey],
                      ethService,
                    ),
                  ]);
                }
              });
          }
        }),
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'pre-listing supplies for a list of tokens',
        'preListSuppliesForTokens',
        false,
        500,
      );
    }
  }

  /**
   * [Pre-list balances for a list of user links]
   *
   * It is recommended to call this function before listing balances for a given user.
   *
   * It will retrieve partition balances in a single call to the BalanceReader
   * smart contract and store the results in cache memory.
   * This will avoid making numerous calls to the node when listing partition balances
   * one-by-one right after.
   */
  async preListBalancesForUserTokenLinks(
    tenantId: string,
    callerId: string,
    rawTokensList: Array<Token>,
    userTokenLinks: Array<Link>,
  ) {
    try {
      const { validNetworkKeysMap, chainIdToFirstMatchingNetworkKey } =
        await this.networkService.retrieveValidNetworksMap(tenantId);

      const tokenMapping: {
        [id: string]: Token;
      } = {};
      rawTokensList.map((rawToken: Token) => {
        tokenMapping[rawToken[TokenKeys.TOKEN_ID]] = rawToken;
      });

      const erc1400Params: {
        [networkKey: string]: {
          userAddresses: Array<string>;
          tokenAddresses: Array<string>;
        };
      } = {};
      const erc20Params: {
        [networkKey: string]: {
          userAddresses: Array<string>;
          tokenAddresses: Array<string>;
        };
      } = {};

      for (let index = 0; index < userTokenLinks.length; index++) {
        const userTokenLink: Link = userTokenLinks[index];
        const token: Token = tokenMapping[userTokenLink[LinkKeys.ENTITY_ID]];
        if (
          !(
            token &&
            (token[TokenKeys.DEFAULT_CHAIN_ID] || // TO BE DEPRECATED (replaced by 'networkKey')
              token[TokenKeys.DEFAULT_NETWORK_KEY])
          )
        ) {
          // This case happens when the token has not been fetched, when the token has been sliced for pagination reasons.
          continue;
        }
        const chainId: string = token[TokenKeys.DEFAULT_CHAIN_ID]; // TO BE DEPRECATED (replaced by 'networkKey')
        const networkKey: string =
          token[TokenKeys.DEFAULT_NETWORK_KEY] ||
          chainIdToFirstMatchingNetworkKey[chainId]; // Before the migration is done in Metadata-Api, there might be some old tokens remaining without 'defaultNetworkKey'

        // Retrieve wallet address stored in link
        let walletAddress: string;
        if (
          userTokenLink &&
          userTokenLink[LinkKeys.WALLET] &&
          web3Utils.isAddress(userTokenLink[LinkKeys.WALLET])
        ) {
          walletAddress = userTokenLink[LinkKeys.WALLET];
        } else {
          ErrorService.throwError(
            'invalid user-entity link data --> impossible to retrieve wallet from it',
          );
        }

        if (token[TokenKeys.STANDARD].includes('ERC1400')) {
          if (!erc1400Params[networkKey]) {
            erc1400Params[networkKey] = {
              userAddresses: [],
              tokenAddresses: [],
            };
          }

          if (
            erc1400Params[networkKey].userAddresses.indexOf(walletAddress) < 0
          ) {
            erc1400Params[networkKey].userAddresses.push(walletAddress);
          }

          // When the deployment is still pending, the balances can not be fetched, we shall not fetch them
          const tokenAddress: string = token[TokenKeys.DEFAULT_DEPLOYMENT];
          if (
            tokenAddress &&
            web3Utils.isAddress(tokenAddress) &&
            erc1400Params[networkKey].tokenAddresses.indexOf(tokenAddress) < 0
          ) {
            erc1400Params[networkKey].tokenAddresses.push(tokenAddress);
          }
        } else if (token[TokenKeys.STANDARD].includes('ERC20')) {
          if (!erc20Params[networkKey]) {
            erc20Params[networkKey] = {
              userAddresses: [],
              tokenAddresses: [],
            };
          }
          if (
            erc20Params[networkKey].userAddresses.indexOf(walletAddress) < 0
          ) {
            erc20Params[networkKey].userAddresses.push(walletAddress);
          }

          // When the deployment is still pending, the balances can not be fetched, we shall not fetch them
          const tokenAddress: string = token[TokenKeys.DEFAULT_DEPLOYMENT];
          if (
            tokenAddress &&
            web3Utils.isAddress(tokenAddress) &&
            erc20Params[networkKey].tokenAddresses.indexOf(tokenAddress) < 0
          ) {
            erc20Params[networkKey].tokenAddresses.push(tokenAddress);
          }
        }
      }

      // In case a network doesn't exist anymore (once it has been deleted), we shall not try to fetch data
      // from the chain because the calls would fail
      await Promise.all(
        Object.keys(erc1400Params).map((networkKey: string) => {
          const fetchBatches: boolean =
            validNetworkKeysMap[networkKey] &&
            erc1400Params[networkKey].tokenAddresses &&
            erc1400Params[networkKey].tokenAddresses.length > 0;
          return fetchBatches
            ? this.ethHelperService
                .createEthService(
                  tenantId,
                  EthServiceType.WEB3,
                  undefined, // chainId - TO BE DEPRECATED (replaced by 'networkKey')
                  networkKey,
                  false,
                )
                .then((ethService: EthService) => {
                  if (ethService) {
                    // ethService can be undefined in case network doesn't exist anymore or is not alive
                    return Promise.all([
                      this.apiSCCallService.batchERC1400Balances(
                        callerId,
                        erc1400Params[networkKey].tokenAddresses,
                        erc1400Params[networkKey].userAddresses,
                        ethService,
                      ),
                      this.apiSCCallService.batchValidations(
                        callerId,
                        erc1400Params[networkKey].tokenAddresses,
                        erc1400Params[networkKey].userAddresses,
                        ethService,
                      ),
                    ]);
                  }
                })
            : undefined;
        }),
      );

      await Promise.all(
        Object.keys(erc20Params).map((networkKey: string) => {
          const fetchBatches: boolean =
            validNetworkKeysMap[networkKey] &&
            erc20Params[networkKey].tokenAddresses &&
            erc20Params[networkKey].tokenAddresses.length > 0;
          return fetchBatches
            ? this.ethHelperService
                .createEthService(
                  tenantId,
                  EthServiceType.WEB3,
                  undefined, // chainId - TO BE DEPRECATED (replaced by 'networkKey')
                  networkKey,
                  false,
                )
                .then((ethService: EthService) => {
                  if (ethService) {
                    // ethService can be undefined in case network doesn't exist anymore or is not alive
                    return this.apiSCCallService.batchERC20Balances(
                      callerId,
                      erc20Params[networkKey].tokenAddresses,
                      erc20Params[networkKey].userAddresses,
                      ethService,
                    );
                  }
                })
            : undefined;
        }),
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'pre-listing balances for a list of user links',
        'preListBalancesForUserTokenLinks',
        false,
        500,
      );
    }
  }

  /**
   * [Fetch ERC20 token balances]
   */
  async listAllUserERC20BalancesForToken(
    tenantId: string,
    callerId: string,
    user: User,
    userTokenLinks: Array<Link>,
    token: Token,
    withEthBalance: boolean,
  ): Promise<ListAllBalancesOutput> {
    try {
      const ethService: EthService =
        await this.ethHelperService.createEthService(
          tenantId,
          EthServiceType.WEB3,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          false, // networkShallExist
        );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        return {
          balances: undefined,
          etherBalances: undefined,
          message: `Issue listing ERC20 balances: network with chainId ${
            token[TokenKeys.DEFAULT_CHAIN_ID]
          } can't be reached`,
        };
      }

      const wallet: Wallet =
        this.walletService.extractWalletFromUserEntityLinks(
          user,
          userTokenLinks,
          undefined, // assetClassKey
        );
      const userAddress: string = wallet[WalletKeys.WALLET_ADDRESS];

      // When the deployment is still pending, the balances can not be fetched, we shall not fetch them (and return 0)
      const tokenAddress: string = token[TokenKeys.DEFAULT_DEPLOYMENT];
      const balance: number =
        tokenAddress && web3Utils.isAddress(tokenAddress)
          ? await this.apiSCCallService.balanceOf(
              callerId,
              token[TokenKeys.STANDARD],
              userAddress,
              token[TokenKeys.DEFAULT_DEPLOYMENT],
              ethService,
            )
          : 0;

      const allBalances: ERC20Balances = {
        [BalancesKeys.TOTAL]: balance,
      };

      let etherBalances: Array<number>;
      if (withEthBalance) {
        etherBalances = [
          await this.apiSCCallService.fetchEtherBalance(
            callerId,
            userAddress,
            ethService,
          ),
        ];
      }

      return {
        balances: allBalances,
        etherBalances,
        message: 'Balances listed successfully',
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "lisiting all user's ERC20 balances for a specific token",
        'listAllUserERC20BalancesForToken',
        false,
        500,
      );
    }
  }

  /**
   * [List all user's ERC721 balances for a given token]
   */
  async listAllUserERC721BalancesForToken(
    tenantId: string,
    callerId: string,
    user: User,
    userTokenLinks: Array<Link>,
    token: Token,
    withEthBalance: boolean,
  ): Promise<ListAllBalancesOutput> {
    try {
      const ethService: EthService =
        await this.ethHelperService.createEthService(
          tenantId,
          EthServiceType.WEB3,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          false, // networkShallExist
        );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        return {
          balances: undefined,
          etherBalances: undefined,
          message: `Issue listing ERC721 balances: network with chainId ${
            token[TokenKeys.DEFAULT_CHAIN_ID]
          } can't be reached`,
        };
      }

      const wallet: Wallet =
        this.walletService.extractWalletFromUserEntityLinks(
          user,
          userTokenLinks,
          undefined, // assetClassKey
        );
      const userAddress: string = wallet[WalletKeys.WALLET_ADDRESS];

      // When the deployment is still pending, the balances can not be fetched, we shall not fetch them (and return empty array)
      const tokenAddress: string = token[TokenKeys.DEFAULT_DEPLOYMENT];
      const allIdentifiers: Array<string> =
        tokenAddress && web3Utils.isAddress(tokenAddress)
          ? await this.apiSCCallService.tokensOfOwner(
              callerId,
              token[TokenKeys.STANDARD],
              userAddress,
              token[TokenKeys.DEFAULT_DEPLOYMENT],
              ethService,
            )
          : [];

      const allBalances: ERC721Balances = {
        [BalancesKeys.IDENTIFIERS]: allIdentifiers,
        [BalancesKeys.TOTAL]: allIdentifiers.length,
      };

      let etherBalances: Array<number>;
      if (withEthBalance) {
        etherBalances = [
          await this.apiSCCallService.fetchEtherBalance(
            callerId,
            userAddress,
            ethService,
          ),
        ];
      }

      return {
        balances: allBalances,
        etherBalances,
        message: 'Balances listed successfully',
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "listing all user's ERC721 balances for a specific token",
        'listAllUserERC721BalancesForToken',
        false,
        500,
      );
    }
  }

  /**
   * [List all user's ERC1400 balances for a given token (for all asset classes)]
   *
   * When retrieving a user's balances for a given token, we need to fetch:
   *  - The balances for each asset class (Example: classA, classB, etc.)
   *  - For each asset class, the balances for each token state (Example: locked, reserved, issued, collateral)
   *
   * The purpose of this function is to iterate on asset classes and fetch balances for
   * each of them.
   *
   * Technically speaking, the concatenation of the token state + the asset class
   * is what we call a partition.
   * Example of a partition (32 bytes):
   *    0x6c6f636b656400000000000073756e3300000000000000000000000000000000
   *    --> The 12 first bytes represent the state of the token: 6c6f636b6564000000000000
   *    --> The 20 last bytes represent the asset class of the token: 73756e3300000000000000000000000000000000
   *
   */
  async listAllUserERC1400BalancesForToken(
    tenantId: string,
    callerId: string,
    user: User,
    userTokenLinks: Array<Link>,
    token: Token,
    assetClassKey: string,
    withEthBalance: boolean,
    extensionDeployed: boolean,
  ): Promise<ListAllBalancesOutput> {
    try {
      const ethService: EthService =
        await this.ethHelperService.createEthService(
          tenantId,
          EthServiceType.WEB3,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          false, // networkShallExist
        );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        return {
          balances: undefined,
          etherBalances: undefined,
          message: `Issue listing ERC1400 balances: network with chainId ${
            token[TokenKeys.DEFAULT_CHAIN_ID]
          } can't be reached`,
        };
      }

      const assetClasses: Array<string> =
        assetClassKey && token[TokenKeys.ASSET_CLASSES].includes(assetClassKey)
          ? [assetClassKey]
          : token[TokenKeys.ASSET_CLASSES];

      // When the deployment is still pending, the partitions can not be fetched, we shall not fetch them (and return empty array)
      const tokenAddress: string = token[TokenKeys.DEFAULT_DEPLOYMENT];
      const totalPartitions: Array<string> =
        tokenAddress && web3Utils.isAddress(tokenAddress)
          ? await this.apiSCCallService.totalPartitions(
              callerId,
              token[TokenKeys.STANDARD],
              token[TokenKeys.DEFAULT_DEPLOYMENT],
              ethService,
            )
          : [];

      const allAssetClassesBalances: Array<ERC1400ClassBalances> =
        await Promise.all(
          assetClasses.map((assetClassKey: string) => {
            const wallet: Wallet =
              this.walletService.extractWalletFromUserEntityLinks(
                user,
                userTokenLinks,
                assetClassKey,
              );
            const userAddress: string = wallet[WalletKeys.WALLET_ADDRESS];

            return this.listAllUserERC1400BalancesForAssetClass(
              callerId,
              userAddress,
              token[TokenKeys.STANDARD],
              token[TokenKeys.DEFAULT_DEPLOYMENT],
              assetClassKey,
              totalPartitions,
              ethService,
              extensionDeployed,
            );
          }),
        );

      const allBalancesTotal: number = allAssetClassesBalances.reduce(
        (a: number, b: ERC1400ClassBalances) =>
          a + b[BalancesKeys.CLASSES__BALANCES__TOTAL],
        0,
      );

      const allBalancesSpendableTotal: number = allAssetClassesBalances.reduce(
        (a: number, b: ERC1400ClassBalances) =>
          a + b[BalancesKeys.CLASSES__BALANCES__TOTAL_SPENDABLE],
        0,
      );

      const allBalances: ERC1400Balances = {
        [BalancesKeys.CLASSES]: allAssetClassesBalances.map(
          (balances: ERC1400ClassBalances, index: number) => {
            return {
              [BalancesKeys.CLASSES__NAME]: assetClasses[index],
              [BalancesKeys.CLASSES__BALANCES]: balances,
            };
          },
        ),
        [BalancesKeys.TOTAL]: allBalancesTotal,
        [BalancesKeys.TOTAL_SPENDABLE]: allBalancesSpendableTotal,
      };

      let etherBalances: Array<number>;
      if (withEthBalance) {
        etherBalances = await Promise.all(
          assetClasses.map((assetClassKey: string) => {
            const wallet: Wallet =
              this.walletService.extractWalletFromUserEntityLinks(
                user,
                userTokenLinks,
                assetClassKey,
              );
            const userAddress: string = wallet[WalletKeys.WALLET_ADDRESS];

            return this.apiSCCallService.fetchEtherBalance(
              callerId,
              userAddress,
              ethService,
            );
          }),
        );
      }

      return {
        balances: allBalances,
        etherBalances,
        message: 'Balances listed successfully',
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "lisiting all user's ERC1400 balances for a specific token",
        'listAllUserERC1400BalancesForToken',
        false,
        500,
      );
    }
  }

  /**
   * [List all user's ERC1400, ERC721 and ERC20 balances for a given token (for all asset classes of ERC1400)]
   *
   */
  async listAllUserBalancesForAnyToken(
    tenantId: string,
    callerId: string,
    user: User,
    userTokenLinks: Array<Link>,
    token: Token,
    assetClassKey: string,
    withEthBalance: boolean,
    extensionDeployed: boolean,
  ): Promise<ERC20Balances | ERC721Balances | ERC1400Balances> {
    // In case a network doesn't exist anymore (once it has been deleted), we shall not try to fetch data
    // from the chain because the calls would fail

    const {
      validChainIdsMap, // TO BE DEPRECATED (replaced by 'networkKey')
      validNetworkKeysMap,
    } = await this.networkService.retrieveValidNetworksMap(tenantId);

    const chainId: string = token[TokenKeys.DEFAULT_CHAIN_ID]; // TO BE DEPRECATED (replaced by 'networkKey')
    const networkKey: string = token[TokenKeys.DEFAULT_NETWORK_KEY];

    if (!(validChainIdsMap[chainId] || validNetworkKeysMap[networkKey])) {
      // In case network doesn't exist anymore (invalid chainId), we can't fetch balances and return 0 instead.
      return {
        [BalancesKeys.TOTAL]: 0,
      };
    }

    let allBalances: ERC20Balances | ERC721Balances | ERC1400Balances;
    if (token[TokenKeys.STANDARD].includes('ERC1400')) {
      allBalances = (
        await this.listAllUserERC1400BalancesForToken(
          tenantId,
          callerId,
          user,
          userTokenLinks,
          token,
          assetClassKey,
          withEthBalance,
          extensionDeployed,
        )
      ).balances;
    } else if (token[TokenKeys.STANDARD].includes('ERC721')) {
      allBalances = (
        await this.listAllUserERC721BalancesForToken(
          tenantId,
          callerId,
          user,
          userTokenLinks,
          token,
          withEthBalance,
        )
      ).balances;
    } else if (token[TokenKeys.STANDARD].includes('ERC20')) {
      allBalances = (
        await this.listAllUserERC20BalancesForToken(
          tenantId,
          callerId,
          user,
          userTokenLinks,
          token,
          withEthBalance,
        )
      ).balances;
    } else {
      ErrorService.throwError(
        `unknown token standard (${token[TokenKeys.STANDARD]})`,
      );
    }
    return allBalances;
  }

  /**
   * [Retrieve balances for a specific asset classes]
   *
   * When retrieving a user's balances for a given token, we need to fetch:
   *  - The balances for each asset class (Example: classA, classB, etc.)
   *  - For each asset, the balances for each token state (Example: locked, reserved, issued, collateral)
   *
   * The purpose of this function is to iterate on token states (locked, reserved, issued, collateral)
   * for a given asset class and fetch balances for each of them.
   *
   * Technically speaking, the concatenation of the token state + the asset class
   * is what we call a partition.
   * Example of a partition (32 bytes):
   *    0x6c6f636b656400000000000073756e3300000000000000000000000000000000
   *    --> The 12 first bytes represent the state of the token: 6c6f636b6564000000000000
   *    --> The 20 last bytes represent the asset class: 73756e3300000000000000000000000000000000
   *
   */
  async listAllUserERC1400BalancesForAssetClass(
    callerId: string,
    userAddress: string,
    tokenStandard: SmartContract,
    tokenAddress: string,
    assetClass: string,
    totalPartitions: Array<string>,
    ethService: EthService,
    extensionDeployed: boolean,
  ): Promise<ERC1400ClassBalances> {
    try {
      const allPartitions: Array<string> =
        this.partitionService.listAllPartitionsForAssetClass(
          assetClass ? assetClass : '',
        );

      const allPartitionsBalances: Array<Array<number>> = await Promise.all(
        allPartitions.map((partition: string) => {
          if (totalPartitions.includes(partition)) {
            return Promise.all([
              this.apiSCCallService.balanceOfByPartition(
                callerId,
                tokenStandard,
                userAddress,
                partition,
                tokenAddress,
                ethService,
              ),
              extensionDeployed
                ? this.apiSCCallService.spendableBalanceOfByPartition(
                    callerId,
                    userAddress,
                    partition,
                    tokenAddress,
                    ethService,
                  )
                : 0,
            ]);
          } else {
            return Promise.resolve([0, 0]);
          }
        }),
      );

      const allStatesBalances: Array<ERC1400StateBalance> =
        allPartitionsBalances.map((balances: Array<number>, index: number) => {
          const balance = balances[0];
          const spendableBalance = extensionDeployed
            ? balances[1]
            : balances[0];
          return {
            [BalancesKeys.CLASSES__BALANCES__STATES__NAME]:
              this.partitionService.retrieveTokenStateFromPartition(
                allPartitions[index],
              ),
            [BalancesKeys.CLASSES__BALANCES__STATES__BALANCE]: balance,
            [BalancesKeys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]:
              spendableBalance,
          };
        });
      const allStatesBalancesTotal = allPartitionsBalances.reduce(
        (a, b) => a + b[0],
        0,
      );
      const allStatesBalancesSpendableTotal = allPartitionsBalances.reduce(
        (a, b) => a + b[1],
        0,
      );

      const allBalancesForAssetClass: ERC1400ClassBalances = {
        [BalancesKeys.CLASSES__BALANCES__STATES]: allStatesBalances,
        [BalancesKeys.CLASSES__BALANCES__TOTAL]: allStatesBalancesTotal,
        [BalancesKeys.CLASSES__BALANCES__TOTAL_SPENDABLE]:
          allStatesBalancesSpendableTotal,
      };

      return allBalancesForAssetClass;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "lisiting all user's ERC1400 balances for a specific asset class",
        'listAllUserERC1400BalancesForAssetClass',
        false,
        500,
      );
    }
  }

  /**
   * [Check token ownership]
   *
   * This function is used as a middleware to check the token ownership, before a user
   * wants to perform an action on tokens (transfer, burn, etc.).
   * This is useful to verify if the user indeed has the tokens he wants to
   * perform an action on.
   *
   * The verification is done on-chain, by making calls directly to the smart contract.
   */
  async checkTokenOwnership(
    tenantId: string,
    tokenCategory: TokenCategory,
    callerId: string,
    userWallet: Wallet,
    token: Token,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string, // only for non-fungible
    quantity: number, // only for fungible of hybrid,
    onlySpendableTokens: boolean,
  ): Promise<boolean> {
    try {
      const ethService: EthService =
        await this.ethHelperService.createEthService(
          tenantId,
          EthServiceType.WEB3,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // networkShallExist (an error shall be thrown if network doesn't exist)
        );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        ErrorService.throwError(
          "Shall never happen: network is not reachable but error shall have been thrown inside 'createEthService' function",
        );
      }

      if (tokenCategory === TokenCategory.FUNGIBLE) {
        const balance: number = await this.apiSCCallService.balanceOf(
          callerId,
          token[TokenKeys.STANDARD],
          userWallet[WalletKeys.WALLET_ADDRESS],
          token[TokenKeys.DEFAULT_DEPLOYMENT],
          ethService,
        );

        if (balance < quantity) {
          ErrorService.throwError(
            `insufficient token balance: ${quantity} larger than ${balance} remaining\n`,
          );
        }
      } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
        const owner: string = await this.apiSCCallService.ownerOf(
          callerId,
          token[TokenKeys.STANDARD],
          tokenIdentifier,
          token[TokenKeys.DEFAULT_DEPLOYMENT],
          ethService,
        );
        const userAddress: string = userWallet[WalletKeys.WALLET_ADDRESS];
        if (owner !== userAddress) {
          ErrorService.throwError(
            `invalid token owner: ${userAddress} is not the owner of token with identifier ${tokenIdentifier}, (${owner} instead)\n`,
          );
        }
      } else if (tokenCategory === TokenCategory.HYBRID) {
        const partition: string = this.partitionService.createPartition(
          tokenState,
          tokenClass,
        );

        // In case the token is a holdable token (V3), check the spendable partition balance
        let spendablePartitionBalance: number;
        if (
          onlySpendableTokens &&
          SmartContractVersion[token[TokenKeys.STANDARD]] === ScVersion.V3
        ) {
          spendablePartitionBalance =
            await this.apiSCCallService.spendableBalanceOfByPartition(
              callerId, // required for cache management
              userWallet[WalletKeys.WALLET_ADDRESS],
              partition,
              token[TokenKeys.DEFAULT_DEPLOYMENT],
              ethService,
            );
        }

        // In other cases, check the partition balance
        const partitionBalance: number =
          await this.apiSCCallService.balanceOfByPartition(
            callerId,
            token[TokenKeys.STANDARD],
            userWallet[WalletKeys.WALLET_ADDRESS],
            partition,
            token[TokenKeys.DEFAULT_DEPLOYMENT],
            ethService,
          );

        if (spendablePartitionBalance < quantity) {
          ErrorService.throwError(
            `insufficient ${tokenState} token spendable balance in class ${tokenClass}: ${quantity} larger than ${spendablePartitionBalance} spendable (totalBalance: ${partitionBalance}, including spendableBalance: ${spendablePartitionBalance})`,
          );
        } else if (partitionBalance < quantity) {
          ErrorService.throwError(
            `insufficient ${tokenState} token balance in class ${tokenClass}: ${quantity} larger than ${partitionBalance} remaining`,
          );
        }
      } else {
        ErrorService.throwError(`unknown token category (${tokenCategory})`);
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking token ownership',
        'checkTokenOwnership',
        false,
        500,
      );
    }
  }
}
