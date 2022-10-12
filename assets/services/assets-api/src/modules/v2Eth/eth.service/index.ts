import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import {
  keys as EthServiceKeys,
  EthServiceType,
  EthService,
} from 'src/types/ethService';
import { NetworkService } from 'src/modules/v2Network/network.service';
import { keys as NetworkKeys, Network } from 'src/types/network';
import { keys as WalletKeys, Wallet, WalletType } from 'src/types/wallet';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { generateSimpleCode } from 'src/utils/codeGenerator';
import web3Utils from 'web3-utils';

import { walletTypeRevertedMap } from 'src/modules/v2Wallet/wallet.service/walletTypeMap';

@Injectable()
export class EthHelperService {
  constructor(
    private readonly networkService: NetworkService,
    private readonly apiSCCallService: ApiSCCallService,
  ) {}
  /**
   * [Create ethService object]
   *
   * 'createEthService' shall be deprecated and replaced by 'createEthServiceWithNetworkKey'
   *
   *  "ethService" is an object required as parameter everytime a transaction request
   *  is made to api-smart-contract (directly or indirectly through api-kyc).
   *  Default values from config file are used to craft the object when it is not
   *  provided as parameter.
   *
   *  "ethService" object contains 2 fields:
   *    - type: contains information on which transaction orchestration technology
   *    shall be used to send the transaction (web3, orchestrate, ledger, etc.)
   *    - data: contains information on which blockchain network to connect to
   *    (Main Ethereum network, Ropsten test network, Codefi Test Network, etc.)
   *
   *  "Expected input format when creating new token":
   *    {
   *      "type": Orchestrate|Web3|Ledger,
   *      "data": {
   *        "chainId": 1234456 // OPTIONAL as the defaultNetwork chainId will be chosen if empty
   *      }
   *    }
   *
   *  "Expected input format when sending a transaction for existing token":
   *    {
   *      "type": Orchestrate|Web3|Ledger,
   *      "data": {
   *        "chainId": 1234456 // OPTIONAL as the chainId is already stored in token object
   *      }
   *    }
   *
   * - "_forceChainId" is an OPTIONAL parameter to overwrite the network in the ethService object
   *
   */
  async createEthService(
    tenantId: string,
    ethServiceType: EthServiceType,
    chainId: string, // TO BE DEPRECATED (replaced by 'networkKey')
    networkKey: string,
    networkShallExist: boolean,
  ): Promise<EthService> {
    try {
      const network: Network =
        chainId || networkKey
          ? await this.networkService.retrieveNetwork(
              tenantId,
              chainId, // TO BE DEPRECATED (replaced by 'networkKey')
              networkKey,
              networkShallExist, // networkShallExist (if set to 'true', an error is thrown if network doesn't exist)
            )
          : await this.networkService.retrieveDefaultNetwork(
              tenantId,
              true, // checkNetworkIsAlive
            );

      if (network && network[NetworkKeys.IS_ALIVE]) {
        const ethService: EthService = {
          [EthServiceKeys.TYPE]: ethServiceType,
          [EthServiceKeys.DATA]: network,
        };

        return ethService;
      } else {
        if (networkShallExist) {
          ErrorService.throwError(
            `${
              chainId
                ? `network with chainId ${chainId?.toString()}`
                : `default network with chainId ${
                    network?.[NetworkKeys.CHAIN_ID]
                  }`
            } was found in config.networks.js but can not be reached on endpoint ${
              network[NetworkKeys.RPC_ENDPOINT]
            }`,
          );
        } else {
          return undefined;
        }
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating ethereum service',
        'createEthService',
        false,
        500,
      );
    }
  }

  /**
   * [Create ethService object]
   *
   * 'createEthService' shall be deprecated and replaced by 'createEthServiceWithNetworkKey'
   */
  async createEthServiceWithNetworkKey(
    tenantId: string,
    ethServiceType: EthServiceType,
    networkKey: string,
    networkShallExist: boolean,
  ): Promise<EthService> {
    try {
      const network: Network = await this.networkService.retrieveNetwork(
        tenantId,
        undefined, // chainId (deprecated)
        networkKey, // networkKey (shall replace 'chainId')
        networkShallExist, // networkShallExist (if set to 'true', an error is thrown if network doesn't exist)
      );

      if (network && network[NetworkKeys.IS_ALIVE]) {
        const ethService: EthService = {
          [EthServiceKeys.TYPE]: ethServiceType,
          [EthServiceKeys.DATA]: network,
        };

        return ethService;
      } else {
        if (networkShallExist) {
          ErrorService.throwError(
            `network with key ${networkKey} was found in config.networks.js but can not be reached on endpoint ${
              network[NetworkKeys.RPC_ENDPOINT]
            }`,
          );
        } else {
          return undefined;
        }
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating ethereum service with network key',
        'createEthServiceWithNetworkKey',
        false,
        500,
      );
    }
  }

  async createEthServiceForWallet(
    tenantId: string,
    wallet: Wallet,
    chainId: string, // TO BE DEPRECATED (replaced by 'networkKey')
    networkKey: string,
    checkEthBalance: boolean,
    authToken?: string,
  ): Promise<EthService> {
    try {
      let ethServiceType: EthServiceType;
      if (
        wallet[WalletKeys.WALLET_NEW_TYPE] &&
        Object.keys(walletTypeRevertedMap).includes(
          wallet[WalletKeys.WALLET_NEW_TYPE],
        )
      ) {
        ethServiceType =
          walletTypeRevertedMap[wallet[WalletKeys.WALLET_NEW_TYPE]]
            .ethServiceType;
      } else {
        ErrorService.throwError(
          `assets-api is not configured to support wallets of type ${
            wallet[WalletKeys.WALLET_NEW_TYPE]
          }`,
        );
      }

      if (!ethServiceType) {
        ErrorService.throwError(
          `shall never happen: undefined ethServiceType for walletType: ${
            wallet[WalletKeys.WALLET_NEW_TYPE]
          }`,
        );
      }

      if (wallet[WalletKeys.WALLET_TYPE] === WalletType.VAULT_DEPRECATED) {
        // Those wallets have been lost in a migration of the Vault
        // during an Orchestrate upgrade in September 2021
        ErrorService.throwError(
          `wallet ${
            wallet[WalletKeys.WALLET_ADDRESS]
          } is invalid, it can't be found in the Vault anymore`,
        );
      }

      const ethService: EthService = await this.createEthService(
        tenantId,
        ethServiceType,
        chainId, // TO BE DEPRECATED (replaced by 'networkKey')
        networkKey,
        true, // networkShallExist (an error shall be thrown if network doesn't exist)
      );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        ErrorService.throwError(
          "Shall never happen: network is not reachable but error shall have been thrown inside 'createEthService' function",
        );
      }

      if (checkEthBalance) {
        // Check ETH balance is hign enough
        await this.checkEthBalance(
          tenantId,
          wallet[WalletKeys.WALLET_ADDRESS],
          ethService,
          authToken,
        );
      }

      return ethService;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating ethereum service for wallet',
        'createEthServiceForWallet',
        false,
        500,
      );
    }
  }

  /**
   * [Check if transaction is asynchronous]
   *
   * This function is used to determine, based on the "ethService" object passed as
   * parameter when requesting the transaction, whether or not the transaction orchestrator
   * chosen (web3, orchestrate, ledger), is synchronous or not.
   *
   * This information is important as:
   *  - In the case of a synchronous transaction, the transaction is already validated
   *  when the response is received, which means the hook function needs to be
   *  called instantaneously.
   *  - In the case of an asynchronous transaction, the transaction is submitted but
   *  not validated when the response is received, which means the hook function
   *  doesn't needs to be called instantaneously. It will be called later, once the
   *  transaction gets validated.
   *
   */
  checkAsyncTransaction(ethService: EthService): boolean {
    try {
      if (ethService[EthServiceKeys.TYPE] === EthServiceType.ORCHESTRATE) {
        return true;
      } else if (ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER) {
        return true;
      } else if (ethService[EthServiceKeys.TYPE] === EthServiceType.WEB3) {
        return false;
      } else {
        ErrorService.throwError(
          `unknown Ethereum service type: ${ethService[EthServiceKeys.TYPE]}`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if transaction is asynchronous',
        'checkAsyncTransaction',
        false,
        500,
      );
    }
  }

  /**
   * [Check user's ETH balance is sufficient]
   *
   * Some blockchain networks require transactions to be paid with Ether.
   * The purpose of this function is to check whether or not:
   *  - The targeted network requires Ether or not
   *  - If yes, if the user has a sufficient balance of Ether
   *
   */
  async checkEthBalance(
    tenantId: string,
    userAddress: string,
    ethService: EthService,
    authToken: string,
  ): Promise<boolean> {
    try {
      if (
        !(
          ethService &&
          ethService[EthServiceKeys.DATA] &&
          ethService[EthServiceKeys.DATA][NetworkKeys.CHAIN_ID]
        )
      ) {
        ErrorService.throwError(
          `invalid Ethereum service, it doesnt contain a chain ID: ${JSON.stringify(
            ethService,
          )}`,
        );
      }
      const network = await this.networkService.retrieveNetwork(
        tenantId,
        undefined, // chainId (deprecated)
        ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
        true, // networkShallExist
      );
      if (!network[NetworkKeys.ETH_REQUIRED]) {
        // FIXME: Once all networks are boolean (and not strings anymore, remove the second condition)
        return true;
      }

      const tenantFaucets = await this.apiSCCallService.getFaucets(
        network[NetworkKeys.KEY],
        authToken,
      );

      const faucetEthValue = network[NetworkKeys.FAUCET_MIN_ETH_VALUE];
      const networkTokenSymbol = network[NetworkKeys.SYMBOL];

      // If at least a tenant faucets has been found, check faucets balances
      if (tenantFaucets.length > 0) {
        let faucetBalanceAvailable = false;
        let faucetWallet;
        tenantFaucets.forEach((faucet) => {
          if (Number(faucet.amount) >= Number(faucetEthValue)) {
            faucetBalanceAvailable = true;
          } else {
            faucetWallet = faucet.creditorAccount;
          }
        });

        if (faucetBalanceAvailable) {
          return true;
        } else {
          ErrorService.throwError(
            `PLEASE LOAD TENANT FAUCET WALLET ${faucetWallet} with at least ${web3Utils.fromWei(
              faucetEthValue,
              'ether',
            )} ${networkTokenSymbol} before sending a transaction`,
          );
        }

        // Otherwise check user wallet balance
      } else {
        const etherBalance = await this.apiSCCallService.fetchEtherBalance(
          generateSimpleCode(), // random code instead of callerId, because we don't want the ETH balance to be cached
          userAddress,
          ethService,
        );

        if (
          Number(etherBalance) >=
          Number(web3Utils.fromWei(faucetEthValue, 'ether'))
        ) {
          return true;
        } else {
          ErrorService.throwError(
            `PLEASE LOAD USER WALLET ${userAddress} with at least ${web3Utils.fromWei(
              faucetEthValue,
              'ether',
            )} ${networkTokenSymbol} before sending a transaction`,
          );
        }
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "checking user's ETH balance",
        'checkEthBalance',
        false,
        500,
      );
    }
  }
}
