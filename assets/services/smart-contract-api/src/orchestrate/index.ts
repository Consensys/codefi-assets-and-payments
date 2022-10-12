import {
  Consumer,
  OrchestrateClient,
  IChain,
  ISendRawRequest,
  ISendTransactionRequest,
  IDeployContractRequest,
  ITransferRequest,
  IRegisterContractRequest,
  IAccount,
  ITransaction,
  IHeaders,
  ICreateAccountRequest,
  IRegisterFaucetRequest,
} from 'pegasys-orchestrate';
import triggerHookFunction from '../web/hookTrigger';
import contractInterfacesFactory from './contractFactory';
import {
  NETWORKS,
  BLOCKCHAIN_NETWORKS,
  ORCHESTRATE_FLAG_ENVIRONMENT_NAME,
  ORCHESTRATE_FLAG_TENANT_ID,
  ORCHESTRATE_FLAG_SERVICE_NAME,
  CodefiService,
  ORCHESTRATE_FLAG_SERVICE_URL,
  ZERO_ADDRESS,
  ORCHESTRATE_USE_DEPRECATED_TYPES,
  ORCHESTRATE_BROKER_HOST,
  ORCHESTRATE_BROKER_PORT,
  ORCHESTRATE_URL,
  ORCHESTRATE_TOPIC_RECOVER,
  ORCHESTRATE_TOPIC_DECODED,
  CODEFI_ENV_ID,
  M2M_TOKEN_CLIENT_ID,
  M2M_TOKEN_CLIENT_SECRET,
  M2M_TOKEN_AUDIENCE,
} from '../config/constants';
import { logger } from '../logging/logger';
import createAxiosClient from '../web/axios';
import { TxStatus } from '../types';

import identityProviderCallServiceInstance from './auth';

const BROKERS = [`${ORCHESTRATE_BROKER_HOST}:${ORCHESTRATE_BROKER_PORT}`];

/**
 * The purpose of this function is to make sure parameters are typed properly, when Orchestrate version >= v21.10.1-alpha.4
 */
const reformatOrchestrateRequest = (request: any) => {
  if (request?.params?.gas !== undefined) {
    // Example gas: 6721975
    request.params.gas = convertBigIntStringToNumberIfRequired(
      request.params.gas,
    );
  }
  if (request?.params?.gasPrice !== undefined) {
    // Example gasPrice: '0x0'
    request.params.gasPrice = convertBigIntStringToHexIfRequired(
      request.params.gasPrice,
    );
  }
  if (request?.params?.value !== undefined) {
    // Example value for 0.1ETH: '0x16345785D8A0000'
    request.params.value = convertBigIntStringToHexIfRequired(
      request.params.value,
    );
  }
  if (request?.params?.nonce !== undefined) {
    // Example noce : 21
    request.params.nonce = convertBigIntStringToNumberIfRequired(
      request.params.nonce,
    );
  }

  return request;
};

/**
 * The purpose of this function is to make sure parameters are typed properly, when passed to Orchestrate.
 *
 * Prior Orchestrate v21.10.1-alpha.4:
 * - Orchestrate was expecting BigInt strings for 'tx.gas'
 * - Example of value expected for max quantity of gas in a tx: "6721975"
 *
 * After Orchestrate v21.10.1-alpha.4 (included):
 * - Orchestrate is expecting a number
 * - Example of value expected for max quantity of gas in a tx: 6721975
 */
const convertBigIntStringToNumberIfRequired = (value: any) => {
  if (value === undefined) {
    return value;
  }

  // In case Orchestrate version < v21.10.1-alpha.4, do nothing
  if (ORCHESTRATE_USE_DEPRECATED_TYPES) {
    return value;
  }

  // In case Orchestrate version >= v21.10.1-alpha.4, convert BigInt strings to number if required
  return Number(value);
};

/**
 * The purpose of this function is to make sure parameters are typed properly, when passed to Orchestrate.
 *
 * Prior Orchestrate v21.10.1-alpha.4:
 * - Orchestrate was expecting BigInt strings for 'tx.value', 'tx.gasLimit', 'faucet.amount' and 'faucet.maxBalance'
 * - Example of value expected for 0.1 ETH: "100000000000000000"
 *
 * After Orchestrate v21.10.1-alpha.4 (included):
 * - Orchestrate is expecting an HEX value prefix by "0x"
 * - Example of value expected for 0.1 ETH: "0x16345785D8A0000"
 */
const convertBigIntStringToHexIfRequired = (value: string) => {
  if (value === undefined) {
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error(
      `shall never happen: unexpected type ${typeof value} for value ${value} (string was expected)`,
    );
  }

  // In case Orchestrate version < v21.10.1-alpha.4, do nothing
  if (ORCHESTRATE_USE_DEPRECATED_TYPES) {
    return value;
  }

  // In case Orchestrate version >= v21.10.1-alpha.4, convert BigInt strings to hex if required
  if (value.startsWith('0x')) {
    return value;
  } else {
    return `0x${Number(value).toString(16)}`;
  }
};

const computeGasPrice = (chainKey) => {
  const network = NETWORKS.find((n) => n.key === chainKey);

  return network.ethRequired ? undefined : '0'; // Orchestrate sets the gasPrice in case it is not specified
};

const decorateTransaction = (
  transaction,
  tenantId: string,
  serviceName: CodefiService,
  serviceUrl: string,
  gasLimit: string, // Example gasLimit: '6721975'
  decorate: boolean,
) => {
  const decoratedTransaction = decorate
    ? {
        ...transaction,
        params: {
          gas: gasLimit, // gasLimit can be 'undefined' but not '0' (in case of 'undefined' it will be handled by Orchestrate)
          ...transaction.params,
          gasPrice: computeGasPrice(transaction.chain), // Example gasPrice: '0'
        },
      }
    : {
        ...transaction,
      };
  decoratedTransaction.labels = {
    [ORCHESTRATE_FLAG_ENVIRONMENT_NAME]: CODEFI_ENV_ID, // CODEFI_ENV_ID is just used to filter transactions sent by this environment
    [ORCHESTRATE_FLAG_TENANT_ID]: tenantId,
    [ORCHESTRATE_FLAG_SERVICE_NAME]: serviceName // FIXME: once Assets-API is ready, no default value shall be set anymore
      ? serviceName
      : CodefiService.ASSETS_API, // serviceName is just used to know if
    [ORCHESTRATE_FLAG_SERVICE_URL]: serviceUrl || '', // Optional: this is used for local Assets-API + remote Smart-Contract-API
  };
  return reformatOrchestrateRequest(decoratedTransaction);
};

class Orchestrate {
  client: OrchestrateClient;
  consumer: Consumer;
  contracts: IRegisterContractRequest[];
  catalog: string[];
  chains: IChain[];

  m2mTokenClientId: string;
  m2mTokenClientSecret: string;
  m2mTokenAudience: string;

  constructor() {
    const codefiEnvId: string = CODEFI_ENV_ID; // It is important to specify a consumer groupId here to handle the case where multiple Codefi environments share the same Orchestrate
    const consumerConsumerGroupId = `${codefiEnvId}-consumer`;

    this.client = new OrchestrateClient(`${ORCHESTRATE_URL}`); // http://localhost:8031

    this.consumer = new Consumer(
      BROKERS,
      [ORCHESTRATE_TOPIC_DECODED, ORCHESTRATE_TOPIC_RECOVER],
      undefined,
      {
        groupId: consumerConsumerGroupId,
      },
    );

    this.contracts = contractInterfacesFactory();
    this.catalog = null;
    this.chains = null;
  }

  async init() {
    try {
      this.m2mTokenClientId = M2M_TOKEN_CLIENT_ID;
      this.m2mTokenClientSecret = M2M_TOKEN_CLIENT_SECRET;
      this.m2mTokenAudience = M2M_TOKEN_AUDIENCE;

      if (!this.m2mTokenClientId) {
        throw new Error('missing env variable: M2M_TOKEN_CLIENT_ID');
      }
      if (!this.m2mTokenClientSecret) {
        throw new Error('missing env variable: M2M_TOKEN_CLIENT_SECRET');
      }
      if (!this.m2mTokenAudience) {
        throw new Error('missing env variable: M2M_TOKEN_AUDIENCE');
      }

      // Orchestrate multi-tenancy
      //   When calling Orchestrate, the 'tenantId' is extracted from authToken.
      //   By default, 'tenantId' can equal be to anything.
      //   There are 2 reserved 'tenantIds' with special rules associated to them:
      //     1) If 'tenantId' === '_' it means the resource can be accessed by anyone (multi-tenant resource).
      //     2) If 'tenantId' === '*' it means the user can create a resource on behalf of another tenant (super user).
      //
      //   In case 2), a super user (user with '*' as 'tenantId' in his authToken), can specify the
      //   'tenantId' of the resource he wants to create by defining the 'X-Tenant-ID' headers.
      //
      //   Consequently the only way to create a multi-tenant resource (resource with '_' as 'tenantId')
      //   is that a super user (user with '*' as 'tenantId' in his authToken) calls the function with
      //   'X-Tenant-ID' headers set to '_'.
      //   We call those headers multi-tenant headers because they allow the creation of multi-tenant resources.

      const superUserAuthToken: string =
        await identityProviderCallServiceInstance.createJwtToken(
          this.m2mTokenClientId,
          this.m2mTokenClientSecret,
          this.m2mTokenAudience,
        );

      const multiTenantHeaders: IHeaders = {
        'X-Tenant-ID': '_',
      };

      await this.initConsumer();
      await this.registerNetworks(superUserAuthToken);
      await this.listChains(superUserAuthToken);
      await this.registerContracts(superUserAuthToken, multiTenantHeaders);
      await this.getRegistryCatalog(superUserAuthToken);
    } catch (err) {
      logger.error(
        {
          err,
        },
        'Orchestrate - could not initialize service',
      );
      throw err;
    }
  }

  async close() {
    await this.consumer.disconnect();
  }

  private async initConsumer() {
    try {
      await this.consumer.connect();
      // Register the event listener before calling consume
      // FIXME - types should be re-added here when we switch this repo to typescript
      this.consumer.on('response', async (message) => {
        const { value } = message.content();

        let txHash: string;
        const { errors, txContext, id, receipt, contextLabels, chain } = value;

        const transactionID = id;

        let environmentName: string;
        let tenantId: string;
        let serviceName: string;
        let serviceUrl: string;

        try {
          if (contextLabels) {
            environmentName = contextLabels[ORCHESTRATE_FLAG_ENVIRONMENT_NAME];
            tenantId = contextLabels[ORCHESTRATE_FLAG_TENANT_ID];
            serviceName = contextLabels[ORCHESTRATE_FLAG_SERVICE_NAME];
            serviceUrl = contextLabels[ORCHESTRATE_FLAG_SERVICE_URL];
          }

          // CODEFI_ENV_ID is just used to filter transactions sent by this environment
          if (environmentName === CODEFI_ENV_ID) {
            logger.info(
              {
                transactionID,
                chain,
                tenantId,
                environmentName,
              },
              `Orchestrate - received a new receipt for transaction ${transactionID} on chain ${chain} from tenant ${tenantId} of this environment ${environmentName}`,
            );

            let txStatus: TxStatus;

            if (errors && errors.length !== 0) {
              if (errors[0].message && /reverted/.test(errors[0].message)) {
                txStatus = TxStatus.REVERTED;
              } else {
                txStatus = TxStatus.FAILED;
              }

              txHash = receipt ? receipt.txHash : undefined;
              logger.error(
                {
                  errors: errors,
                  txContext: txContext,
                },
                `Orchestrate - Transaction ${transactionID} from tenant ${tenantId} of environment ${environmentName} failed on chain ${chain}`,
              );
            } else {
              txHash = receipt ? receipt.txHash : undefined;
              txStatus = receipt.status
                ? TxStatus.VALIDATED
                : TxStatus.REVERTED;

              logger.info(
                {
                  transactionID,
                  chain,
                  tenantId,
                  environmentName,
                  txHash,
                  contractAddress: receipt
                    ? receipt.contractAddress
                    : undefined,
                  txStatus,
                },
                `Orchestrate - Transaction ${transactionID} from tenant ${tenantId} of environment ${environmentName} ${txStatus} on chain ${chain}`,
              );
            }

            if (serviceName === CodefiService.ASSETS_API) {
              await triggerHookFunction(
                transactionID,
                tenantId,
                txHash,
                receipt,
                serviceUrl,
                txStatus,
                errors,
              );
            } else {
              logger.info(
                {
                  transactionID,
                  chain,
                  tenantId,
                  environmentName,
                },
                `Orchestrate - Transaction ${transactionID} on chain ${chain} from tenant ${tenantId} of environment ${environmentName} was not sent by ${CodefiService.ASSETS_API}`,
              );
            }
          } else {
            logger.trace(
              {
                transactionID,
                transactionValue: {
                  errors,
                  txContext,
                  receipt,
                  contextLabels,
                  chain,
                },
              },
              `Orchestrate - received a new receipt for transaction ${transactionID} on chain ${chain} from a different environment`,
            );
          }
        } catch (error) {
          logger.error(
            { error },
            'Orchestrate - Thrown error while consuming message',
          );
        } finally {
          // We commit every messgage (this commit only applies for our consumer group)
          await message.commit();
          logger.debug(
            {
              transactionID,
              receipt,
            },
            `Orchestrate - Message committed for transaction ${transactionID} on chain ${chain}`,
          );
        }
      });

      await this.consumer.consume();
      logger.info(
        {
          BROKERS,
        },
        'Orchestrate - successfully initialized Consumer',
      );
    } catch (err) {
      logger.error(
        {
          err,
        },
        'Orchestrate - could not initialize Consumer',
      );
      throw err;
    }
  }

  private async testNetworkIsAlive(network): Promise<boolean> {
    let networkIsAlive = true;

    const chainIdRequests: string[] = await Promise.all(
      network.urls.map((url) => {
        const noFailureChainIdRequest = async () => {
          try {
            return await createAxiosClient().post(url, {
              jsonrpc: '2.0',
              method: 'net_version',
              params: [],
              id: 67,
            });
          } catch (error) {
            logger.error(
              {
                url,
              },
              `Orchestrate - invalid url for network ${network.name}: ${url}`,
            );
            return 'undefined-call';
          }
        };
        return noFailureChainIdRequest();
      }),
    );

    const chainIds: string[] = chainIdRequests.map((nodeResponse: any) => {
      if (nodeResponse && nodeResponse.data && nodeResponse.data.result) {
        return nodeResponse.data.result;
      } else {
        logger.info(
          {},
          `Orchestrate - invalid response from node for network ${network.name}`,
        );
        return 'undefined-reponse';
      }
    });

    chainIds.forEach((chainId) => {
      if (chainId !== network.chainId) {
        networkIsAlive = false;
        logger.info(
          {},
          `Orchestrate - invalid chainId for network ${network.name} (expected: ${chainId}, current: ${network.chainId})`,
        );
      }
    });

    return networkIsAlive;
  }

  private async registerNetwork(network, authToken: string) {
    try {
      if (network?.chainId && network?.urls && network.urls.length > 0) {
        const networkIsAlive: boolean = await this.testNetworkIsAlive(network);

        if (networkIsAlive) {
          try {
            let headers: IHeaders;
            if (network.tenantID === 'codefi') {
              headers = {
                'X-Tenant-ID': '_',
              };
            } else {
              headers = {
                'X-Tenant-ID': network.tenantID,
              };
            }
            const registeredNework: IChain = await this.client.registerChain(
              {
                ...network,
                chainId: undefined,
                tenantID: undefined, // validation schema doesn't expect tenantID (it is passed through the headers)
              },
              authToken,
              headers,
            );

            logger.info(
              {
                network,
                registeredNework,
              },
              `Orchestrate - successfully registered network ${network.name}`,
            );
          } catch (error) {
            if (!!error && !!error.status && error.status === 409) {
              logger.debug(
                `Orchestrate - network ${network.name} already registered, skipping`,
                {
                  network,
                },
              );
            } else {
              logger.debug(
                `Orchestrate - network ${network.name} failed being registered in Orchestrate`,
                {
                  network,
                },
              );
            }
          }
        } else {
          logger.info(
            {},
            `Orchestrate - bypass ${network.name} network registration since urls are invalid`,
          );
        }
      } else {
        logger.debug(
          `Orchestrate - network ${network.name} is not correctly defined in config file`,
          {
            network,
          },
        );
      }
    } catch (err) {
      const networkName = network?.name || 'undefined';
      // in case the network is already registered

      logger.error(
        {
          err,
          network: JSON.stringify(network),
        },
        `Orchestrate - could not registrate ${networkName} network`,
      );
      throw err;
    }
  }

  private async registerNetworks(authToken: string) {
    try {
      // List all networks to check if if they are already registered, and when it's the case, check if they are registered with the right tenantID
      const registeredNeworks: IChain[] = await this.client.searchChains(
        authToken,
      );
      const registeredNeworksMap: {
        [key: string]: IChain;
      } = registeredNeworks.reduce(
        (map, registeredNework: IChain) => ({
          ...map,
          [registeredNework.name]: registeredNework,
        }),
        {},
      );
      await Promise.all(
        BLOCKCHAIN_NETWORKS.map(async (network) => {
          const registeredNework: IChain = registeredNeworksMap[network.name];

          if (
            registeredNework?.uuid &&
            ((network.tenantID === 'codefi' &&
              registeredNework.tenantID !== '_') ||
              (network.tenantID !== 'codefi' &&
                registeredNework.tenantID !== network.tenantID))
          ) {
            logger.info(
              {
                registeredNework,
                network,
              },
              `Orchestrate - network ${network.name} is registered with the wrong tenantId (expected: ${network.tenantID}; current: ${registeredNework.tenantID}). It needs to be deleted and registered again`,
            );
            await this.client.deleteChain(registeredNework.uuid, authToken);
          }

          if (
            registeredNework?.uuid &&
            !(
              registeredNework.urls.length === network.urls.length &&
              registeredNework.urls[0] === network.urls[0]
            )
          ) {
            // Check if new urls are valid before deleting old network
            const networkIsAlive: boolean = await this.testNetworkIsAlive(
              network,
            );
            if (networkIsAlive) {
              logger.info(
                {
                  registeredNework,
                  network,
                },
                `Orchestrate - network ${
                  network.name
                } is registered with the wrong urls (expected: ${JSON.stringify(
                  network?.urls || {},
                )}; current: ${JSON.stringify(
                  registeredNework?.urls || {},
                )}). It needs to be deleted and registered again`,
              );
              await this.client.deleteChain(registeredNework.uuid, authToken);
            } else {
              logger.info(
                {
                  registeredNework,
                  network,
                },
                `Orchestrate - network ${
                  network.name
                } is registered with the wrong urls (expected: ${JSON.stringify(
                  network?.urls || {},
                )}; current: ${JSON.stringify(
                  registeredNework?.urls || {},
                )}). Nevertheless, it can't be replaced because new urls are invalid`,
              );
            }
          }

          await this.registerNetwork(network, authToken);
        }),
      );
    } catch (err) {
      logger.error(
        {
          err,
          BLOCKCHAIN_NETWORKS,
        },
        'Orchestrate - could not registrate networks',
      );
      throw err;
    }
  }

  async registerContract(
    contract: IRegisterContractRequest,
    authToken: string,
    headers: IHeaders,
  ) {
    try {
      await this.client.registerContract(contract, authToken, headers);
    } catch (err) {
      logger.error(
        {
          err,
          name: contract.name,
        },
        'Orchestrate - could not register contracts',
      );
      throw err;
    }
  }

  async registerContracts(authToken: string, headers: IHeaders) {
    try {
      await Promise.all(
        this.contracts.map((contract: IRegisterContractRequest) =>
          this.registerContract(contract, authToken, headers),
        ),
      );
      logger.info({}, 'Orchestrate - successfully registered contracts');
    } catch (err) {
      logger.error(
        {
          err,
        },
        'Orchestrate - could not register contracts',
      );
      throw err;
    }
  }

  async deployContract(
    transaction: IDeployContractRequest,
    tenantId: string,
    serviceName: CodefiService,
    serviceUrl: string,
    gasLimit: string,
    decorate: boolean,
    forceTenantId: string,
    idempotencyKey: string,
    authToken: string,
  ) {
    const decoratedTransaction: IDeployContractRequest = decorateTransaction(
      transaction,
      tenantId,
      serviceName,
      serviceUrl,
      gasLimit,
      decorate,
    );
    try {
      // If 'forceTenantId' is defined, we generate a new access token with '*' as tenantId, which allows
      // to to create a ressource on behalf of another tenant, by setting 'X-Tenant-ID' headers to 'forceTenantId'.
      // If 'forceTenantId' is not defined, we use the authToken provided by the user who called the api, and
      // headers are not required.
      let superUserAuthToken: string;
      let headers: IHeaders;
      if (forceTenantId) {
        superUserAuthToken =
          await identityProviderCallServiceInstance.createJwtToken(
            this.m2mTokenClientId,
            this.m2mTokenClientSecret,
            this.m2mTokenAudience,
          );

        headers = {
          'X-Tenant-ID': forceTenantId,
        };
      }

      const txResponse: ITransaction = await this.client.deployContract(
        decoratedTransaction,
        idempotencyKey,
        forceTenantId ? superUserAuthToken : authToken, // authToken
        forceTenantId ? headers : undefined, // headers
      );
      logger.info(
        {
          decoratedTransaction,
          transactionID: txResponse.uuid,
        },
        'Orchestrate - successfully sent the contract deployment transaction',
      );
      return txResponse.uuid;
    } catch (err) {
      logger.error(
        {
          err,
          decoratedTransaction,
        },
        'Orchestrate - could not send contract deployment transaction',
      );
      throw err;
    }
  }

  async sendTransaction(
    transaction: ISendTransactionRequest,
    tenantId: string,
    serviceName: CodefiService,
    serviceUrl: string,
    gasLimit: string,
    decorate: boolean,
    forceTenantId: string,
    idempotencyKey: string,
    authToken: string,
  ) {
    const decoratedTransaction: ISendTransactionRequest = decorateTransaction(
      transaction,
      tenantId,
      serviceName,
      serviceUrl,
      gasLimit,
      decorate,
    );
    try {
      // If 'forceTenantId' is defined, we generate a new access token with '*' as tenantId, which allows
      // to to create a ressource on behalf of another tenant, by setting 'X-Tenant-ID' headers to 'forceTenantId'.
      // If 'forceTenantId' is not defined, we use the authToken provided by the user who called the api, and
      // headers are not required.
      let superUserAuthToken: string;
      let headers: IHeaders;
      if (forceTenantId) {
        superUserAuthToken =
          await identityProviderCallServiceInstance.createJwtToken(
            this.m2mTokenClientId,
            this.m2mTokenClientSecret,
            this.m2mTokenAudience,
          );

        headers = {
          'X-Tenant-ID': forceTenantId,
        };
      }

      const txResponse: ITransaction = await this.client.sendTransaction(
        decoratedTransaction,
        idempotencyKey,
        forceTenantId ? superUserAuthToken : authToken, // authToken
        forceTenantId ? headers : undefined, // headers
      );
      logger.info(
        {
          decoratedTransaction,
          transactionID: txResponse.uuid,
        },
        'Orchestrate - successfully sent the transaction',
      );
      return txResponse.uuid;
    } catch (err) {
      logger.error(
        {
          err,
          decoratedTransaction,
        },
        'Orchestrate - could not send transaction',
      );
      throw err;
    }
  }

  async sendRawTransaction(
    transaction: ISendRawRequest,
    tenantId: string,
    serviceName: CodefiService,
    serviceUrl: string,
    gasLimit: string,
    decorate: boolean,
    forceTenantId: string,
    idempotencyKey: string,
    authToken: string,
  ) {
    const decoratedTransaction: ISendRawRequest = decorateTransaction(
      transaction,
      tenantId,
      serviceName,
      serviceUrl,
      gasLimit,
      decorate,
    );
    try {
      // If 'forceTenantId' is defined, we generate a new access token with '*' as tenantId, which allows
      // to to create a ressource on behalf of another tenant, by setting 'X-Tenant-ID' headers to 'forceTenantId'.
      // If 'forceTenantId' is not defined, we use the authToken provided by the user who called the api, and
      // headers are not required.
      let superUserAuthToken: string;
      let headers: IHeaders;
      if (forceTenantId) {
        superUserAuthToken =
          await identityProviderCallServiceInstance.createJwtToken(
            this.m2mTokenClientId,
            this.m2mTokenClientSecret,
            this.m2mTokenAudience,
          );

        headers = {
          'X-Tenant-ID': forceTenantId,
        };
      }

      const txResponse: ITransaction = await this.client.sendRawTransaction(
        decoratedTransaction,
        idempotencyKey,
        forceTenantId ? superUserAuthToken : authToken, // authToken
        forceTenantId ? headers : undefined, // headers
      );
      logger.info(
        {
          decoratedTransaction,
          transactionID: txResponse.uuid,
        },
        'Orchestrate - successfully sent the RAW transaction',
      );
      return txResponse.uuid;
    } catch (err) {
      logger.error(
        {
          err,
          decoratedTransaction,
        },
        'Orchestrate - could not send transaction',
      );
      throw err;
    }
  }

  async transferEth(
    transaction: ITransferRequest,
    tenantId: string,
    serviceName: CodefiService,
    serviceUrl: string,
    gasLimit: string,
    decorate: boolean,
    forceTenantId: string,
    idempotencyKey: string,
    authToken: string,
  ) {
    const decoratedTransaction: ITransferRequest = decorateTransaction(
      transaction,
      tenantId,
      serviceName,
      serviceUrl,
      gasLimit,
      decorate,
    );
    try {
      // If 'forceTenantId' is defined, we generate a new access token with '*' as tenantId, which allows
      // to to create a ressource on behalf of another tenant, by setting 'X-Tenant-ID' headers to 'forceTenantId'.
      // If 'forceTenantId' is not defined, we use the authToken provided by the user who called the api, and
      // headers are not required.
      let superUserAuthToken: string;
      let headers: IHeaders;
      if (forceTenantId) {
        superUserAuthToken =
          await identityProviderCallServiceInstance.createJwtToken(
            this.m2mTokenClientId,
            this.m2mTokenClientSecret,
            this.m2mTokenAudience,
          );

        headers = {
          'X-Tenant-ID': forceTenantId,
        };
      }

      const txResponse: ITransaction = await this.client.transfer(
        decoratedTransaction,
        idempotencyKey,
        forceTenantId ? superUserAuthToken : authToken, // authToken
        forceTenantId ? headers : undefined, // headers
      );
      logger.info(
        {
          decoratedTransaction,
          transactionID: txResponse.uuid,
        },
        'Orchestrate - successfully sent the transaction',
      );
      return txResponse.uuid;
    } catch (err) {
      logger.error(
        {
          err,
          decoratedTransaction,
        },
        'Orchestrate - could not send transaction',
      );
      throw err;
    }
  }

  async generateAccount(
    forceTenantId: string,
    chain: string,
    storeId: string, // optional parameter to specify a different Ethereum store where the wallet shall be created (default: hashicorp vault store called "orchestrate-eth")
    authToken: string,
  ) {
    try {
      // If 'forceTenantId' is defined, we generate a new access token with '*' as tenantId, which allows
      // to to create a ressource on behalf of another tenant, by setting 'X-Tenant-ID' headers to 'forceTenantId'.
      // If 'forceTenantId' is not defined, we use the authToken provided by the user who called the api, and
      // headers are not required.
      let superUserAuthToken: string;
      let headers: IHeaders;
      if (forceTenantId) {
        superUserAuthToken =
          await identityProviderCallServiceInstance.createJwtToken(
            this.m2mTokenClientId,
            this.m2mTokenClientSecret,
            this.m2mTokenAudience,
          );

        headers = {
          'X-Tenant-ID': forceTenantId,
        };
      }

      // Alias example (can be useful for later)
      // const account: IAccount = await this.client.createAccount({ alias: 'account_1' });
      const createAccountRequest: ICreateAccountRequest = {};

      if (chain) {
        createAccountRequest.chain = chain;
      }

      if (storeId) {
        createAccountRequest.storeID = storeId;
      }

      const account: IAccount = await this.client.createAccount(
        createAccountRequest,
        forceTenantId ? superUserAuthToken : authToken, // authToken
        forceTenantId ? headers : undefined, // headers
      );

      let err: string;
      if (!account.address) {
        err =
          'shall never happen: wallet generated by Orchestrate is undefined';
      } else if (account.address.length !== 42) {
        err = `shall never happen: wallet generated by Orchestrate (${account.address}) has incorrect length (${account.address.length} !== 42)`;
      } else if (account.address.substring(0, 2) !== '0x') {
        err = `shall never happen: wallet generated by Orchestrate (${account.address}) doesn't start with 'Ox'`;
      } else if (account.address === ZERO_ADDRESS) {
        err = `shall never happen: wallet generated by Orchestrate (${account.address}) is the zero address`;
      }

      if (err) {
        logger.error(
          {
            err,
            account: account.address,
            headers,
          },
          'Orchestrate - invalid format for generated new account',
        );
        throw err;
      }

      logger.info(
        {
          account: account.address,
          chain,
          headers,
        },
        'Orchestrate - successfully generated a new Account',
      );
      return account.address;
    } catch (err) {
      logger.error(
        {
          err,
        },
        'Orchestrate - could not generate a new account',
      );
      throw err;
    }
  }

  async retrieveAccount(address: string) {
    try {
      // Since we only use this function to know if an account still exists in the vault, we need to perform a cross-tenant research.
      const superUserAuthToken: string =
        await identityProviderCallServiceInstance.createJwtToken(
          this.m2mTokenClientId,
          this.m2mTokenClientSecret,
          this.m2mTokenAudience,
        );

      const account: IAccount = await this.client.getAccount(
        address,
        superUserAuthToken, // We use a "super user' with "*" as tenantId in order to perform a cross-tenant research.
      );

      logger.info(
        {
          account: account,
        },
        `Orchestrate - successfully retrieves account with address ${address}`,
      );
      return account;
    } catch (err) {
      logger.error(
        {
          err,
        },
        `Orchestrate - could retrieve account with address ${address}`,
      );
      throw err;
    }
  }

  async listAllChains() {
    try {
      // Since we use this function to know if a chain exists in the Orchestrate, we need to perform a cross-tenant research.
      const superUserAuthToken: string =
        await identityProviderCallServiceInstance.createJwtToken(
          this.m2mTokenClientId,
          this.m2mTokenClientSecret,
          this.m2mTokenAudience,
        );

      const chainsList = await this.listChains(superUserAuthToken);
      logger.info(
        {
          chainsList,
        },
        'Orchestrate - successfully listed all chains',
      );
      return chainsList;
    } catch (err) {
      logger.error(
        {
          err,
        },
        'Orchestrate - could not list all chains',
      );
      throw err;
    }
  }

  private async listChains(authToken: string) {
    try {
      this.chains = await this.client.searchChains(authToken);
      logger.info(
        {
          chains: this.chains,
        },
        'Orchestrate - successfully listed chains',
      );

      return this.chains;
    } catch (err) {
      logger.error(
        {
          err,
        },
        'Orchestrate - could not list chains',
      );
      throw err;
    }
  }

  private async getRegistryCatalog(authToken: string) {
    try {
      this.catalog = await this.client.getContractsCatalog(authToken);
      logger.info(
        {
          catalog: this.catalog,
        },
        'Orchestrate - successfully retrieved contract catalog',
      );
    } catch (err) {
      logger.error(
        {
          err,
        },
        'Orchestrate - could not get registry catalog',
      );
      throw err;
    }
  }

  async createFaucet(
    faucetWallet: string,
    networkKey: string,
    tenantId: string,
    name: string,
    authToken: string,
    forceTenantId?: string,
  ) {
    try {
      // If 'forceTenantId' is defined, we generate a new access token with '*' as tenantId, which allows
      // to to create a ressource on behalf of another tenant, by setting 'X-Tenant-ID' headers to 'forceTenantId'.
      // If 'forceTenantId' is not defined, we use the authToken provided by the user who called the api, and
      // headers are not required.
      let superUserAuthToken: string;
      let headers: IHeaders;
      if (forceTenantId) {
        superUserAuthToken =
          await identityProviderCallServiceInstance.createJwtToken(
            this.m2mTokenClientId,
            this.m2mTokenClientSecret,
            this.m2mTokenAudience,
          );

        headers = {
          'X-Tenant-ID': forceTenantId,
        };
      }

      const tenantOrchestrateNetworks = await this.client.searchChains(
        authToken,
      );
      const tenantDefaultOrchestrateNetwork = tenantOrchestrateNetworks.find(
        (n) => n.name === networkKey,
      );

      const network = NETWORKS.find((n) => n.key === networkKey);

      const registerFaucetRequest: IRegisterFaucetRequest = {
        name: networkKey + '_' + tenantId + '_' + name,
        creditorAccount: faucetWallet,
        chainRule: tenantDefaultOrchestrateNetwork?.uuid,
        cooldown: '30s',
        amount: convertBigIntStringToHexIfRequired(network.faucetMinEthValue),
        maxBalance: convertBigIntStringToHexIfRequired(
          network.faucetMinEthValue,
        ),
      };

      const registeredFaucet = await this.client.registerFaucet(
        registerFaucetRequest,
        forceTenantId ? superUserAuthToken : authToken,
        forceTenantId ? headers : null,
      );
      logger.info(
        {
          faucetWallet,
          networkKey,
          tenantId,
        },
        'Orchestrate - successfully created a new Faucet',
      );
      return registeredFaucet;
    } catch (err) {
      logger.error(
        {
          err,
        },
        `Orchestrate - could not create a new Faucet for network: ${networkKey} and tenant: ${tenantId} `,
      );
      throw err;
    }
  }

  async getFaucets(networkKey: string, tenantId: string, authToken: string) {
    try {
      const tenantOrchestrateFaucets = await this.client.searchFaucets(
        authToken,
      );

      logger.info(
        {
          faucets: tenantOrchestrateFaucets,
          networkKey,
          tenantId,
        },
        'Orchestrate - successfully retrieved all Orchestrate Faucets',
      );

      // It is necessary to filter on Faucet name by tenantId as for now all faucets are registered
      // in Orchestrate as public ones for the "_" tenant id
      const tenantFaucetsRegex = new RegExp(`^${networkKey}_${tenantId}`);
      const filteredTenantOrchestrateFaucets = tenantOrchestrateFaucets.filter(
        (faucet) => tenantFaucetsRegex.test(faucet.name),
      );

      logger.info(
        {
          faucets: filteredTenantOrchestrateFaucets,
          networkKey,
          tenantId,
        },
        'Orchestrate - successfully retrieved tenant Faucet',
      );
      return filteredTenantOrchestrateFaucets;
    } catch (err) {
      logger.error(
        {
          err,
        },
        `Orchestrate - could not create a new Faucet for network: ${networkKey} and tenant: ${tenantId} `,
      );
      throw err;
    }
  }
}

const orchestrateInstance = new Orchestrate();

export default orchestrateInstance;
