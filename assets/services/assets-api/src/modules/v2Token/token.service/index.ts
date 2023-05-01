import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import web3Utils from 'web3-utils';

import { WorkflowInstanceEnum } from 'src/old/constants/enum';
import {
  AssetClassOnChainData,
  ContractDeployed,
  DEFAULT_CLASS_NAME,
  DEFAULT_TOKEN_NAME,
  DEFAULT_TOKEN_SYMBOL,
  keys as TokenKeys,
  Token,
  TOKEN_SYMBOL_MAX_LENGTH,
} from 'src/types/token';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { EthService, EthServiceType } from 'src/types/ethService';
import { PartitionService } from 'src/modules/v2Partition/partition.service';
import { ENTITY_DESCRIPTION_MAX_LENGTH } from 'src/types/entity';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';

import {
  keys as WorkflowInstanceKeys,
  OrderSide,
  WorkflowInstance,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { NavService } from 'src/modules/v2Nav/nav.service';
import { setToLowerCase } from 'src/utils/case';
import {
  CertificateType,
  DEFAULT_FUNGIBLE_TOKEN_STANDARD,
  DEFAULT_HYBRID_TOKEN_STANDARD,
  DEFAULT_NON_FUNGIBLE_TOKEN_STANDARD,
  ERC1820_ACCEPT_MAGIC,
  SmartContract,
  TOKEN_STANDARD,
  TokenCategory,
  ZERO_ADDRESS,
} from 'src/types/smartContract';
import { NestJSPinoLogger } from '@consensys/observability';
import { NetworkService } from 'src/modules/v2Network/network.service';
import { getEnumValues } from 'src/utils/enumUtils';
import {
  AssetData,
  AssetDataKeys,
  CollectibleStorageType,
  DocumentKeys,
  GeneralDataKeys,
} from 'src/types/asset';
import {addNumbersByConvertingIntoBigNumber} from "src/utils/number";

const funderAddress: string = process.env.FUNDER_ADDRESS;

@Injectable()
export class TokenHelperService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly ethHelperService: EthHelperService,
    private readonly partitionService: PartitionService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly navService: NavService,
    private readonly networkService: NetworkService,
  ) {}

  /**
   * [Create parameters for token deployment]
   */
  async createParametersForTokenDeployment(
    callerId: string,
    ethService: EthService,
    tokenStandard: string,
    tokenName: string,
    tokenSymbol: string,
    controller: string,
    certificateSigner: string,
    certificateActivated: boolean, // DEPRECATED (replaced by certificateTypeAsNumber)
    certificateTypeAsNumber: number,
    unregulatedERC20transfersActivated: boolean,
    assetClasses: Array<string>,
    customExtensionAddress: string, // Optional
    initialOwnerAddress: string, // Optional
    baseUri: string, // Optional
    contractUri: string, // Optional
  ): Promise<Array<any>> {
    try {
      if (tokenStandard === SmartContract.ERC20_TOKEN) {
        return [
          tokenName,
          tokenSymbol,
          18, // decimals
        ];
      } else if (tokenStandard === SmartContract.ERC721_TOKEN) {
        return [tokenName, tokenSymbol, baseUri, contractUri];
      } else if (tokenStandard === SmartContract.ERC1400_HOLDABLE_CERTIFICATE) {
        // V3
        const genericExtensionContract: ContractDeployed =
          await this.apiSCCallService.checkGenericTokenExtensionIsDeployed(
            callerId,
            ethService,
          );
        if (!genericExtensionContract.deployed) {
          ErrorService.throwError(
            'shall never happen: no generic token extension is deployed on this network',
          );
        }

        // Check if custom token extension address is valid
        if (customExtensionAddress) {
          await this.checkValidExtensionAddress(
            callerId, // required for cache management
            ethService,
            customExtensionAddress,
          );
        }

        if (initialOwnerAddress && !web3Utils.isAddress(initialOwnerAddress)) {
          ErrorService.throwError(
            `${initialOwnerAddress} is an invalid Ethereum address`,
          );
        }

        return [
          tokenName,
          tokenSymbol,
          1, // granularity
          [controller],
          unregulatedERC20transfersActivated
            ? this.partitionService.createERC20CompliantPartitionsForEachAssetClass(
                assetClasses,
              )
            : [], // Here we set default partitions in the smart contract (tokens from default partitions can be transferred without restriction, e.g. with unregulated ERC20 transfers)
          customExtensionAddress || genericExtensionContract.address,
          initialOwnerAddress || ZERO_ADDRESS,
          certificateSigner,
          certificateTypeAsNumber,
        ];
      } else if (
        // V2
        tokenStandard === SmartContract.ERC1400_CERTIFICATE_SALT || // V2
        tokenStandard === SmartContract.ERC1400_CERTIFICATE_NONCE // V2
      ) {
        return [
          tokenName,
          tokenSymbol,
          1, // granularity
          [controller],
          certificateSigner,
          certificateActivated,
          unregulatedERC20transfersActivated
            ? this.partitionService.createERC20CompliantPartitionsForEachAssetClass(
                assetClasses,
              )
            : [], // Here we set default partitions in the smart contract (tokens from default partitions can be transferred without restriction, e.g. with unregulated ERC20 transfers)
        ];
      } else if (tokenStandard === SmartContract.ERC1400ERC20) {
        // V1
        return [
          tokenName,
          tokenSymbol,
          1, // granularity
          [controller],
          certificateSigner,
          unregulatedERC20transfersActivated
            ? this.partitionService.createERC20CompliantPartitionsForEachAssetClass(
                assetClasses,
              )
            : [], // Here we set default partitions in the smart contract (tokens from default partitions can be transferred without restriction, e.g. with unregulated ERC20 transfers)
        ];
      } else {
        ErrorService.throwError(
          `token standard ${tokenStandard} is not setup this API`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating parameters for token deployment',
        'createParametersForTokenDeployment',
        false,
        500,
      );
    }
  }

  async appendAdditionalOnChainDataForToken(
    tenantId: string,
    callerId: string,
    token: Token,
  ): Promise<Token> {
    try {
      // In case a network doesn't exist anymore (once it has been deleted), we shall not try to fetch data
      // from the chain because the calls would fail
      const {
        validChainIdsMap, // TO BE DEPRECATED (replaced by 'networkKey')
        validNetworkKeysMap,
      } = await this.networkService.retrieveValidNetworksMap(tenantId);

      const chainId: string = token[TokenKeys.DEFAULT_CHAIN_ID]; // TO BE DEPRECATED (replaced by 'networkKey')
      const networkKey: string = token[TokenKeys.DEFAULT_NETWORK_KEY];

      if (!(validChainIdsMap[chainId] || validNetworkKeysMap[networkKey])) {
        // In case the network doesn't exist anymore, we add a flag in the reponse to inform the front-end about it
        return {
          ...token,
          [TokenKeys.DATA]: {
            ...token[TokenKeys.DATA],
            [TokenKeys.DATA_DEPRECATED_CHAIN_ID]: true, // flag to inform the front-end
          },
        };
      }

      if (token[TokenKeys.STANDARD].includes('ERC1400')) {
        token = await this.appendAdditionalOnChainDataForERC1400Token(
          tenantId,
          callerId,
          token,
        );
      } else if (token[TokenKeys.STANDARD].includes('ERC20')) {
        token = await this.appendAdditionalOnChainDataForERC20Token(
          tenantId,
          callerId,
          token,
        );
      }

      // Append owner
      if (token[TokenKeys.DEFAULT_DEPLOYMENT]) {
        // Create Ethereum service
        const ethService: EthService =
          await this.ethHelperService.createEthService(
            tenantId,
            EthServiceType.WEB3,
            chainId, // TO BE DEPRECATED (replaced by 'networkKey')
            networkKey,
            false, // networkShallExist
          );

        if (ethService) {
          // ethService can be undefined in case network doesn't exist anymore or is not alive
          const ownerWallet = await this.apiSCCallService.owner(
            callerId,
            token[TokenKeys.DEFAULT_DEPLOYMENT],
            ethService,
            token[TokenKeys.STANDARD],
          );

          token[TokenKeys.OWNER] = {
            [TokenKeys.OWNER_ADDRESS]: ownerWallet,
          };
        }
      }

      return token;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'appending additional on-chain data for token',
        'appendAdditionalOnChainDataForToken',
        false,
        500,
      );
    }
  }

  async appendAdditionalOnChainDataForERC20Token(
    tenantId: string,
    callerId: string,
    token: Token,
  ): Promise<Token> {
    try {
      token = await this.navService.appendAppropriateNAVToTokenIfExisting(
        tenantId,
        token,
      );

      const ethService: EthService =
        await this.ethHelperService.createEthService(
          tenantId,
          EthServiceType.WEB3,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          false, // networkShallExist
        );

      if (ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        const tokenTotalSupply = token[TokenKeys.DEFAULT_DEPLOYMENT]
          ? await this.apiSCCallService.totalSupply(
              callerId,
              token[TokenKeys.STANDARD],
              token[TokenKeys.DEFAULT_DEPLOYMENT],
              funderAddress,
              ethService,
            )
          : undefined;

        token = {
          ...token,
          [TokenKeys.TOTAL_SUPPLY]: tokenTotalSupply,
        };
      }

      return token;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'appending additional on-chain data for ERC20 token',
        'appendAdditionalOnChainDataForERC20Token',
        false,
        500,
      );
    }
  }

  async appendAdditionalOnChainDataForERC1400Token(
    tenantId: string,
    callerId: string,
    token: Token,
  ): Promise<Token> {
    try {
      token = await this.navService.appendAppropriateNAVToTokenIfExisting(
        tenantId,
        token,
      );

      token =
        await this.navService.appendAppropriateNAVToAssetClassesIfExisting(
          tenantId,
          token,
        );

      const ethService: EthService =
        await this.ethHelperService.createEthService(
          tenantId,
          EthServiceType.WEB3,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          false, // networkShallExist
        );

      if (ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        const extensionAddress: string = token[TokenKeys.DEFAULT_DEPLOYMENT]
          ? (
              await this.apiSCCallService.retrieveTokenExtension(
                callerId,
                ethService,
                token[TokenKeys.DEFAULT_DEPLOYMENT],
              )
            ).address
          : undefined;

        const [defaultPartitions, totalPartitions]: [
          Array<string>,
          Array<string>,
        ] = token[TokenKeys.DEFAULT_DEPLOYMENT]
          ? await Promise.all([
              this.apiSCCallService.getDefaultPartitions(
                callerId,
                token[TokenKeys.STANDARD],
                token[TokenKeys.DEFAULT_DEPLOYMENT],
                funderAddress,
                ethService,
              ),
              this.apiSCCallService.totalPartitions(
                callerId,
                token[TokenKeys.STANDARD],
                token[TokenKeys.DEFAULT_DEPLOYMENT],
                ethService,
              ),
            ])
          : [undefined, undefined];

        const allPartitions: Array<string> = totalPartitions
          ? [...totalPartitions]
          : [];

        if (defaultPartitions) {
          for (let index = 0; index < defaultPartitions.length; index++) {
            const defaultPartition = defaultPartitions[index];
            if (allPartitions.indexOf(defaultPartition) < 0) {
              allPartitions.push(defaultPartition);
            }
          }
        }

        const partitionSupplies: Array<number> = allPartitions
          ? await Promise.all(
              allPartitions.map((partition: string) => {
                return this.apiSCCallService.totalSupplyByPartition(
                  callerId,
                  token[TokenKeys.STANDARD],
                  partition,
                  token[TokenKeys.DEFAULT_DEPLOYMENT],
                  funderAddress,
                  ethService,
                );
              }),
            )
          : undefined;

        const tokenTotalSupply = token[TokenKeys.DEFAULT_DEPLOYMENT]
          ? await this.apiSCCallService.totalSupply(
              callerId,
              token[TokenKeys.STANDARD],
              token[TokenKeys.DEFAULT_DEPLOYMENT],
              funderAddress,
              ethService,
            )
          : undefined;

        const assetClassesOnChainData =
          defaultPartitions && allPartitions && partitionSupplies
            ? this.partitionService.retrieveFormattedClassesAndStatesFromOnChainData(
                defaultPartitions,
                allPartitions,
                partitionSupplies,
                tokenTotalSupply,
              )
            : undefined;

        const assetClassesTotalSupply = assetClassesOnChainData
          ? assetClassesOnChainData.reduce(
              (supply: number, assetClassData: AssetClassOnChainData) => {
                return (
                  addNumbersByConvertingIntoBigNumber(supply, assetClassData[
                    TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES_TOTAL_SUPPLY
                    ])
                );
              },
              0,
            )
          : undefined;

        if (
          assetClassesTotalSupply &&
          assetClassesTotalSupply !== tokenTotalSupply
        ) {
          ErrorService.throwError(
            `shall never happen: asset classes total supply ${assetClassesTotalSupply} is different from token total supply ${tokenTotalSupply}`,
          );
        }

        token = {
          ...token,
          [TokenKeys.EXTENSION_ADDRESS]: extensionAddress,
          [TokenKeys.TOTAL_SUPPLY]: tokenTotalSupply,
          [TokenKeys.ASSET_CLASSES_ON_CHAIN]: assetClassesOnChainData,
          [TokenKeys.TOKEN_STATES]: this.partitionService.listAllTokenStates(),
        };
      }

      return token;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'appending additional on-chain data for ERC1400 token',
        'appendAdditionalOnChainDataForERC1400Token',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve token standard if valid or retrieve default one]
   */
  retrieveTokenStandardIfValidOrRetrieveDefaultOne(
    tokenCategory: TokenCategory,
    tokenStandard: SmartContract,
  ): SmartContract {
    try {
      if (!tokenStandard) {
        return this.retrieveDefaultTokenStandard(tokenCategory);
      }
      if (
        TOKEN_STANDARD &&
        TOKEN_STANDARD[tokenCategory] &&
        TOKEN_STANDARD[tokenCategory].includes(tokenStandard)
      ) {
        return tokenStandard;
      } else {
        ErrorService.throwError(
          `${tokenStandard} token standard doesn't belong to standards available for ${tokenCategory} category: ${JSON.stringify(
            TOKEN_STANDARD[tokenCategory],
          )}`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token standard or retrieving default one',
        'retrieveTokenStandardIfValidOrRetrieveDefaultOne',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve default token standard for a given token category]
   */
  retrieveDefaultTokenStandard(tokenCategory: TokenCategory): SmartContract {
    try {
      if (tokenCategory === TokenCategory.FUNGIBLE) {
        return DEFAULT_FUNGIBLE_TOKEN_STANDARD;
      } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
        return DEFAULT_NON_FUNGIBLE_TOKEN_STANDARD;
      } else if (tokenCategory === TokenCategory.HYBRID) {
        return DEFAULT_HYBRID_TOKEN_STANDARD;
      } else {
        ErrorService.throwError(`unknown token category: ${tokenCategory}`);
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving default token standard',
        'retrieveDefaultTokenStandard',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve asset classes if valid or retrieve default one]
   */
  retrieveAssetClassesIfValidOrRetrieveDefaultOne(
    assetClasses: Array<string>,
  ): Array<string> {
    try {
      if (assetClasses && assetClasses.length > 0) {
        assetClasses.map((assetClass: string) => {
          // Security: here we check if the asset class doesn't exceed maximum authorized length
          // Otherwise, the function throws an error
          this.partitionService.listAllPartitionsForAssetClass(assetClass);
        });

        const formattedAssetClass: Array<string> = assetClasses.map(
          (assetClass: string) => {
            return setToLowerCase(assetClass);
          },
        );

        const deduplicatedAssetClasses: Array<string> = [];
        formattedAssetClass.map((assetClassKey: string) => {
          if (deduplicatedAssetClasses.indexOf(assetClassKey) < 0) {
            deduplicatedAssetClasses.push(assetClassKey);
          }
        });

        return deduplicatedAssetClasses;
      } else {
        return [DEFAULT_CLASS_NAME];
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset classes or retrieving default one',
        'retrieveAssetClassesIfValidOrRetrieveDefaultOne',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve token name if valid or retrieve default one]
   */
  retrieveTokenNameIfValidOrRetrieveDefaultOne(tokenName: string): string {
    try {
      if (!tokenName) {
        return DEFAULT_TOKEN_NAME;
      }
      return tokenName;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token name or retrieving default one',
        'retrieveTokenNameIfValidOrRetrieveDefaultOne',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve token symbol if valid or retrieve default one]
   */
  retrieveTokenSymbolIfValidOrRetrieveDefaultOne(tokenSymbol: string): string {
    try {
      if (!tokenSymbol) {
        return DEFAULT_TOKEN_SYMBOL;
      }
      if (tokenSymbol.length > TOKEN_SYMBOL_MAX_LENGTH) {
        ErrorService.throwError(
          `invalid token symbol (${tokenSymbol}): token symbol length(${tokenSymbol.length}) shall not exceed ${TOKEN_SYMBOL_MAX_LENGTH} characters`,
        );
      }
      return tokenSymbol;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token symbol or retrieving default one',
        'retrieveTokenSymbolIfValidOrRetrieveDefaultOne',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve token description if valid]
   */
  retrieveTokenDescriptionIfValid(description: string): string {
    try {
      if (description && description.length > ENTITY_DESCRIPTION_MAX_LENGTH) {
        ErrorService.throwError(
          `invalid token description: token description length(${description.length}) shall not exceed ${ENTITY_DESCRIPTION_MAX_LENGTH} characters`,
        );
      }
      return description;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token description',
        'retrieveTokenDescriptionIfValid',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve certificate type]
   */
  retrieveCertificateTypeIfValid(
    certificateType: CertificateType,
    tokenStandard: SmartContract,
  ): number {
    try {
      const defaultCertificateType = 2; // Salt-based certificate protection is chosen by default
      if (
        !tokenStandard ||
        tokenStandard === SmartContract.ERC1400_HOLDABLE_CERTIFICATE
      ) {
        if (certificateType) {
          if (certificateType === CertificateType.NONE) {
            return 0;
          } else if (certificateType === CertificateType.NONCE) {
            return 1;
          } else if (certificateType === CertificateType.SALT) {
            return 2;
          } else {
            ErrorService.throwError(
              `invalid certificate type (shall be chosen amongst ${CertificateType.NONE}, ${CertificateType.NONCE} and ${CertificateType.SALT})`,
            );
          }
        } else {
          return defaultCertificateType;
        }
      } else {
        return defaultCertificateType;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving certificate if valid',
        'retrieveCertificateTypeIfValid',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve certificate type]
   */
  retrieveTokenStandardAsNumber(tokenStandard: SmartContract): number {
    try {
      // Enum in smart contract
      // enum Standard {Undefined, HoldableERC20, HoldableERC1400}
      if (tokenStandard) {
        if (tokenStandard === SmartContract.ERC20_TOKEN) {
          return 1; // HoldableERC20
        } else if (
          tokenStandard === SmartContract.ERC1400_HOLDABLE_CERTIFICATE
        ) {
          return 2; // HoldableERC1400
        } else {
          ErrorService.throwError(
            `invalid token standard: shall be chosen amongst ${SmartContract.ERC20_TOKEN} and ${SmartContract.ERC1400_HOLDABLE_CERTIFICATE}`,
          );
        }
      }

      return 2; // HoldableERC1400 is chosen by default
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token standard as number',
        'retrieveTokenStandardAsNumber',
        false,
        500,
      );
    }
  }

  /**
   * [Append workflow data to a given token]
   */
  async appendWorflowDataToToken(
    tenantId: string,
    token: Token,
  ): Promise<Token> {
    try {
      if (
        token &&
        token[TokenKeys.DATA] &&
        token[TokenKeys.DATA][TokenKeys.DATA__WORKFLOW_INSTANCE_ID]
      ) {
        const workflowInstanceId =
          token[TokenKeys.DATA][TokenKeys.DATA__WORKFLOW_INSTANCE_ID];

        // There is supposed to be one unique workflow instance with the right ID
        // Nevertheless, if the issuer has already been deleted, all his workflow
        // instances have been deleted as well, which is why the workflow instance
        // doesn't exist anymore.
        const workflowInstances: Array<WorkflowInstance> =
          await this.workflowService.retrieveWorkflowInstances(
            tenantId,
            WorkflowInstanceEnum.id,
            Number(workflowInstanceId),
            undefined, // idempotencyKey
            undefined,
            undefined,
            undefined,
            undefined, // entityType
            WorkflowType.TOKEN,
            undefined, // otherWorkflowType
            false,
          );
        if (workflowInstances?.length > 0) {
          return {
            ...token,
            [TokenKeys.DATA]: {
              ...token[TokenKeys.DATA],
              ...workflowInstances[0][WorkflowInstanceKeys.DATA],
              // Example...
              // "transaction": {
              //  "deployed": {
              //    "status": "validated",
              //    "transactionId": "15b3c895-530f-4241-9fb4-a0872c0ce221"
              //   }
              // },
              [TokenKeys.DATA__WORKFLOW_INSTANCE_STATE]:
                workflowInstances[0][WorkflowInstanceKeys.STATE],
              // Example...
              // "workflowInstanceState": "deployed"
            },
          };
        } else {
          return token;
        }
      } else {
        this.logger.info(
          {},
          `DEPRECATED TOKEN: no workflow data for token with ID ${
            token[TokenKeys.TOKEN_ID]
          }`,
        );
        return token;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'appending workflow data to a given token',
        'appendWorflowDataToToken',
        false,
        500,
      );
    }
  }

  /**
   * [Check if the address is a valid extension address]
   */
  async checkValidExtensionAddress(
    callerId: string, // required for cache management
    ethService: EthService,
    extensionAddress: string,
  ): Promise<boolean> {
    try {
      if (!web3Utils.isAddress(extensionAddress)) {
        ErrorService.throwError(
          `${extensionAddress} is an invalid Ethereum address`,
        );
      }

      const contractResponse =
        await this.apiSCCallService.canImplementInterfaceForAddress(
          callerId, // required for cache management
          extensionAddress,
          SmartContract.ERC1400_TOKENS_VALIDATOR,
          ethService,
        );

      if (contractResponse !== ERC1820_ACCEPT_MAGIC) {
        ErrorService.throwError(
          `no extension of type ${SmartContract.ERC1400_TOKENS_VALIDATOR} deployed at address ${extensionAddress}`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if extension address is valid',
        'checkValidExtensionAddress',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve order side array]
   */
  retrieveOrderSideArray(
    propertyLabel: string,
    orderSideArray: Array<OrderSide>,
  ): Array<OrderSide> {
    try {
      const validOrderSideValues: Array<OrderSide> = getEnumValues(OrderSide);
      let invalidOrderSideValue: OrderSide;
      if (orderSideArray && orderSideArray.length > 0) {
        orderSideArray.map((orderSideValue) => {
          if (!validOrderSideValues.includes(orderSideValue)) {
            invalidOrderSideValue = orderSideValue;
          }
        });

        if (invalidOrderSideValue) {
          ErrorService.throwError(
            `invalid order side array passed as ${propertyLabel}: values shall be chosen amongst ${JSON.stringify(
              validOrderSideValues,
            )} (${invalidOrderSideValue} instead)`,
          );
        }

        return orderSideArray;
      } else {
        return undefined;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving order side array',
        'retrieveOrderSideArray',
        false,
        500,
      );
    }
  }

  /**
   * [Check if the address is a valid extension address]
   */
  async canUpdateAllowlist(
    callerId: string, // required for cache management
    ethService: EthService,
    issuerAddress: string,
    tokenAddress: string,
    tokenStandard: SmartContract,
  ): Promise<boolean> {
    try {
      const isAllowlistAdmin: boolean =
        await this.apiSCCallService.isAllowlistAdmin(
          callerId,
          issuerAddress,
          tokenAddress,
          ethService,
        );

      const tokenControllers: Array<string> =
        await this.apiSCCallService.retrieveTokenExtensionControllers(
          callerId,
          ethService,
          tokenAddress,
        );
      const isTokenController: boolean =
        tokenControllers.includes(issuerAddress);

      const owner: string = await this.apiSCCallService.owner(
        callerId,
        tokenAddress,
        ethService,
        tokenStandard,
      );
      const isTokenOwner: boolean = issuerAddress === owner;

      return isAllowlistAdmin || isTokenController || isTokenOwner;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if issuer can update allowlist',
        'canUpdateAllowlist',
        false,
        500,
      );
    }
  }

  craftContractMetadata(
    tenantId: string,
    assetData: AssetData,
    recipientAddress: string,
    storageType: CollectibleStorageType,
  ): {
    name: string;
    description: string;
    image: string;
    external_link: string;
    seller_fee_basis_points: number;
    fee_recipient: string;
  } {
    const imageKey =
      assetData[AssetDataKeys.ASSET][GeneralDataKeys.IMAGE][
        GeneralDataKeys.IMAGE__BANNER
      ][DocumentKeys.KEY];
    let imageUrl;
    if (storageType === CollectibleStorageType.IPFS) {
      imageUrl = `https://ipfs.io/ipfs/${imageKey}`;
    } else {
      imageUrl = `${process.env.EXTERNAL_STORAGE_API}/public/${tenantId}/${imageKey}`;
    }
    return {
      name: assetData[AssetDataKeys.ASSET][GeneralDataKeys.NAME],
      description: assetData[AssetDataKeys.ASSET][GeneralDataKeys.DESCRIPTION],
      image: imageUrl,
      external_link: 'https://www.consensys.net',
      seller_fee_basis_points: 100, //1%
      fee_recipient: recipientAddress,
    };
  }
}
