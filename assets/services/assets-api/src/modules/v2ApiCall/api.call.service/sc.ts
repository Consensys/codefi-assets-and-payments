import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { NestJSPinoLogger } from '@consensys/observability';
import web3Utils from 'web3-utils';

import ErrorService from 'src/utils/errorService';

import { keys as NetworkKeys, Network } from 'src/types/network';
import {
  keys as EthServiceKeys,
  EthService,
  EthServiceType,
} from 'src/types/ethService';
import { ApiCallHelperService } from '.';
import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';

import { v4 as uuidv4 } from 'uuid';

import CacheService from 'src/utils/cache';

import { DECIMALS } from 'src/types/decimals';
import { TxReceipt } from 'src/types/transaction/TxReceipt';
import { removeDecimalsFromBalances } from 'src/utils/number';
import {
  TokenCategory,
  functionRules,
  FunctionRule,
  FunctionName,
  SmartContract,
  CertificateType,
  TokenExtensionSetup,
  CERTIFICATE_REQUIRED,
  ZERO_ADDRESS,
  SmartContractVersion,
  ScVersion,
  CertificateTypeIndex,
  EMPTY_CERTIFICATE,
  BatchSupported,
} from 'src/types/smartContract';
import { ContractDeployed } from 'src/types/token';

import Account from 'eth-lib/lib/account';
import { numberToHexa } from 'src/utils/hex';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import { CodefiService } from 'src/types/service';
import execRetry from 'src/utils/retry';
import { checkSolidityBytes32 } from 'src/utils/solidity';
import { keys as HoldKeys, Hold } from 'src/types/hold';
import { generateCode } from 'src/utils/codeGenerator';
import { ListAllNetworksOutput } from 'src/modules/v2Network/network.dto';
import { craftOrchestrateTenantId } from 'src/utils/orchestrate';
import { keys as UserKeys, User } from 'src/types/user';
import { IAccount, IFaucet } from 'pegasys-orchestrate';
import { OrchestrateUtils } from '@consensys/nestjs-orchestrate';
import { keys as ConfigKeys, Config } from 'src/types/config';
import { ApiEntityCallService } from './entity';
import config from 'src/config';

const booleanType = 'boolean';

const SC_HOST: string = config().smartContractApi.url;
const FUNDER_ADDRESS: string = process.env.FUNDER_ADDRESS;
const API_NAME = 'Smart-Contract-Api';

const ERC1820_REGISTRY_ADDRESS = '0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24';

const CERTIFICATE_SIGNER_PRIVATE_KEY: string =
  process.env.CERTIFICATE_SIGNER_PRIVATE_KEY;

const CERTIFICATE_VALIDITY_PERIOD = 1; // Certificate will be valid for 1 hour

const BALANCE_DATA_NAME = 'balance';
const BALANCE_BY_PARTITION_DATA_NAME = 'balanceByPartition';
const DEFAULT_PARTITIONS_DATA_NAME = 'defaultPartitions';
const ETHER_BALANCE_DATA_NAME = 'etherBalance';
const INTERFACE_IMPLEMENTER_DATA_NAME = 'interfaceImplementer';
const IS_ALLOWLISTED_DATA_NAME = 'isAllowlisted';
const IS_BLOCKLISTED_DATA_NAME = 'isBlocklisted';
const OWNER_DATA_NAME = 'owner';
const SPENDABLE_BALANCE_BY_PARTITION_DATA_NAME =
  'spendableBalanceOfByPartition';
const TOTAL_PARTITIONS_DATA_NAME = 'totalPartitions';
const TOTAL_SUPPLY_DATA_NAME = 'totalSupply';
const TOTAL_SUPPLY_BY_PARTITION_DATA_NAME = 'totalSupplyByPartition';
const RETRIEVE_HOLD_DATA_NAME = 'retrieveHoldData';

const NETWORKS_DATA_NAME = 'networks';
const NETWORK_ALIVE = 'networkAlive';

const THROW_ERROR = 'throwError';

// LOCAL SETUP ONLY
//
// For local setup it can be useful to force the callback URL when using a remote Smart-Contract-API:
//  - Go on https://ngrok.com/
//  - Download the ngrok application
//  - Follow instructions on https://dashboard.ngrok.com/get-started/setup to connect your account
//  - Run the "./ngrok http 3002" command in your console, in order to generate a link to call
//    your http://localhost:3002 from a remote service (Example output: http://216f06656d7e.ngrok.io)
//  - Set FORCE_CALLBACK_URL=http://216f06656d7e.ngrok.io in your .env file
//
// FORCE_CALLBACK_URL is set to "undefined" in production, because Assets-API will be called by default in any case.
//
const FORCE_CALLBACK_URL = process.env.FORCE_CALLBACK_URL;

@Injectable()
export class ApiSCCallService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly httpService: HttpService,
    private readonly apiCallHelperService: ApiCallHelperService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {
    this.logger.setContext(ApiSCCallService.name);
  }

  decorateBody(tenantId: string, body: any) {
    return {
      ...body,
      tenantId,
      serviceName: CodefiService.ASSETS_API,
      serviceUrl: FORCE_CALLBACK_URL ? `${FORCE_CALLBACK_URL}/v2` : undefined,
      idempotencyKey: uuidv4(),
    };
  }

  async craftConfig(
    authToken: string,
    tenantConfig: Config, // In case tenantConfig includes an 'enableAutomatedTransactions' flag, we shall be able force the orchestrateTenantId
    ethService: EthService, // In case ethService type is 'ledger', it means the wallet is not stored in Orchestrate Vault and we shall not try to find it
    signer: User, // In case we craft a config for a signed tx, 'signer' parameter is not required
    signerAddress: string, // In case we craft a config for a signed tx, 'signerAddress' parameter is not required
  ) {
    let response;

    const headers: any = {
      Authorization: 'Bearer '.concat(authToken),
    };

    response = { headers };

    // In case wallet is not stored in Orchestrate, we don't need to do further checks
    if (
      ethService &&
      ethService[EthServiceKeys.TYPE] !== EthServiceType.ORCHESTRATE
    ) {
      return response;
    }

    // [CHECK] // In case wallet is stored in Orchestrate, we shall check it can be accessed + we shall check its tenantId is valid
    let orchestrateWallet: IAccount;
    try {
      // In case wallet is stored in Orchestrate, we shall check it can be accessed
      orchestrateWallet = await this.retrieveWallet(signerAddress);
    } catch (error) {
      ErrorService.throwError(
        `shall never happen: no wallet with address ${signerAddress} was found in Orchestrate Vault`,
      );
    }
    const walletTenantId: string = orchestrateWallet?.tenantID;

    const authTokenTenantId: string =
      OrchestrateUtils.extractOrchestrateTenantIdFromAuthToken(authToken);

    // In some cases we need to act on behalf of another user by forcing the tenantId.
    // When 'forceTenantId' is defined, Smart-Contract-Api:
    // - creates an m2m token with '*' as tenantId (this allows to act on behalf of other tenants)
    // - specifies 'forceTenantId' in headers of request made to Orchestrate
    let forceTenantId: string;

    // [EDGE CASE 1][User managed by other users - when not created in Auth0]
    // If user (will be renamed 'entity' after integration with Entity-Api)
    // is not linked to a user in Auth0, we need to act on his behalf by defining
    // 'forceTenantId' param.
    if (signer && !signer[UserKeys.AUTH_ID]) {
      forceTenantId = craftOrchestrateTenantId(
        signer[UserKeys.TENANT_ID],
        signer[UserKeys.USER_ID], // To be renamed entityId after integration with Entity-Api
      );
    }

    let walletTenantIdIsValid: boolean = forceTenantId
      ? walletTenantId === forceTenantId
      : walletTenantId === authTokenTenantId;

    // [EDGE CASE 2][User managed by other users - when tenant allows an m2m client application to send transactions on behalf of users]
    // If tenant config allows m2m client applications to send transactions on behalf of tenant's users,
    // we need to specify 'forceTenantId' param.
    if (
      !walletTenantIdIsValid &&
      tenantConfig &&
      tenantConfig[ConfigKeys.DATA] &&
      tenantConfig[ConfigKeys.DATA][
        ConfigKeys.DATA__ENABLE_DELEGATION_FOR_M2M_CLIENTS
      ] &&
      authTokenTenantId ===
        craftOrchestrateTenantId(
          signer[UserKeys.TENANT_ID],
          OrchestrateUtils.superTenantId,
        )
    ) {
      forceTenantId = craftOrchestrateTenantId(
        signer[UserKeys.TENANT_ID],
        signer[UserKeys.USER_ID], // To be renamed entityId after integration with Entity-Api
      );
    }

    // [EDGE CASE 3][User managed by other users - when tenant allows transaction automation]
    // If tenant config allows transaction automation, e.g. if tenant config allows a transaction
    // to be sent, even though access token doesn't include the same 'OrchestrateTenantId' as the
    // wallet's 'OrchestrateTenantId', we need to specify 'forceTenantId' param.
    if (
      !walletTenantIdIsValid &&
      tenantConfig &&
      tenantConfig[ConfigKeys.DATA] &&
      tenantConfig[ConfigKeys.DATA][
        ConfigKeys.DATA__ENABLE_DELEGATION_FOR_AUTOMATED_TRANSACTIONS
      ]
    ) {
      forceTenantId = craftOrchestrateTenantId(
        signer[UserKeys.TENANT_ID],
        signer[UserKeys.USER_ID], // To be renamed entityId after integration with Entity-Api
      );
    }

    walletTenantIdIsValid = forceTenantId
      ? walletTenantId === forceTenantId
      : walletTenantId === authTokenTenantId;

    if (walletTenantId === OrchestrateUtils.publicTenantId) {
      // publicTenantId = '_', this means the wallet can be accessed by anyone (even if accessTokenTenantId doesn't correspond)
    } else if (!walletTenantIdIsValid) {
      ErrorService.throwError(
        `shall never happen: ${
          forceTenantId
            ? `forced 'orchestrateTenantId' (${forceTenantId})`
            : `'orchestrateTenantId' extracted from access token (${authTokenTenantId})`
        } doesn't correspond to wallet's 'orchestrateTenantId' (${
          orchestrateWallet?.tenantID
        })`,
      );
    }

    // In case 'forceTenantId' is defined, we shall add it as query param and pass it to Smart-Contract-Api
    if (forceTenantId) {
      const params: any = {
        forceTenantId,
      };
      response = {
        ...response,
        params,
      };
    }

    return response;
  }

  adaptName(contractName: SmartContract): string {
    if (contractName === SmartContract.ERC1400ERC20) {
      return 'ERC1400ERC20AuditedV1'; // V1 used by MataCapital
    } else if (contractName === SmartContract.ERC1400_CERTIFICATE_NONCE) {
      return 'ERC1400CertificateNonceAuditedV2'; // V2
    } else if (contractName === SmartContract.ERC1400_CERTIFICATE_SALT) {
      return 'ERC1400CertificateSaltAuditedV2'; // V2 used by StyleInvest
    } else {
      return contractName;
    }
  }

  /**
   * [Create wallet]
   */
  async createWallet(user: User) {
    try {
      const forceTenantId: string = craftOrchestrateTenantId(
        user[UserKeys.TENANT_ID],
        user[UserKeys.USER_ID], // To be renamed entityId after integration with Entity-Api
      );

      const params: any = {
        ethServiceType: EthServiceType.ORCHESTRATE,
        forceTenantId,
      };

      /* If network require ETH we want the account to be funded automatically by orchestrate from the faucet
      if (ethService[EthServiceKeys.DATA].ethRequired) {
        params.chain = ethService[EthServiceKeys.DATA].key;
      } */

      const config: any = { params };

      const retriedClosure = () => {
        return this.httpService
          .get(`${SC_HOST}/wallet/create`, config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 2000, 1.5);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating wallet',
        response,
      );

      this.logger.info(
        {},
        `Wallet created: ${JSON.stringify(response.data)}\n`,
      );

      if (!response.data.address) {
        ErrorService.throwError('no address provided in response');
      }

      return response.data.address;
    } catch (error) {
      ErrorService.throwApiCallError('createWallet', API_NAME, error, 500);
    }
  }

  /**
   * [Retrieve wallet]
   */
  async retrieveWallet(walletAddress: string): Promise<IAccount> {
    try {
      const params: any = {
        address: walletAddress,
      };
      const config: any = { params };

      const response = await this.httpService
        .get(`${SC_HOST}/wallet/retrieve`, config)
        .toPromise();

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving wallet',
        response,
      );

      this.logger.info(
        {},
        `Wallet retrieved: ${JSON.stringify(response.data)}\n`,
      );

      if (!response?.data?.account?.address) {
        ErrorService.throwError('no account provided in response');
      }

      return response?.data?.account;
    } catch (error) {
      ErrorService.throwApiCallError('retrieveWallet', API_NAME, error, 500);
    }
  }

  /**
   * [Craft transaction payload]
   */
  async craftTxPayload(
    tenantId: string,
    contractName: SmartContract,
    scfunctionName: string,
    body: any,
    ethService: EthService,
  ) {
    try {
      const url = `${SC_HOST}/transaction/${this.adaptName(
        contractName,
      )}/${scfunctionName}`;

      const retriedClosure = () => {
        return this.httpService
          .post(
            url,
            this.decorateBody(
              tenantId, // value is not important, but can not be nil, otherwise Smart-Contract-API throws error
              {
                ...body,
                ethServiceType: EthServiceType.RAW_TX_DATA,
                chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY], // value is not important, but can not be nil, otherwise Smart-Contract-API throws error
              },
            ),
            // authToken is not required for this call, because Orchestrate is not called in Smart-Contract-Api
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 2000, 1.5);

      this.apiCallHelperService.checkRequestResponseFormat(
        'crafting transaction payload',
        response,
      );

      if (!response.data.txData) {
        ErrorService.throwError(
          'invalid response format when crafting tx data',
        );
      }

      const payload: string = response.data.txData;

      return payload;
    } catch (error) {
      ErrorService.throwApiCallError('craftTxPayload', API_NAME, error, 500);
    }
  }

  /**
   * [Send a transaction requiring the injection of a certificate produced by the certificate generator]
   */
  async sendCertificateBasedTx(
    callerId: string,
    tenantId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    tokenCategory: TokenCategory,
    contractName: SmartContract,
    functionName: FunctionName,
    body: any,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ): Promise<ApiSCResponse> {
    try {
      if (!body.contractAddress) {
        ErrorService.throwError('missing input parameter (contract address)');
      }
      if (!body.signerAddress) {
        ErrorService.throwError('missing input parameter (signer address)');
      }

      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        body.signerAddress,
      );

      const smartContractFunctionName: string =
        this.retrieveSmartContractFunctionName(tokenCategory, functionName);

      // Step 1: Make a first call to craft the transaction payload

      const transactionPayload = await this.craftTxPayload(
        tenantId,
        contractName,
        smartContractFunctionName,
        body,
        ethService,
      );

      // Step 2: Use the transaction payload (raw transaction) to create associated certificate

      const tokenAddress =
        contractName === SmartContract.ERC1400_TOKENS_VALIDATOR
          ? body.token
          : body.contractAddress;
      const certificate = await this.craftCertificate(
        callerId,
        contractName,
        body.signerAddress,
        tokenAddress,
        transactionPayload,
        ethService,
        undefined, // expiration time
      );

      // Step 3: Inject the certificate in the transaction and send the transaction

      const certificateFieldName: string =
        functionRules[functionName][FunctionRule.CERTIFICATE_FIELD_NAME];

      const decoratedBody: any = {
        ...body,
        [certificateFieldName]: certificate,
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const callPath = `transaction/${this.adaptName(
        contractName,
      )}/${smartContractFunctionName}`;

      const url = `${SC_HOST}/${callPath}`;

      this.logger.info(
        {},
        `SEND TRANSACTION ${smartContractFunctionName} WITH CERTIFICATE`,
      );
      this.logger.info({}, `Url: ${url}`);
      this.logger.info({}, `Body: ${JSON.stringify(decoratedBody)}`);
      const retriedClosure = () => {
        return this.httpService
          .post(url, this.decorateBody(tenantId, decoratedBody), config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 2000, 1.5);
      this.logger.info(
        {},
        `Transaction sent Orchestrate: ${
          response?.data ? JSON.stringify(response?.data) : 'undefined response'
        }`,
      );

      this.checkTxSendingResponseFormat(
        'sending certificate-based transaction',
        response,
        ethService,
      );

      return {
        ...response.data,
        [ApiSCResponseKeys.CALL_PATH]: callPath,
        [ApiSCResponseKeys.CALL_BODY]: decoratedBody,
      };
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendCertificateBasedTx',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Send a simple transaction (which doesn't require a certificate)]
   */
  async sendSimpleTx(
    tenantId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    tokenCategory: TokenCategory,
    contractName: SmartContract,
    functionName: FunctionName,
    body: any,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ): Promise<ApiSCResponse> {
    try {
      if (!body.contractAddress) {
        ErrorService.throwError('missing input parameter (contract address)');
      }
      if (!body.signerAddress) {
        ErrorService.throwError('missing input parameter (signer address)');
      }

      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        body.signerAddress,
      );

      const smartContractFunctionName: string =
        this.retrieveSmartContractFunctionName(tokenCategory, functionName);

      const decoratedBody: any = {
        ...body,
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const callPath = `transaction/${this.adaptName(
        contractName,
      )}/${smartContractFunctionName}`;

      const url = `${SC_HOST}/${callPath}`;

      this.logger.info(
        {},
        `SEND SIMPLE TRANSACTION ${smartContractFunctionName}`,
      );
      this.logger.info({}, `Url: ${url}`);
      this.logger.info({}, `Body: ${JSON.stringify(body)}`);

      const retriedClosure = () => {
        return this.httpService
          .post(url, this.decorateBody(tenantId, decoratedBody), config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 2000, 1.5);

      this.checkTxSendingResponseFormat(
        'sending transaction',
        response,
        ethService,
      );

      return {
        ...response.data,
        [ApiSCResponseKeys.CALL_PATH]: callPath,
        [ApiSCResponseKeys.CALL_BODY]: decoratedBody,
      };
    } catch (error) {
      ErrorService.throwApiCallError('sendSimpleTx', API_NAME, error, 500);
    }
  }

  /**
   * [Deploy contract]
   */
  async deploySmartContract(
    tenantId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    contractName: SmartContract,
    signerAddress: string,
    ethService: EthService,
    argumentValues: Array<any>,
    authToken: string,
    tenantConfig: Config,
  ): Promise<ApiSCResponse> {
    try {
      this.logger.info({}, '****** DEPLOY SMART CONTRACT ******\n');
      this.logger.info(
        {},
        `New ${contractName} smart contract deployed by address ${signerAddress}, on ${
          ethService[EthServiceKeys.DATA][NetworkKeys.NAME]
        }, with arguments: ${JSON.stringify(argumentValues)}\n`,
      );

      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        signerAddress,
      );

      const decoratedBody: any = {
        contractName: this.adaptName(contractName),
        signerAddress,
        arguments: argumentValues,
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const callPath = 'contract/deploy';

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/${callPath}`,
            this.decorateBody(tenantId, decoratedBody),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 2000, 1.5);

      this.checkTxSendingResponseFormat(
        'deploying contract',
        response,
        ethService,
      );

      return {
        ...response.data,
        [ApiSCResponseKeys.CALL_PATH]: callPath,
        [ApiSCResponseKeys.CALL_BODY]: decoratedBody,
      };
    } catch (error) {
      ErrorService.throwApiCallError(
        'deploySmartContract',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Send signed transaction]
   */
  async sendSignedTx(
    tenantId: string,
    signedTx: string,
    ethService: EthService,
    authToken: string,
  ): Promise<ApiSCResponse> {
    try {
      this.logger.info({}, '****** SEND SIGNED TRANSACTION ******\n');

      const headers: any = {
        Authorization: 'Bearer '.concat(authToken),
      };

      const config: any = { headers };

      const decoratedBody = {
        signedTx,
        waitForReceipt: 'false',
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };
      this.logger.info(
        {},
        `Signed tx body: ${JSON.stringify(decoratedBody)}\n`,
      );

      const callPath = 'generic/send-signed-transaction';
      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/${callPath}`,
            this.decorateBody(tenantId, decoratedBody),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 2000, 1.5);

      this.apiCallHelperService.checkRequestResponseFormat(
        'sending signed transaction',
        response,
      );

      return {
        ...response.data,
        [ApiSCResponseKeys.CALL_PATH]: callPath,
        [ApiSCResponseKeys.CALL_BODY]: decoratedBody,
      };
    } catch (error) {
      ErrorService.throwApiCallError('sendSignedTx', API_NAME, error, 500);
    }
  }

  /**
   * [Resend transaction]
   */
  async resendTx(
    tenantId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    callPath: string,
    callBody: any,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ): Promise<ApiSCResponse> {
    try {
      this.logger.info({}, '****** RESEND TRANSACTION ******\n');

      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        callBody?.signerAddress,
      );

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/${callPath}`,
            this.decorateBody(tenantId, callBody),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 2000, 1.5);

      this.apiCallHelperService.checkRequestResponseFormat(
        'resending transaction',
        response,
      );

      return {
        ...response.data,
        [ApiSCResponseKeys.CALL_PATH]: callPath,
        [ApiSCResponseKeys.CALL_BODY]: callBody,
      };
    } catch (error) {
      ErrorService.throwApiCallError('resendTx', API_NAME, error, 500);
    }
  }

  /**
   * [Craft a certificate]
   *
   * This function is used to craft a certificate.
   * The certificate is required to perform any kind of token action (issuance, transfer, etc.) for
   * token ERC1400.
   *
   */
  async craftCertificate(
    callerId: string,
    contractName: SmartContract,
    senderAddress: string,
    tokenAddress: string,
    txPayload: string,
    ethService: EthService,
    expirationTime: Date,
  ): Promise<string> {
    try {
      if (CERTIFICATE_REQUIRED[contractName] === CertificateType.NONE) {
        this.logger.info(
          {},
          `no certificate required for ${contractName} token standard`,
        );
        return '';
      } else if (SmartContractVersion[contractName] === ScVersion.V3) {
        // V3
        let extensionAddress: string;
        const extensionContract: ContractDeployed =
          await this.retrieveTokenExtension(callerId, ethService, tokenAddress);
        if (!extensionContract.deployed) {
          this.logger.info(
            {},
            `-----------> Shall never happen: token ${tokenAddress} is not linked to an extension <--------------`,
          );
          return EMPTY_CERTIFICATE;
        } else {
          extensionAddress = extensionContract.address;
        }

        const tokenExtensionSetup: Array<any> =
          await this.retrieveTokenExtensionSetup(
            tokenAddress,
            extensionAddress,
            ethService,
          );

        let certificate: string;

        if (
          tokenExtensionSetup[TokenExtensionSetup.CERTIFICATE_VALIDATION] ===
          CertificateTypeIndex[CertificateType.NONE]
        ) {
          certificate = EMPTY_CERTIFICATE;
        } else if (
          tokenExtensionSetup[TokenExtensionSetup.CERTIFICATE_VALIDATION] ===
          CertificateTypeIndex[CertificateType.NONCE]
        ) {
          certificate = await this.craftNonceBasedCertificateV3(
            senderAddress,
            tokenAddress,
            extensionAddress,
            txPayload,
            ethService,
            expirationTime,
          );
        } else if (
          tokenExtensionSetup[TokenExtensionSetup.CERTIFICATE_VALIDATION] ===
          CertificateTypeIndex[CertificateType.SALT]
        ) {
          certificate = await this.craftSaltBasedCertificateV3(
            senderAddress,
            tokenAddress,
            extensionAddress,
            txPayload,
            ethService,
            expirationTime,
          );
        } else {
          ErrorService.throwError(
            `shall never happen: extension at address ${extensionAddress} returns invalid certificate validation type (${tokenExtensionSetup[0]})`,
          );
        }

        return certificate;
      } else if (SmartContractVersion[contractName] === ScVersion.V2) {
        // V2
        const certificateActivated: boolean =
          await this.checkCertificateVerificationIsActivated(
            contractName,
            tokenAddress,
            ethService,
          );

        if (certificateActivated) {
          let certificate: string;
          if (CERTIFICATE_REQUIRED[contractName] === CertificateType.NONCE) {
            certificate = await this.craftNonceBasedCertificateV1V2(
              contractName,
              senderAddress,
              tokenAddress,
              txPayload,
              ethService,
              expirationTime,
            );
          } else if (
            CERTIFICATE_REQUIRED[contractName] === CertificateType.SALT
          ) {
            certificate = await this.craftSaltBasedCertificateV2(
              contractName,
              senderAddress,
              tokenAddress,
              txPayload,
              ethService,
              expirationTime,
            );
          } else {
            ErrorService.throwError(
              `shall never happen: ${contractName} not registered in list of contracts`,
            );
          }
          return certificate;
        } else {
          this.logger.info(
            {},
            'certificate verification is deactivated in the smart contract: no certificate required',
          );
          return EMPTY_CERTIFICATE;
        }
      } else if (SmartContractVersion[contractName] === ScVersion.V1) {
        // V1
        const certificate: string = await this.craftNonceBasedCertificateV1V2(
          contractName,
          senderAddress,
          tokenAddress,
          txPayload,
          ethService,
          expirationTime,
        );

        return certificate;
      } else {
        ErrorService.throwError(
          `shall never happen: token standard ${contractName} doesn't support certificate verification`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'craft certificate',
        'craftCertificate',
        false,
        500,
      );
    }
  }

  /**
   * [Craft a nonce-based certificate for V3]
   *
   * This function is used to craft a nonce-based certificate.
   * The certificate is required to perform any kind of token action (issuance, transfer, etc.) for
   * token ERC1400CertificateNonce.
   *
   */
  async craftNonceBasedCertificateV3(
    senderAddress: string,
    tokenAddress: string,
    extensionAddress: string,
    txPayload: string,
    ethService: EthService,
    expirationTime: Date,
  ): Promise<string> {
    try {
      const nonce: string = await this.fetchLocalNonceV3(
        tokenAddress,
        senderAddress,
        extensionAddress,
        ethService,
      );

      const _expirationTime: Date = expirationTime
        ? expirationTime
        : new Date(
            new Date().getTime() + CERTIFICATE_VALIDITY_PERIOD * 3600 * 1000,
          );

      const expirationTimeAsNumber: number = Math.floor(
        _expirationTime.getTime() / 1000,
      );

      let rawTxPayload: string;
      if (txPayload.length >= 64) {
        rawTxPayload = txPayload.substring(0, txPayload.length - 64);
      } else {
        ErrorService.throwError(
          `txPayload shall be at least 32 bytes long (${
            txPayload.length / 2
          } instead)`,
        );
      }

      const packedAndHashedParameters = web3Utils.soliditySha3(
        { type: 'address', value: senderAddress.toString() },
        { type: 'address', value: tokenAddress.toString() },
        { type: 'bytes', value: rawTxPayload },
        { type: 'uint256', value: expirationTimeAsNumber.toString() },
        { type: 'uint256', value: nonce.toString() },
      );

      const signature = Account.sign(
        packedAndHashedParameters,
        CERTIFICATE_SIGNER_PRIVATE_KEY,
      );
      const vrs = Account.decodeSignature(signature);
      const v = vrs[0].substring(2).replace('1b', '00').replace('1c', '01');
      const r = vrs[1].substring(2);
      const s = vrs[2].substring(2);

      const certificate = `0x${numberToHexa(
        expirationTimeAsNumber,
        32,
      )}${r}${s}${v}`;

      this.logger.info(
        {},
        `Nonce-based certificate crafted locally: ${certificate}`,
      );

      return certificate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'craft nonce-based certificate for V3',
        'craftNonceBasedCertificateV3',
        false,
        500,
      );
    }
  }

  /**
   * [Craft a salt-based certificate for V3]
   *
   * This function is used to craft a salt-based certificate.
   * The certificate is required to perform any kind of token action (issuance, transfer, etc.) for
   * token ERC1400CeretificateSalt.
   *
   */
  async craftSaltBasedCertificateV3(
    senderAddress: string,
    tokenAddress: string,
    extensionAddress: string,
    txPayload: string,
    ethService: EthService,
    expirationTime: Date,
  ): Promise<string> {
    try {
      // Generate a random salt, which has never been used before
      const salt: string = web3Utils.soliditySha3(generateCode());

      // Check if salt has already been used, even though that very un likely to happen (statistically impossible)
      const saltHasAlreadyBeenUsed: boolean = await this.checkLocalSaltV3(
        tokenAddress,
        salt,
        senderAddress,
        extensionAddress,
        ethService,
      );

      if (saltHasAlreadyBeenUsed) {
        ErrorService.throwError(
          'can never happen: salt has already been used (statistically impossible)',
        );
      }

      const _expirationTime: Date = expirationTime
        ? expirationTime
        : new Date(
            new Date().getTime() + CERTIFICATE_VALIDITY_PERIOD * 3600 * 1000,
          );

      const expirationTimeAsNumber: number = Math.floor(
        _expirationTime.getTime() / 1000,
      );

      let rawTxPayload: string;
      if (txPayload.length >= 64) {
        rawTxPayload = txPayload.substring(0, txPayload.length - 64);
      } else {
        ErrorService.throwError(
          `txPayload shall be at least 32 bytes long (${
            txPayload.length / 2
          } instead)`,
        );
      }

      const packedAndHashedParameters = web3Utils.soliditySha3(
        { type: 'address', value: senderAddress.toString() },
        { type: 'address', value: tokenAddress.toString() },
        { type: 'bytes', value: rawTxPayload },
        { type: 'uint256', value: expirationTimeAsNumber.toString() },
        { type: 'bytes32', value: salt.toString() },
      );

      const signature = Account.sign(
        packedAndHashedParameters,
        CERTIFICATE_SIGNER_PRIVATE_KEY,
      );
      const vrs = Account.decodeSignature(signature);
      const v = vrs[0].substring(2).replace('1b', '00').replace('1c', '01');
      const r = vrs[1].substring(2);
      const s = vrs[2].substring(2);

      const certificate = `0x${salt.substring(2)}${numberToHexa(
        expirationTimeAsNumber,
        32,
      )}${r}${s}${v}`;

      this.logger.info(
        {},
        `Salt-based certificate crafted locally: ${certificate}`,
      );

      return certificate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'craft salt-based certificate for V3',
        'craftSaltBasedCertificateV3',
        false,
        500,
      );
    }
  }

  /**
   * [Craft a nonce-based certificate for V1 or V2]
   *
   * This function is used to craft a nonce-based certificate.
   * The certificate is required to perform any kind of token action (issuance, transfer, etc.) for
   * token ERC1400CertificateNonce.
   *
   */
  async craftNonceBasedCertificateV1V2(
    contractName: SmartContract,
    senderAddress: string,
    tokenAddress: string,
    txPayload: string,
    ethService: EthService,
    expirationTime: Date,
  ): Promise<string> {
    try {
      const nonce: string = await this.fetchLocalNonceV1V2(
        contractName,
        senderAddress,
        tokenAddress,
        ethService,
      );

      const _expirationTime: Date = expirationTime
        ? expirationTime
        : new Date(
            new Date().getTime() + CERTIFICATE_VALIDITY_PERIOD * 3600 * 1000,
          );

      const expirationTimeAsNumber: number = Math.floor(
        _expirationTime.getTime() / 1000,
      );

      let rawTxPayload: string;
      if (txPayload.length >= 64) {
        rawTxPayload = txPayload.substring(0, txPayload.length - 64);
      } else {
        ErrorService.throwError(
          `txPayload shall be at least 32 bytes long (${
            txPayload.length / 2
          } instead)`,
        );
      }

      const packedAndHashedParameters = web3Utils.soliditySha3(
        { type: 'address', value: senderAddress.toString() },
        { type: 'address', value: tokenAddress.toString() },
        { type: 'uint256', value: '0' },
        { type: 'bytes', value: rawTxPayload },
        { type: 'uint256', value: expirationTimeAsNumber.toString() },
        { type: 'uint256', value: nonce.toString() },
      );

      const signature = Account.sign(
        packedAndHashedParameters,
        CERTIFICATE_SIGNER_PRIVATE_KEY,
      );
      const vrs = Account.decodeSignature(signature);
      const v = vrs[0].substring(2).replace('1b', '00').replace('1c', '01');
      const r = vrs[1].substring(2);
      const s = vrs[2].substring(2);

      const certificate = `0x${numberToHexa(
        expirationTimeAsNumber,
        32,
      )}${r}${s}${v}`;

      this.logger.info(
        {},
        `Nonce-based certificate crafted locally: ${certificate}`,
      );

      return certificate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'craft nonce-based certificate for V1 or V2',
        'craftNonceBasedCertificateV1V2',
        false,
        500,
      );
    }
  }

  /**
   * [Craft a salt-based certificate for V2]
   *
   * This function is used to craft a salt-based certificate.
   * The certificate is required to perform any kind of token action (issuance, transfer, etc.) for
   * token ERC1400CeretificateSalt.
   *
   */
  async craftSaltBasedCertificateV2(
    contractName: SmartContract,
    senderAddress: string,
    tokenAddress: string,
    txPayload: string,
    ethService: EthService,
    expirationTime: Date,
  ): Promise<string> {
    try {
      // Generate a random salt, which has never been used before
      const salt: string = web3Utils.soliditySha3(
        new Date().getTime().toString(),
      );

      // Check if salt has already been used, even though that very un likely to happen (statistically impossible)
      const saltHasAlreadyBeenUsed: boolean = await this.checkLocalSaltV2(
        contractName,
        salt,
        tokenAddress,
        ethService,
      );

      if (saltHasAlreadyBeenUsed) {
        ErrorService.throwError(
          'can never happen: salt has already been used (statistically impossible)',
        );
      }

      const _expirationTime: Date = expirationTime
        ? expirationTime
        : new Date(
            new Date().getTime() + CERTIFICATE_VALIDITY_PERIOD * 3600 * 1000,
          );

      const expirationTimeAsNumber: number = Math.floor(
        _expirationTime.getTime() / 1000,
      );

      let rawTxPayload: string;
      if (txPayload.length >= 64) {
        rawTxPayload = txPayload.substring(0, txPayload.length - 64);
      } else {
        ErrorService.throwError(
          `txPayload shall be at least 32 bytes long (${
            txPayload.length / 2
          } instead)`,
        );
      }

      const packedAndHashedParameters = web3Utils.soliditySha3(
        { type: 'address', value: senderAddress.toString() },
        { type: 'address', value: tokenAddress.toString() },
        { type: 'uint256', value: '0' },
        { type: 'bytes', value: rawTxPayload },
        { type: 'uint256', value: expirationTimeAsNumber.toString() },
        { type: 'bytes32', value: salt.toString() },
      );

      const signature = Account.sign(
        packedAndHashedParameters,
        CERTIFICATE_SIGNER_PRIVATE_KEY,
      );
      const vrs = Account.decodeSignature(signature);
      const v = vrs[0].substring(2).replace('1b', '00').replace('1c', '01');
      const r = vrs[1].substring(2);
      const s = vrs[2].substring(2);

      const certificate = `0x${salt.substring(2)}${numberToHexa(
        expirationTimeAsNumber,
        32,
      )}${r}${s}${v}`;

      this.logger.info(
        {},
        `Salt-based certificate crafted locally: ${certificate}`,
      );

      return certificate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'craft salt-based certificate for V2',
        'craftSaltBasedCertificateV2',
        false,
        500,
      );
    }
  }

  /**
   * [Check if address is an owner address]
   */
  async owner(
    callerId: string, // required for cache management
    contractAddress: string,
    ethService: EthService,
    contractName: SmartContract,
  ): Promise<string> {
    try {
      const params = {
        contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        OWNER_DATA_NAME,
        callerId,
      );

      if (res) {
        this.logger.info(
          {},
          `>>> owner of token smart contract ${contractAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        if (BatchSupported.includes(contractName)) {
          this.logger.info(
            {},
            `SHALL BE AVOIDED AVOIDED: owner of token smart contract ${contractAddress} was not found in cache`,
          );
        }

        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(`${SC_HOST}/call/${this.adaptName(contractName)}/owner`, {
              params,
            })
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'retrieving smart contract owner',
          response,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache(
          cacheParams,
          OWNER_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('owner', API_NAME, error, 500);
    }
  }

  /**
   * [Check if address is an allowlisted]
   */
  async isAllowlisted(
    callerId: string,
    investorAddress: string,
    tokenAddress: string,
    ethService: EthService,
  ): Promise<boolean> {
    try {
      const extensionAddress: string = await this.retrieveTokenExtensionAddress(
        callerId,
        ethService,
        tokenAddress,
      );

      const params = {
        token: tokenAddress,
        account: investorAddress,
        contractAddress: extensionAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' and 'contractAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      delete cacheParams.contractAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        IS_ALLOWLISTED_DATA_NAME,
        callerId,
      );

      if (typeof res === booleanType) {
        this.logger.info(
          {},
          `>>> allowlisted status of user ${investorAddress} for token ${tokenAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        this.logger.info(
          {},
          `SHALL BE AVOIDED AVOIDED: allowlisted status of user ${investorAddress} for token ${tokenAddress} was not found in cache`,
        );

        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${this.adaptName(
                SmartContract.ERC1400_TOKENS_VALIDATOR,
              )}/isAllowlisted`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'retrieving address allowlisted status',
          response,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache(
          cacheParams,
          IS_ALLOWLISTED_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('isAllowlisted', API_NAME, error, 500);
    }
  }

  /**
   * [Check if address is an blocklisted]
   */
  async isBlocklisted(
    callerId: string,
    investorAddress: string,
    tokenAddress: string,
    ethService: EthService,
  ): Promise<boolean> {
    try {
      const extensionAddress: string = await this.retrieveTokenExtensionAddress(
        callerId,
        ethService,
        tokenAddress,
      );

      const params = {
        token: tokenAddress,
        account: investorAddress,
        contractAddress: extensionAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' and 'contractAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      delete cacheParams.contractAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        IS_BLOCKLISTED_DATA_NAME,
        callerId,
      );

      if (typeof res === booleanType) {
        this.logger.info(
          {},
          `>>> blocklisted status of user ${investorAddress} for token ${tokenAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        this.logger.info(
          {},
          `SHALL BE AVOIDED AVOIDED: blocklisted status of user ${investorAddress} for token ${tokenAddress} was not found in cache`,
        );

        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${this.adaptName(
                SmartContract.ERC1400_TOKENS_VALIDATOR,
              )}/isBlocklisted`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'retrieving address blocklisted status',
          response,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache(
          cacheParams,
          IS_BLOCKLISTED_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('isBlocklisted', API_NAME, error, 500);
    }
  }

  /**
   * [Check if address is an allowlist admin address]
   */
  async isAllowlistAdmin(
    callerId: string,
    issuerAddress: string,
    tokenAddress: string,
    ethService: EthService,
  ): Promise<boolean> {
    try {
      const extensionAddress: string = await this.retrieveTokenExtensionAddress(
        callerId,
        ethService,
        tokenAddress,
      );

      const params = {
        token: tokenAddress,
        account: issuerAddress,
        contractAddress: extensionAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(
            `${SC_HOST}/call/${this.adaptName(
              SmartContract.ERC1400_TOKENS_VALIDATOR,
            )}/isAllowlistAdmin`,
            { params },
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving address allowlist admin status',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('isAllowlistAdmin', API_NAME, error, 500);
    }
  }

  /**
   * [Check if address is a minter address]
   */
  async isMinter(
    account: string,
    contractAddress: string,
    ethService: EthService,
    contractName: SmartContract,
  ): Promise<boolean> {
    try {
      const params = {
        account,
        contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(`${SC_HOST}/call/${this.adaptName(contractName)}/isMinter`, {
            params,
          })
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'checking if account is minter',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('isMinter', API_NAME, error, 500);
    }
  }

  /**
   * [Get transaction receipt]
   */
  async getTxReceipt(
    txHash: string,
    ethService: EthService,
  ): Promise<TxReceipt> {
    try {
      const params = {
        txHash: txHash,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(`${SC_HOST}/generic/get-transaction-receipt`, { params })
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving transaction receipt',
        response,
      );

      return response.data.tx;
    } catch (error) {
      ErrorService.throwApiCallError('getTxReceipt', API_NAME, error, 500);
    }
  }

  /**
   * [Fetch local nonce (required for certificate generation) for V3]
   */
  async fetchLocalNonceV3(
    tokenAddress: string,
    senderAddress: string,
    extensionAddress: string,
    ethService: EthService,
  ) {
    try {
      const params = {
        token: tokenAddress,
        sender: senderAddress,
        contractAddress: extensionAddress,
        signerAddress: senderAddress,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(
            `${SC_HOST}/call/${SmartContract.ERC1400_TOKENS_VALIDATOR}/usedCertificateNonce`,
            { params },
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving nonce',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('fetchLocalNonceV3', API_NAME, error, 500);
    }
  }

  /**
   * [Fetch local nonce (required for certificate generation) for V1 or V2]
   */
  async fetchLocalNonceV1V2(
    contractName: SmartContract,
    senderAddress: string,
    contractAddress: string,
    ethService: EthService,
  ) {
    try {
      const params = {
        sender: senderAddress,
        contractAddress: contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(`${SC_HOST}/call/${this.adaptName(contractName)}/checkCount`, {
            params,
          })
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving nonce',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'fetchLocalNonceV1V2',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Check local salt has not already been used (required for certificate generation) for V3]
   */
  async checkLocalSaltV3(
    tokenAddress: string,
    salt: string,
    senderAddress: string,
    extensionAddress: string,
    ethService: EthService,
  ) {
    try {
      checkSolidityBytes32(salt);

      const params = {
        token: tokenAddress,
        salt: salt,
        contractAddress: extensionAddress,
        signerAddress: senderAddress,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(
            `${SC_HOST}/call/${SmartContract.ERC1400_TOKENS_VALIDATOR}/usedCertificateSalt`,
            { params },
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'checking salt has not already been used',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('checkLocalSaltV3', API_NAME, error, 500);
    }
  }

  /**
   * [Check local salt has not already been used (required for certificate generation) for V2]
   */
  async checkLocalSaltV2(
    contractName: SmartContract,
    salt: string,
    contractAddress: string,
    ethService: EthService,
  ) {
    try {
      checkSolidityBytes32(salt);

      const params = {
        salt: salt,
        contractAddress: contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(
            `${SC_HOST}/call/${this.adaptName(contractName)}/isUsedCertificate`,
            { params },
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'checking salt has not already been used',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('checkLocalSaltV2', API_NAME, error, 500);
    }
  }

  /***********************************************************************************************/
  /***********************************************************************************************/
  /***********************************************************************************************/
  /**************************** NEW BATCH READER FUNCTIONS - START *******************************/
  /***********************************************************************************************/
  /***********************************************************************************************/
  /***********************************************************************************************/

  /**
   * [Get batch of token supplies]
   */
  async batchTokenSuppliesInfos(
    callerId: string, // required for cache management
    tokenAddresses: Array<string>,
    ethService: EthService,
  ) {
    try {
      this.logger.info({}, '****** BATCH TOKEN SUPPLIES INFORMATION ******\n');

      const batchReaderContract: ContractDeployed =
        await this.checkBatchReaderIsDeployed(callerId, ethService);

      if (!batchReaderContract.deployed) {
        this.logger.info(
          {},
          '-----------> Shall never happen: no batch reader is deployed on this network <--------------',
        );
        return undefined;
      }
      if (tokenAddresses.length === 0) {
        ErrorService.throwError('empty input parameters');
      }

      const params = {
        tokens: tokenAddresses,
        contractAddress: batchReaderContract.address,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const dataName = 'batchTokenSuppliesInfos';

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        dataName,
        callerId,
      );

      if (res) {
        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchTokenSuppliesInfos`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching token supplies information',
          response,
        );

        // Store global "batch response" in cache
        const finalOutput = response.data;
        await CacheService.setDataInCache(
          cacheParams,
          dataName,
          callerId,
          finalOutput,
        );

        if (Object.keys(finalOutput).length !== 6) {
          ErrorService.throwError(
            `incorrect size for array of token supplies info (${
              Object.keys(finalOutput).length
            } instead of 6)`,
          );
        }

        const batchTotalSupplies = finalOutput['0'];
        const totalPartitionsLengths = finalOutput['1'];
        const batchTotalPartitions = finalOutput['2'];
        const batchPartitionSupplies = finalOutput['3'];
        const defaultPartitionsLengths = finalOutput['4'];
        const batchDefaultPartitions = finalOutput['5'];

        // Store "totalSupply" result in cache
        for (let i = 0; i < tokenAddresses.length; i++) {
          const totalSupplyFinalOutput = removeDecimalsFromBalances(
            batchTotalSupplies[i],
            DECIMALS,
          );
          const totalSupplyParams = {
            contractAddress: tokenAddresses[i],
            chain: params.chain,
          };

          await CacheService.setDataInCache(
            totalSupplyParams,
            TOTAL_SUPPLY_DATA_NAME,
            callerId,
            totalSupplyFinalOutput,
          );
        }

        // Store "totalPartitions" result in cache
        let counter1 = 0;
        for (let i = 0; i < tokenAddresses.length; i++) {
          const totalPartitionsFinalOutput = [];
          const nbPartitionsForToken = parseInt(
            totalPartitionsLengths[i].toString(),
          );
          for (let j = 0; j < nbPartitionsForToken; j++) {
            totalPartitionsFinalOutput.push(batchTotalPartitions[counter1]);
            counter1++;
          }
          const totalPartitionsParams = {
            contractAddress: tokenAddresses[i],
            chain: params.chain,
          };
          await CacheService.setDataInCache(
            totalPartitionsParams,
            TOTAL_PARTITIONS_DATA_NAME,
            callerId,
            totalPartitionsFinalOutput,
          );
        }

        // Store "totalSupplyByPartition" result in cache
        let counter2 = 0;
        for (let i = 0; i < tokenAddresses.length; i++) {
          const nbPartitionsForToken = parseInt(
            totalPartitionsLengths[i].toString(),
          );
          for (let j = 0; j < nbPartitionsForToken; j++) {
            const partition = batchTotalPartitions[counter2];
            const totalSupplyByPartitionFinalOutput =
              removeDecimalsFromBalances(
                batchPartitionSupplies[counter2],
                DECIMALS,
              );
            const totalSupplyByPartitionParams = {
              partition,
              contractAddress: tokenAddresses[i],
              chain: params.chain,
            };
            await CacheService.setDataInCache(
              totalSupplyByPartitionParams,
              TOTAL_SUPPLY_BY_PARTITION_DATA_NAME,
              callerId,
              totalSupplyByPartitionFinalOutput,
            );
            counter2++;
          }
        }

        // Store "getDefaultPartitions" result in cache
        let counter3 = 0;
        for (let i = 0; i < tokenAddresses.length; i++) {
          const defaultPartitionsFinalOutput = [];
          const nDefaultPartitionsForToken = parseInt(
            defaultPartitionsLengths[i].toString(),
          );
          for (let j = 0; j < nDefaultPartitionsForToken; j++) {
            defaultPartitionsFinalOutput.push(batchDefaultPartitions[counter3]);
            counter3++;
          }
          const defaultPartitionsParams = {
            contractAddress: tokenAddresses[i],
            chain: params.chain,
          };
          await CacheService.setDataInCache(
            defaultPartitionsParams,
            DEFAULT_PARTITIONS_DATA_NAME,
            callerId,
            defaultPartitionsFinalOutput,
          );
        }

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'batchTokenSuppliesInfos',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Get batch of token roles]
   */
  async batchTokenRolesInfos(
    callerId: string, // required for cache management
    tokenAddresses: Array<string>,
    ethService: EthService,
  ) {
    try {
      this.logger.info({}, '****** BATCH TOKEN ROLES INFORMATION ******\n');
      const batchReaderContract: ContractDeployed =
        await this.checkBatchReaderIsDeployed(callerId, ethService);

      if (!batchReaderContract.deployed) {
        this.logger.info(
          {},
          '-----------> Shall never happen: no batch reader is deployed on this network <--------------',
        );
        return undefined;
      }
      if (tokenAddresses.length === 0) {
        ErrorService.throwError('empty input parameters');
      }

      const params = {
        tokens: tokenAddresses,
        contractAddress: batchReaderContract.address,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const dataName = 'batchTokenRolesInfos';

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        dataName,
        callerId,
      );

      if (res) {
        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchTokenRolesInfos`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching token roles information',
          response,
        );

        // Store global "batch response" in cache
        const finalOutput = response.data;
        await CacheService.setDataInCache(
          cacheParams,
          dataName,
          callerId,
          finalOutput,
        );

        if (Object.keys(finalOutput).length !== 5) {
          ErrorService.throwError(
            `incorrect size for array of token roles info (${
              Object.keys(finalOutput).length
            } instead of 5)`,
          );
        }

        const batchOwners = finalOutput['0'];
        // --> 4 parameters below are not used for now but could be useful later
        // const batchControllersLength = finalOutput['1'];
        // const batchControllers = finalOutput['2'];
        // const batchExtensionControllersLength = finalOutput['3'];
        // const batchExtensionControllers = finalOutput['4'];

        // Store "owner" result in cache
        for (let i = 0; i < tokenAddresses.length; i++) {
          const ownerFinalOutput = batchOwners[i];
          const ownerParams = {
            contractAddress: tokenAddresses[i],
            chain: params.chain,
          };
          await CacheService.setDataInCache(
            ownerParams,
            OWNER_DATA_NAME,
            callerId,
            ownerFinalOutput,
          );
        }

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'batchTokenRolesInfos',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Get batch of token extension setup]
   */
  async batchTokenExtensionSetup(
    callerId: string, // required for cache management
    tokenAddresses: Array<string>,
    ethService: EthService,
  ) {
    try {
      this.logger.info({}, '****** BATCH TOKEN EXTENSION SETUP ******\n');
      const batchReaderContract: ContractDeployed =
        await this.checkBatchReaderIsDeployed(callerId, ethService);

      if (!batchReaderContract.deployed) {
        this.logger.info(
          {},
          '-----------> Shall never happen: no batch reader is deployed on this network <--------------',
        );
        return undefined;
      }
      if (tokenAddresses.length === 0) {
        ErrorService.throwError('empty input parameters');
      }

      const params = {
        tokens: tokenAddresses,
        contractAddress: batchReaderContract.address,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const dataName = 'batchTokenExtensionSetup';

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        dataName,
        callerId,
      );

      if (res) {
        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchTokenExtensionSetup`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching token extension setup',
          response,
        );

        // Store global "batch response" in cache
        const finalOutput = response.data;
        await CacheService.setDataInCache(
          cacheParams,
          dataName,
          callerId,
          finalOutput,
        );

        if (Object.keys(finalOutput).length !== 6) {
          ErrorService.throwError(
            `incorrect size for array of token roles info (${
              Object.keys(finalOutput).length
            } instead of 6)`,
          );
        }

        const batchTokenExtension = finalOutput['0'];
        // --> 4 parameters below are not used for now but could be useful later
        // const batchCertificateActivated = finalOutput['1'];
        // const batchAllowlistActivated = finalOutput['2'];
        // const batchBlocklistActivated = finalOutput['3'];
        // const batchGranularityByPartitionActivated = finalOutput['4'];
        // const batchHoldsActivated = finalOutput['5'];

        // Store "extensionAddress" result in cache
        for (let i = 0; i < tokenAddresses.length; i++) {
          const extensionAddressFinalOutput = batchTokenExtension[i];
          const extensionAddressParams = {
            _addr: tokenAddresses[i],
            _interfaceHash: web3Utils.soliditySha3(
              SmartContract.ERC1400_TOKENS_VALIDATOR,
            ),
            contractAddress: ERC1820_REGISTRY_ADDRESS,
            chain: params.chain,
          };
          await CacheService.setDataInCache(
            extensionAddressParams,
            INTERFACE_IMPLEMENTER_DATA_NAME,
            callerId,
            extensionAddressFinalOutput,
          );
        }

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'batchTokenExtensionSetup',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Helper function to split batches in sub-batches when their size is too important]
   */
  splitBatchInSubBatches(
    tokenAddresses: Array<string>,
    tokenHolders: Array<string>,
    maxBatchSize: number,
  ): {
    subTokenHolders: Array<Array<string>>;
    subTokenAddresses: Array<Array<string>>;
  } {
    try {
      const subTokenHolders: Array<Array<string>> = [];
      let subBatchSize;
      if (tokenHolders.length > maxBatchSize) {
        subBatchSize = maxBatchSize;
        const nbFullSubBatches = Math.floor(tokenHolders.length / subBatchSize);

        // Create tokenHolders sub-batches
        for (let i = 0; i < nbFullSubBatches; i++) {
          subTokenHolders.push([]);
          for (let j = i * subBatchSize; j < (i + 1) * subBatchSize; j++) {
            subTokenHolders[i].push(tokenHolders[j]);
          }
        }

        // Create last tokenHolders batch
        if (nbFullSubBatches * subBatchSize < tokenHolders.length) {
          subTokenHolders.push([]);
        }
        for (
          let k = nbFullSubBatches * subBatchSize;
          k < tokenHolders.length;
          k++
        ) {
          subTokenHolders[nbFullSubBatches].push(tokenHolders[k]);
        }
      } else {
        subTokenHolders.push(tokenHolders);
        subBatchSize = subTokenHolders[0].length;
      }

      const subTokenAddresses: Array<Array<string>> = [];
      if (subBatchSize * tokenAddresses.length > maxBatchSize) {
        const subBatchSize2 = Math.floor(maxBatchSize / subBatchSize);
        const nbFullSubBatches2 = Math.floor(
          tokenAddresses.length / subBatchSize2,
        );

        // Create tokenAddresses sub-batches
        for (let i = 0; i < nbFullSubBatches2; i++) {
          subTokenAddresses.push([]);
          for (let j = i * subBatchSize2; j < (i + 1) * subBatchSize2; j++) {
            subTokenAddresses[i].push(tokenAddresses[j]);
          }
        }

        // Create last tokenAddresses batch
        if (nbFullSubBatches2 * subBatchSize2 < tokenAddresses.length) {
          subTokenAddresses.push([]);
        }
        for (
          let k = nbFullSubBatches2 * subBatchSize2;
          k < tokenAddresses.length;
          k++
        ) {
          subTokenAddresses[nbFullSubBatches2].push(tokenAddresses[k]);
        }
      } else {
        subTokenAddresses.push(tokenAddresses);
      }

      // Check batches were split properly
      const subTokenHoldersLength = subTokenHolders.reduce(
        (total, arr) => total + arr.length,
        0,
      );
      if (tokenHolders.length !== subTokenHoldersLength) {
        ErrorService.throwError(
          `SHALL NEVER HAPPEN: tokenHolders(length: ${tokenHolders.length}) not split properly into sub-batches(length: ${subTokenHoldersLength})`,
        );
      }
      const subTokenAddressesLength = subTokenAddresses.reduce(
        (total, arr) => total + arr.length,
        0,
      );
      if (tokenAddresses.length !== subTokenAddressesLength) {
        ErrorService.throwError(
          `SHALL NEVER HAPPEN: tokenAddresses(length: ${tokenAddresses.length}) not split properly into sub-batches(length: ${subTokenAddressesLength})`,
        );
      }

      return {
        subTokenHolders,
        subTokenAddresses,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'splitting batches in sub-batches',
        'splitBatchInSubBatches',
        false,
        500,
      );
    }
  }

  /**
   * [Get batch of ERC20 token balances]
   */
  async batchERC20Balances(
    callerId: string, // required for cache management
    tokenAddresses: Array<string>,
    tokenHolders: Array<string>,
    ethService: EthService,
  ) {
    try {
      this.logger.info(
        {},
        `****** BATCH ${tokenAddresses.length}*${tokenHolders.length} ERC20 BALANCES ******\n`,
      );
      const batchReaderContract: ContractDeployed =
        await this.checkBatchReaderIsDeployed(callerId, ethService);

      if (!batchReaderContract.deployed) {
        this.logger.info(
          {},
          '-----------> Shall never happen: no batch reader is deployed on this network <--------------',
        );
        return undefined;
      }
      if (tokenAddresses.length === 0) {
        ErrorService.throwError('empty input parameters');
      }

      const MAX_ERC20_BALANCES_PER_BATCH = 100;

      const {
        subTokenHolders,
        subTokenAddresses,
      }: {
        subTokenHolders: Array<Array<string>>;
        subTokenAddresses: Array<Array<string>>;
      } = this.splitBatchInSubBatches(
        tokenAddresses,
        tokenHolders,
        MAX_ERC20_BALANCES_PER_BATCH,
      );

      const requests = [];
      let counter = 0;
      const total = subTokenHolders.length * subTokenAddresses.length;
      for (let index1 = 0; index1 < subTokenHolders.length; index1++) {
        for (let index2 = 0; index2 < subTokenAddresses.length; index2++) {
          counter++;
          requests.push(
            this.subBatchERC20Balances(
              callerId,
              subTokenAddresses[index2],
              subTokenHolders[index1],
              ethService,
              batchReaderContract,
              counter,
              total,
            ),
          );
        }
      }
      await Promise.all(requests);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'batching ERC20 balances',
        'batchERC20Balances',
        false,
        500,
      );
    }
  }

  /**
   * [Get batch of ERC20 token balances]
   */
  async subBatchERC20Balances(
    callerId: string, // required for cache management
    tokenAddresses: Array<string>,
    tokenHolders: Array<string>,
    ethService: EthService,
    batchReaderContract: ContractDeployed,
    index: number,
    total: number,
  ) {
    try {
      this.logger.info(
        {},
        `****** BATCH ${tokenAddresses.length}*${tokenHolders.length} ERC20 BALANCES (SUB-BATCH ${index}/${total}) ******\n`,
      );

      const params = {
        tokens: tokenAddresses,
        tokenHolders,
        contractAddress: batchReaderContract.address,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const dataName = 'batchERC20Balances';

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        dataName,
        callerId,
      );

      if (res) {
        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchERC20Balances`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching ERC20 token balances',
          response,
        );

        // Store global "batch response" in cache
        const finalOutput = response.data;
        await CacheService.setDataInCache(
          cacheParams,
          dataName,
          callerId,
          finalOutput,
        );

        if (Object.keys(finalOutput).length !== 2) {
          ErrorService.throwError(
            `incorrect size for array of ERC20 token balances (${
              Object.keys(finalOutput).length
            } instead of 2)`,
          );
        }

        const batchEthBalances = finalOutput['0'];
        const batchBalancesOf = finalOutput['1'];

        // Store "etherBalance" result in cache
        for (let i = 0; i < tokenHolders.length; i++) {
          const ethBalanceFinalOutput = batchEthBalances[i];
          const ethBalanceParams = {
            userAddress: tokenHolders[i],
            chain: params.chain,
          };
          await CacheService.setDataInCache(
            ethBalanceParams,
            ETHER_BALANCE_DATA_NAME,
            callerId,
            ethBalanceFinalOutput,
          );
        }

        // Store "balanceOf" result in cache
        for (let i = 0; i < tokenHolders.length; i++) {
          for (let j = 0; j < tokenAddresses.length; j++) {
            const balanceOfFinalOutput = removeDecimalsFromBalances(
              batchBalancesOf[i],
              DECIMALS,
            );
            const balanceOfParams = {
              account: tokenHolders[i],
              contractAddress: tokenAddresses[j],
              chain: params.chain,
            };
            await CacheService.setDataInCache(
              balanceOfParams,
              BALANCE_DATA_NAME,
              callerId,
              balanceOfFinalOutput,
            );
          }
        }

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'subBatchERC20Balances',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Get batch of ERC1400 token balances]
   *
   * We've experienced that the call to the node fails for batches with: tokenAddresses.length * tokenHolders.length > 130
   * The purpose of this function is to create ERC1400 balances sub-batches smaller than MAX_ERC1400_BALANCES_PER_BATCH.
   *
   * CAUTION: this sub-batches split was made with the assumption that tokens have 1 single asset class, the code shall
   * be updated to support cases of multiple asset classes
   */
  async batchERC1400Balances(
    callerId: string, // required for cache management
    tokenAddresses: Array<string>,
    tokenHolders: Array<string>,
    ethService: EthService,
  ) {
    try {
      this.logger.info(
        {},
        `****** BATCH ${tokenAddresses.length}*${tokenHolders.length} ERC1400 BALANCES ******\n`,
      );

      const batchReaderContract: ContractDeployed =
        await this.checkBatchReaderIsDeployed(callerId, ethService);

      if (!batchReaderContract.deployed) {
        this.logger.info(
          {},
          '-----------> Shall never happen: no batch reader is deployed on this network <--------------',
        );
        return undefined;
      }
      if (tokenAddresses.length === 0) {
        ErrorService.throwError('empty input parameters');
      }

      const MAX_ERC1400_BALANCES_PER_BATCH = 100;

      const {
        subTokenHolders,
        subTokenAddresses,
      }: {
        subTokenHolders: Array<Array<string>>;
        subTokenAddresses: Array<Array<string>>;
      } = this.splitBatchInSubBatches(
        tokenAddresses,
        tokenHolders,
        MAX_ERC1400_BALANCES_PER_BATCH,
      );

      const requests = [];
      let counter = 0;
      const total = subTokenHolders.length * subTokenAddresses.length;
      for (let index1 = 0; index1 < subTokenHolders.length; index1++) {
        for (let index2 = 0; index2 < subTokenAddresses.length; index2++) {
          counter++;
          requests.push(
            this.subBatchERC1400Balances(
              callerId,
              subTokenAddresses[index2],
              subTokenHolders[index1],
              ethService,
              batchReaderContract,
              counter,
              total,
            ),
          );
        }
      }
      await Promise.all(requests);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'batching ERC1400 balances',
        'batchERC1400Balances',
        false,
        500,
      );
    }
  }

  /**
   * [Get sub-batch of ERC1400 token balances]
   *
   * We've experienced that the call to the node fails for batches with: tokenAddresses.length * tokenHolders.length > 130.
   * For this reason, we create sub-batches that shall not exceed this value.
   *
   */
  async subBatchERC1400Balances(
    callerId: string, // required for cache management
    tokenAddresses: Array<string>,
    tokenHolders: Array<string>,
    ethService: EthService,
    batchReaderContract: ContractDeployed,
    index: number,
    total: number,
  ) {
    try {
      this.logger.info(
        {},
        `****** BATCH ${tokenAddresses.length}*${tokenHolders.length} ERC1400 BALANCES (SUB-BATCH ${index}/${total}) ******\n`,
      );

      const params = {
        tokens: tokenAddresses,
        tokenHolders,
        contractAddress: batchReaderContract.address,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const dataName = 'batchERC1400Balances';

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        dataName,
        callerId,
      );

      if (res) {
        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchERC1400Balances`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching ERC1400 token balances',
          response,
        );

        // Store global "batch response" in cache
        const finalOutput = response.data;
        await CacheService.setDataInCache(
          cacheParams,
          dataName,
          callerId,
          finalOutput,
        );

        if (Object.keys(finalOutput).length !== 6) {
          ErrorService.throwError(
            `incorrect size for array of ERC1400 token balances (${
              Object.keys(finalOutput).length
            } instead of 6)`,
          );
        }

        const batchEthBalances = finalOutput['0'];
        const batchBalancesOf = finalOutput['1'];
        const totalPartitionsLengths = finalOutput['2'];
        const batchTotalPartitions = finalOutput['3'];
        const batchBalancesOfByPartition = finalOutput['4'];
        const batchSpendableBalancesOfByPartition = finalOutput['5'];

        // Store "etherBalance" result in cache
        for (let i = 0; i < tokenHolders.length; i++) {
          const ethBalanceFinalOutput = batchEthBalances[i];
          const ethBalanceParams = {
            userAddress: tokenHolders[i],
            chain: params.chain,
          };
          await CacheService.setDataInCache(
            ethBalanceParams,
            ETHER_BALANCE_DATA_NAME,
            callerId,
            ethBalanceFinalOutput,
          );
        }

        // Store "balanceOf" result in cache
        for (let i = 0; i < tokenHolders.length; i++) {
          for (let j = 0; j < tokenAddresses.length; j++) {
            const balanceOfFinalOutput = removeDecimalsFromBalances(
              batchBalancesOf[i],
              DECIMALS,
            );
            const balanceOfParams = {
              account: tokenHolders[i],
              contractAddress: tokenAddresses[j],
              chain: params.chain,
            };
            await CacheService.setDataInCache(
              balanceOfParams,
              BALANCE_DATA_NAME,
              callerId,
              balanceOfFinalOutput,
            );
          }
        }

        // Store "balanceOfByPartition" result in cache
        let balanceCounter1 = 0;
        for (let i = 0; i < tokenHolders.length; i++) {
          let partitionCounter1 = 0;
          for (let j = 0; j < tokenAddresses.length; j++) {
            const nbPartitionsForToken = parseInt(
              totalPartitionsLengths[j].toString(),
            );
            for (let k = 0; k < nbPartitionsForToken; k++) {
              const balanceOfByPartitionFinalOutput =
                removeDecimalsFromBalances(
                  batchBalancesOfByPartition[balanceCounter1],
                  DECIMALS,
                );
              const balanceOfByPartitionParams = {
                tokenHolder: tokenHolders[i],
                partition: batchTotalPartitions[partitionCounter1],
                contractAddress: tokenAddresses[j],
                chain: params.chain,
              };
              await CacheService.setDataInCache(
                balanceOfByPartitionParams,
                BALANCE_BY_PARTITION_DATA_NAME,
                callerId,
                balanceOfByPartitionFinalOutput,
              );
              balanceCounter1++;
              partitionCounter1++;
            }
          }
        }

        // Store "spendableBalanceOfByPartition" result in cache
        let balanceCounter2 = 0;
        for (let i = 0; i < tokenHolders.length; i++) {
          let partitionCounter2 = 0;
          for (let j = 0; j < tokenAddresses.length; j++) {
            const nbPartitionsForToken = parseInt(
              totalPartitionsLengths[j].toString(),
            );
            for (let k = 0; k < nbPartitionsForToken; k++) {
              const spendableBalanceOfByPartitionFinalOutput =
                removeDecimalsFromBalances(
                  batchSpendableBalancesOfByPartition[balanceCounter2],
                  DECIMALS,
                );
              const spendableBalanceOfByPartitionParams = {
                token: tokenAddresses[j],
                partition: batchTotalPartitions[partitionCounter2],
                account: tokenHolders[i],
                chain: params.chain,
              };
              await CacheService.setDataInCache(
                spendableBalanceOfByPartitionParams,
                SPENDABLE_BALANCE_BY_PARTITION_DATA_NAME,
                callerId,
                spendableBalanceOfByPartitionFinalOutput,
              );
              balanceCounter2++;
              partitionCounter2++;
            }
          }
        }

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'subBatchERC1400Balances',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Get batch of user validations for a given token]
   */
  async batchValidations(
    callerId: string, // required for cache management
    tokenAddresses: Array<string>,
    tokenHolders: Array<string>,
    ethService: EthService,
  ) {
    try {
      this.logger.info(
        {},
        `****** BATCH ${tokenAddresses.length}*${tokenHolders.length} VALIDATIONS ******\n`,
      );
      const batchReaderContract: ContractDeployed =
        await this.checkBatchReaderIsDeployed(callerId, ethService);

      if (!batchReaderContract.deployed) {
        this.logger.info(
          {},
          '-----------> Shall never happen: no batch reader is deployed on this network <--------------',
        );
        return undefined;
      }
      if (tokenAddresses.length === 0) {
        ErrorService.throwError('empty input parameters');
      }

      const MAX_VALIDATIONS_PER_BATCH = 100;

      const {
        subTokenHolders,
        subTokenAddresses,
      }: {
        subTokenHolders: Array<Array<string>>;
        subTokenAddresses: Array<Array<string>>;
      } = this.splitBatchInSubBatches(
        tokenAddresses,
        tokenHolders,
        MAX_VALIDATIONS_PER_BATCH,
      );

      const requests = [];
      let counter = 0;
      const total = subTokenHolders.length * subTokenAddresses.length;
      for (let index1 = 0; index1 < subTokenHolders.length; index1++) {
        for (let index2 = 0; index2 < subTokenAddresses.length; index2++) {
          counter++;
          requests.push(
            this.subBatchValidations(
              callerId,
              subTokenAddresses[index2],
              subTokenHolders[index1],
              ethService,
              batchReaderContract,
              counter,
              total,
            ),
          );
        }
      }
      await Promise.all(requests);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'batching validations',
        'batchValidations',
        false,
        500,
      );
    }
  }

  /**
   * [Get sub-batch of user validations for a given token]
   */
  async subBatchValidations(
    callerId: string, // required for cache management
    tokenAddresses: Array<string>,
    tokenHolders: Array<string>,
    ethService: EthService,
    batchReaderContract: ContractDeployed,
    index: number,
    total: number,
  ) {
    try {
      this.logger.info(
        {},
        `****** BATCH ${tokenAddresses.length}*${tokenHolders.length} VALIDATIONS (SUB-BATCH ${index}/${total}) ******\n`,
      );

      const params = {
        tokens: tokenAddresses,
        tokenHolders,
        contractAddress: batchReaderContract.address,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const dataName = 'batchValidations';

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        dataName,
        callerId,
      );

      if (res) {
        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchValidations`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching validations',
          response,
        );

        // Store global "batch response" in cache
        const finalOutput = response.data;
        await CacheService.setDataInCache(
          cacheParams,
          dataName,
          callerId,
          finalOutput,
        );

        if (Object.keys(finalOutput).length !== 2) {
          ErrorService.throwError(
            `incorrect size for array of token roles info (${
              Object.keys(finalOutput).length
            } instead of 2)`,
          );
        }

        const batchAllowlisted = finalOutput['0'];
        const batchBlocklisted = finalOutput['1'];

        // Store "isAllowlisted" result in cache
        for (let i = 0; i < tokenHolders.length; i++) {
          for (let j = 0; j < tokenAddresses.length; j++) {
            const isAllowlistedFinalOutput =
              batchAllowlisted[i * tokenAddresses.length + j];
            const isAllowlistedParams = {
              token: tokenAddresses[j],
              account: tokenHolders[i],
              chain: params.chain,
            };
            await CacheService.setDataInCache(
              isAllowlistedParams,
              IS_ALLOWLISTED_DATA_NAME,
              callerId,
              isAllowlistedFinalOutput,
            );
          }
        }

        // Store "isBlocklisted" result in cache
        for (let i = 0; i < tokenHolders.length; i++) {
          for (let j = 0; j < tokenAddresses.length; j++) {
            const isBlocklistedFinalOutput =
              batchBlocklisted[i * tokenAddresses.length + j];
            const isBlocklistedParams = {
              token: tokenAddresses[j],
              account: tokenHolders[i],
              chain: params.chain,
            };
            await CacheService.setDataInCache(
              isBlocklistedParams,
              IS_BLOCKLISTED_DATA_NAME,
              callerId,
              isBlocklistedFinalOutput,
            );
          }
        }

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('batchValidations', API_NAME, error, 500);
    }
  }

  /***********************************************************************************************/
  /***********************************************************************************************/
  /***********************************************************************************************/
  /**************************** NEW BATCH READER FUNCTIONs - END *********************************/
  /***********************************************************************************************/
  /***********************************************************************************************/
  /***********************************************************************************************/

  /**
   *
   * [Check certificate verification is activated]
   */
  async checkCertificateVerificationIsActivated(
    contractName: SmartContract,
    contractAddress: string,
    ethService: EthService,
  ) {
    try {
      const params = {
        contractAddress: contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(
            `${SC_HOST}/call/${this.adaptName(
              contractName,
            )}/certificateControllerActivated`,
            { params },
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'checking if certificate verification is activated',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'checkCertificateVerificationIsActivated',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Retrieve token extension setup]
   */
  async retrieveTokenExtensionSetup(
    tokenAddress: string,
    extensionAddress: string,
    ethService: EthService,
  ) {
    try {
      const params = {
        token: tokenAddress,
        contractAddress: extensionAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(
            `${SC_HOST}/call/${SmartContract.ERC1400_TOKENS_VALIDATOR}/retrieveTokenSetup`,
            { params },
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving token extension setup',
        response,
      );

      let invalidResponse: boolean;
      for (
        let index = 0;
        index < Object.keys(TokenExtensionSetup).length;
        index++
      ) {
        const key: string =
          TokenExtensionSetup[Object.keys(TokenExtensionSetup)[index]];
        if (response.data[key] === undefined) {
          invalidResponse = true;
        }
      }
      if (
        response.data[Object.keys(TokenExtensionSetup).length] !== undefined
      ) {
        invalidResponse = true;
      }

      if (invalidResponse) {
        ErrorService.throwError(
          `shall never happen: extension at address ${extensionAddress} doesn't return the correct reponse format for 'retrieveTokenSetup' function`,
        );
      }

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveTokenExtensionSetup',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Get total list of partitions]
   */
  async totalPartitions(
    callerId: string, // required for cache management
    contractName: SmartContract,
    contractAddress: string,
    ethService: EthService,
  ): Promise<any> {
    try {
      const params: any = {
        contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        TOTAL_PARTITIONS_DATA_NAME,
        callerId,
      );

      if (res) {
        this.logger.info(
          {},
          `>>> total partitions for token ${contractAddress} found in cache: ${JSON.stringify(
            res,
          )}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        this.logger.info(
          {},
          `SHALL BE AVOIDED AVOIDED: total partitions for token ${contractAddress} was not found in cache`,
        );

        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${this.adaptName(contractName)}/totalPartitions`,
              {
                params,
              },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching default partitions',
          response,
          true,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache(
          cacheParams,
          TOTAL_PARTITIONS_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('totalPartitions', API_NAME, error, 500);
    }
  }

  /**
   * [Get default partitions]
   */
  async getDefaultPartitions(
    callerId: string, // required for cache management
    contractName: SmartContract,
    contractAddress: string,
    signerAddress: string,
    ethService: EthService,
  ): Promise<any> {
    try {
      const params: any = {
        contractAddress,
        signerAddress,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        DEFAULT_PARTITIONS_DATA_NAME,
        callerId,
      );

      if (res) {
        this.logger.info(
          {},
          `>>> default partitions for token ${contractAddress} found in cache: ${JSON.stringify(
            res,
          )}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        this.logger.info(
          {},
          `SHALL BE AVOIDED AVOIDED: default partitions for token ${contractAddress} was not found in cache`,
        );

        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${this.adaptName(
                contractName,
              )}/getDefaultPartitions`,
              {
                params,
              },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching default partitions',
          response,
          true,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache(
          cacheParams,
          DEFAULT_PARTITIONS_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'getDefaultPartitions',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Get total supply]
   */
  async totalSupply(
    callerId: string, // required for cache management
    contractName: SmartContract,
    contractAddress: string,
    signerAddress: string,
    ethService: EthService,
  ) {
    try {
      const params = {
        contractAddress,
        signerAddress,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        TOTAL_SUPPLY_DATA_NAME,
        callerId,
      );

      if (res === 0 || res) {
        this.logger.info(
          {},
          `>>> total supply for token ${contractAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        if (BatchSupported.includes(contractName)) {
          this.logger.info(
            {},
            `SHALL BE AVOIDED AVOIDED: total supply for token ${contractAddress} was not found in cache`,
          );
        }

        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${this.adaptName(contractName)}/totalSupply`,
              {
                params,
              },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching total supply',
          response,
        );

        const finalOutput = removeDecimalsFromBalances(response.data, DECIMALS);

        await CacheService.setDataInCache(
          cacheParams,
          TOTAL_SUPPLY_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('totalSupply', API_NAME, error, 500);
    }
  }

  /**
   * [Get total supply by partition]
   */
  async totalSupplyByPartition(
    callerId: string, // required for cache management
    contractName: SmartContract,
    partition: string,
    contractAddress: string,
    signerAddress: string,
    ethService: EthService,
  ) {
    try {
      const params = {
        partition,
        contractAddress,
        signerAddress,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        TOTAL_SUPPLY_BY_PARTITION_DATA_NAME,
        callerId,
      );

      if (res === 0 || res) {
        this.logger.info(
          {},
          `>>> total supply for partition ${partition} and token ${contractAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        this.logger.info(
          {},
          `SHALL BE AVOIDED AVOIDED: total supply for partition ${partition} and token ${contractAddress} was not found in cache`,
        );

        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${this.adaptName(
                contractName,
              )}/totalSupplyByPartition`,
              {
                params,
              },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching total supply by partition',
          response,
        );

        const finalOutput = removeDecimalsFromBalances(response.data, DECIMALS);

        await CacheService.setDataInCache(
          cacheParams,
          TOTAL_SUPPLY_BY_PARTITION_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'totalSupplyByPartition',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Get owner]
   */
  async ownerOf(
    callerId: string, // required for cache management
    contractName: SmartContract,
    identifier: string,
    contractAddress: string,
    ethService: EthService,
  ): Promise<any> {
    try {
      const params = {
        tokenId: identifier,
        contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const dataName = 'ownerOf';

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        dataName,
        callerId,
      );

      if (res) {
        this.logger.info(
          {},
          `>>> owner of token with identifier ${identifier} for token ${contractAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        this.logger.info(
          {},
          `SHALL BE AVOIDED AVOIDED: owner of token with identifier ${identifier} for token ${contractAddress} was not found in cache`,
        );

        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(`${SC_HOST}/call/${this.adaptName(contractName)}/ownerOf`, {
              params,
            })
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching owner',
          response,
        );

        const finalOutput = web3Utils.toChecksumAddress(response.data);

        await CacheService.setDataInCache(
          cacheParams,
          dataName,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('ownerOf', API_NAME, error, 500);
    }
  }

  /**
   * [Get balance]
   */
  async balanceOf(
    callerId: string, // required for cache management
    contractName: SmartContract,
    tokenHolder: string,
    contractAddress: string,
    ethService: EthService,
  ): Promise<number> {
    try {
      const params: any = {
        contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };
      if (
        [SmartContract.ERC20_TOKEN, SmartContract.ERC721_TOKEN].includes(
          contractName,
        )
      ) {
        params.owner = tokenHolder;
      } else {
        params.account = tokenHolder;
      }

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        BALANCE_DATA_NAME,
        callerId,
      );

      if (res === 0 || res) {
        this.logger.info(
          {},
          `>>> balance of token holder ${tokenHolder} for token ${contractAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        if (BatchSupported.includes(contractName)) {
          this.logger.info(
            {},
            `SHALL BE AVOIDED AVOIDED: balance of token holder ${tokenHolder} for token ${contractAddress} was not found in cache`,
          );
        }

        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(`${SC_HOST}/call/${this.adaptName(contractName)}/balanceOf`, {
              params,
            })
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching balance',
          response,
        );

        const finalOutput =
          contractName !== SmartContract.ERC721_TOKEN
            ? removeDecimalsFromBalances(response.data, DECIMALS)
            : response.data;

        await CacheService.setDataInCache(
          cacheParams,
          BALANCE_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('balanceOf', API_NAME, error, 500);
    }
  }

  /**
   * [Get balance by partition]
   */
  async balanceOfByPartition(
    callerId: string, // required for cache management
    contractName: SmartContract,
    tokenHolder: string,
    partition: string,
    contractAddress: string,
    ethService: EthService,
  ): Promise<number> {
    try {
      const params = {
        tokenHolder,
        partition,
        contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        BALANCE_BY_PARTITION_DATA_NAME,
        callerId,
      );

      if (res === 0 || res) {
        this.logger.info(
          {},
          `>>> balance of token holder ${tokenHolder} for partition ${partition} of token ${contractAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        this.logger.info(
          {},
          `SHALL BE AVOIDED AVOIDED: balance of token holder ${tokenHolder} for partition ${partition} of token ${contractAddress} was not found in cache`,
        );

        // Cache miss: we need to perform the request d

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${this.adaptName(
                contractName,
              )}/balanceOfByPartition`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching partition balance',
          response,
        );

        const finalOutput = removeDecimalsFromBalances(response.data, DECIMALS);

        await CacheService.setDataInCache(
          cacheParams,
          BALANCE_BY_PARTITION_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'balanceOfByPartition',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Get tokensOfOwner]
   */
  async tokensOfOwner(
    callerId: string, // required for cache management
    contractName: SmartContract,
    tokenHolder: string,
    contractAddress: string,
    ethService: EthService,
  ): Promise<string[]> {
    try {
      const params = {
        owner: tokenHolder,
        contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const dataName = 'tokenOfOwnerByIndex';

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        dataName,
        callerId,
      );

      if (res) {
        this.logger.info(
          {},
          `>>> tokens of owner of ${tokenHolder} for token ${contractAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        this.logger.info(
          {},
          `SHALL BE AVOIDED AVOIDED: tokens of owner of ${tokenHolder} for token ${contractAddress} was not found in cache`,
        );

        const balance: number = await this.balanceOf(
          callerId,
          contractName,
          tokenHolder,
          contractAddress,
          ethService,
        );

        let itemsOwned: string[] = [];

        if (!balance) {
          return itemsOwned;
        }

        // Cache miss: we need to perform the request

        const retrieveTokenByIndex = async (index: number) => {
          const retriedClosure = () => {
            return this.httpService
              .get(
                `${SC_HOST}/call/${this.adaptName(contractName)}/${dataName}`,
                { params: { ...params, index } },
              )
              .toPromise();
          };
          const response = await execRetry(retriedClosure, 10, 3000, 1);

          this.apiCallHelperService.checkRequestResponseFormat(
            'fetching tokens of owner',
            response,
            true, // allowZeroLengthData
          );

          return response.data as string;
        };

        itemsOwned = await Promise.all(
          Array.from({ length: balance }, (_value, index) =>
            retrieveTokenByIndex(index),
          ),
        );

        await CacheService.setDataInCache(
          cacheParams,
          dataName,
          callerId,
          itemsOwned,
        );

        return itemsOwned;
      }
    } catch (error) {
      ErrorService.throwApiCallError('tokensOfOwner', API_NAME, error, 500);
    }
  }

  /**
   * [Get spendable balance by partition]
   */
  async spendableBalanceOfByPartition(
    callerId: string, // required for cache management
    tokenHolder: string,
    partition: string,
    tokenAddress: string,
    ethService: EthService,
  ): Promise<number> {
    try {
      let extensionAddress: string;
      const extensionContract: ContractDeployed =
        await this.retrieveTokenExtension(callerId, ethService, tokenAddress);
      if (!extensionContract.deployed) {
        this.logger.info(
          {},
          `-----------> Shall never happen: token ${tokenAddress} is not linked to an extension <--------------`,
        );
        return 0;
      } else {
        extensionAddress = extensionContract.address;
      }

      const params = {
        token: tokenAddress,
        partition,
        account: tokenHolder,
        contractAddress: extensionAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      delete cacheParams.contractAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        SPENDABLE_BALANCE_BY_PARTITION_DATA_NAME,
        callerId,
      );

      if (res === 0 || res) {
        this.logger.info(
          {},
          `>>> spendable balance of token holder ${tokenHolder} for partition ${partition} of token ${tokenAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        this.logger.info(
          {},
          `SHALL BE AVOIDED AVOIDED: spendable balance of token holder ${tokenHolder} for partition ${partition} of token ${tokenAddress} was not found in cache`,
        );

        // Cache miss: we need to perform the request d

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${this.adaptName(
                SmartContract.ERC1400_TOKENS_VALIDATOR,
              )}/spendableBalanceOfByPartition`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'fetching spendable partition balance',
          response,
        );

        const finalOutput = removeDecimalsFromBalances(response.data, DECIMALS);

        await CacheService.setDataInCache(
          cacheParams,
          SPENDABLE_BALANCE_BY_PARTITION_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'spendableBalanceOfByPartition',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Retrieve hold data]
   */
  async retrieveHoldData(
    callerId: string, // required for cache management
    holdId: string,
    tokenAddress: string,
    ethService: EthService,
  ): Promise<Hold> {
    try {
      const extensionAddress: string = await this.retrieveTokenExtensionAddress(
        callerId,
        ethService,
        tokenAddress,
      );

      const params = {
        token: tokenAddress,
        holdId: holdId,
        contractAddress: extensionAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        RETRIEVE_HOLD_DATA_NAME,
        callerId,
      );

      if (res) {
        this.logger.info(
          {},
          `>>> hold with ID ${holdId} for token ${tokenAddress} found in cache: ${res}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        this.logger.info(
          {},
          `SHALL BE AVOIDED AVOIDED: hold with ID ${holdId} for token ${tokenAddress} was not found in cache`,
        );

        // Cache miss: we need to perform the request d

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${this.adaptName(
                SmartContract.ERC1400_TOKENS_VALIDATOR,
              )}/retrieveHoldData`,
              { params },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'retrieving hold data',
          response,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache(
          cacheParams,
          RETRIEVE_HOLD_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('retrieveHoldData', API_NAME, error, 500);
    }
  }

  /**
   * [Get interface implementer]
   *
   * ERC1820 is an on-chain registry, e.g. a set of key-value pairs where the keys and values are Ethereum addresses.
   *
   * First usage we have of it, is to store the addresses of token's extensions:
   *  - tokenAddress1 --> extensionAddress1
   *  - tokenAddress2 --> extensionAddress2
   *  - tokenAddress3 --> extensionAddress3
   *  - etc.
   *
   * Second usage we have of it, is to store the addresses of smart contracts that are shared amongst all
   * users of the platform (e.g. DVP, BatchBalanceReader, BatchIssuer, etc.):
   *  - deployerAddress --> DVP
   *  - deployerAddress --> BatchBalanceReader
   *  - deployerAddress --> BatchIssuer
   *  - etc.
   *
   */
  async getInterfaceImplementer(
    callerId: string, // required for cache management
    contractName: SmartContract,
    ethService: EthService,
    keyAddress: string,
  ) {
    try {
      const interfaceHash: string = web3Utils.soliditySha3(contractName);

      const params = {
        _addr: keyAddress,
        _interfaceHash: interfaceHash,
        contractAddress: ERC1820_REGISTRY_ADDRESS,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        INTERFACE_IMPLEMENTER_DATA_NAME,
        callerId,
      );

      if (res) {
        this.logger.info(
          {},
          `>>> interface implementer for contract ${contractName} and key ${keyAddress} found in cache: ${JSON.stringify(
            res,
          )}`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        if (contractName === SmartContract.ERC1400_TOKENS_VALIDATOR) {
          this.logger.info(
            {},
            `SHALL BE AVOIDED AVOIDED: interface implementer for contract ${contractName} and key ${keyAddress} was not found in cache`,
          );
        }

        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(`${SC_HOST}/call/ERC1820Registry/getInterfaceImplementer`, {
              params,
            })
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        await this.apiCallHelperService.checkRequestResponseFormat(
          'fetching interface implementer',
          response,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache(
          cacheParams,
          INTERFACE_IMPLEMENTER_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'getInterfaceImplementer',
        API_NAME,
        error,
        500,
      );
    }
  }

  async canImplementInterfaceForAddress(
    callerId: string, // required for cache management
    contractAddress: string,
    contractName: SmartContract,
    ethService: EthService,
  ) {
    try {
      const interfaceHash: string = web3Utils.soliditySha3(contractName);

      const params = {
        interfaceHash,
        contractAddress,
        signerAddress: FUNDER_ADDRESS,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const dataName = 'canImplementInterfaceForAddress';

      // We remove 'signerAddress' from params, as we dont necessarily have the same value when retrieving data from cache
      const cacheParams = { ...params };
      delete cacheParams.signerAddress;
      const res = await CacheService.getDataFromCache(
        cacheParams,
        dataName,
        callerId,
      );

      if (res) {
        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(
              `${SC_HOST}/call/${this.adaptName(
                contractName,
              )}/canImplementInterfaceForAddress`,
              {
                params,
              },
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        await this.apiCallHelperService.checkRequestResponseFormat(
          'checking contract interface',
          response,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache(
          cacheParams,
          dataName,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'canImplementInterfaceForAddress',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Get deployer address]
   */
  async getDeployerAddress(
    callerId: string, // required for cache management
  ) {
    try {
      const dataName = 'deployerAddress';

      const res = await CacheService.getDataFromCache({}, dataName, callerId);

      if (res) {
        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        // Cache miss: we need to perform the request
        const retriedClosure = () => {
          return this.httpService
            .get(`${SC_HOST}/generic/get-deployer-address`, { params: {} })
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        await this.apiCallHelperService.checkRequestResponseFormat(
          'fetching deployer address',
          response,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache({}, dataName, callerId, finalOutput);
        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'getDeployerAddress',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Fetch ether balance]
   */
  async fetchEtherBalance(
    callerId: string, // required for cache management
    ethAddress: string,
    ethService: EthService,
  ) {
    try {
      const params = {
        userAddress: ethAddress,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const res = await CacheService.getDataFromCache(
        params,
        ETHER_BALANCE_DATA_NAME,
        callerId,
      );

      if (res === 0 || (res && !isNaN(res))) {
        return res;
      } else {
        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService
            .get(`${SC_HOST}/generic/get-user-balance`, { params })
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 3, 3000, 1);

        this.apiCallHelperService.checkRequestResponseCode(
          'fetching ETH balance',
          response,
        );

        const finalOutput = response.data;
        await CacheService.setDataInCache(
          params,
          ETHER_BALANCE_DATA_NAME,
          callerId,
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('fetchEtherBalance', API_NAME, error, 500);
    }
  }

  /**
   * [Get transaction block number]
   */
  async getTxBlockNumber(
    txHash: string,
    ethService: EthService,
  ): Promise<number> {
    try {
      const params = {
        txHash: txHash,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(`${SC_HOST}/generic/get-transaction-receipt`, { params })
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving transaction block number',
        response,
      );

      if (response.data.tx && response.data.tx.blockNumber) {
        return parseInt(response.data.tx.blockNumber);
      } else {
        ErrorService.throwError(
          'wrong response format (tx receipt does not contain block number)',
        );
      }
    } catch (error) {
      ErrorService.throwApiCallError('getTxBlockNumber', API_NAME, error, 500);
    }
  }

  /**
   * [Get block number]
   */
  async getCurrentBlockNumber(ethService: EthService): Promise<number> {
    try {
      const params = {
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .get(`${SC_HOST}/generic/get-block-number`, {
            params,
          })
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 10, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving current block number',
        response,
      );

      if (!response.data.blockNumber) {
        throw new Error('error retrieving blockNumber');
      }

      return parseInt(response.data.blockNumber);
    } catch (error) {
      ErrorService.throwApiCallError(
        'getCurrentBlockNumber',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Withdraw all ether from user account]
   */
  async withdrawAllEtherFromUserWallet(
    tenantId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    walletToEmpty: Wallet,
    withdrawalAddress: string,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ): Promise<ApiSCResponse> {
    try {
      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        walletToEmpty[WalletKeys.WALLET_ADDRESS],
      );

      const body = {
        account: walletToEmpty[WalletKeys.WALLET_ADDRESS],
        withdrawalAddress: withdrawalAddress,
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/generic/withdraw-all-ether-from-account`,
            this.decorateBody(tenantId, body),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 3000, 1);

      if (!response && response.data) {
        ErrorService.throwError('invalid response from Smart-Contract-API'); // traditional check can't be made here as response contains no tx
      }

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'withdrawAllEtherFromUserWallet',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Transfer ownership]
   */
  async transferOwnership(
    tenantId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    contractName: SmartContract,
    contractAddress: string,
    signerAddress: string,
    newOwner: string,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ) {
    try {
      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        signerAddress,
      );

      const body = {
        contractAddress: contractAddress,
        signerAddress,
        newOwner: newOwner,
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/transaction/${this.adaptName(
              contractName,
            )}/transferOwnership`,
            this.decorateBody(tenantId, body),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 3000, 1);

      this.checkTxSendingResponseFormat(
        'transferring contract ownership',
        response,
        ethService,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('transferOwnership', API_NAME, error, 500);
    }
  }

  /**
   * [Set custom token extension]
   */
  async setCustomTokenExtension(
    tenantId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    customExtensionAddress: string,
    contractName: SmartContract,
    contractAddress: string,
    signerAddress: string,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ) {
    try {
      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        signerAddress,
      );

      const body = {
        extension: customExtensionAddress,
        interfaceLabel: SmartContract.ERC1400_TOKENS_VALIDATOR,
        removeOldExtensionRoles: true,
        addMinterRoleForExtension: true,
        addControllerRoleForExtension: true,
        contractAddress: contractAddress,
        signerAddress,
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/transaction/${this.adaptName(
              contractName,
            )}/setTokenExtension`,
            this.decorateBody(tenantId, body),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 3000, 1);

      this.checkTxSendingResponseFormat(
        'setting custom token extension',
        response,
        ethService,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'setCustomTokenExtension',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Add allowlisted]
   */
  async addAllowlisted(
    tenantId: string,
    callerId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    investorAddress: string,
    tokenAddress: string,
    signerAddress: string,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ) {
    try {
      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        signerAddress,
      );

      const extensionAddress: string = await this.retrieveTokenExtensionAddress(
        callerId,
        ethService,
        tokenAddress,
      );

      const body = {
        token: tokenAddress,
        account: investorAddress,
        contractAddress: extensionAddress,
        signerAddress,
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/transaction/${this.adaptName(
              SmartContract.ERC1400_TOKENS_VALIDATOR,
            )}/addAllowlisted`,
            this.decorateBody(tenantId, body),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 3000, 1);

      this.checkTxSendingResponseFormat(
        'adding allowlisted',
        response,
        ethService,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('addAllowlisted', API_NAME, error, 500);
    }
  }

  /**
   * [Remove allowlisted]
   */
  async removeAllowlisted(
    tenantId: string,
    callerId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    investorAddress: string,
    tokenAddress: string,
    signerAddress: string,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ) {
    try {
      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        signerAddress,
      );

      const extensionAddress: string = await this.retrieveTokenExtensionAddress(
        callerId,
        ethService,
        tokenAddress,
      );

      const body = {
        token: tokenAddress,
        account: investorAddress,
        contractAddress: extensionAddress,
        signerAddress,
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/transaction/${this.adaptName(
              SmartContract.ERC1400_TOKENS_VALIDATOR,
            )}/removeAllowlisted`,
            this.decorateBody(tenantId, body),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 3000, 1);

      this.checkTxSendingResponseFormat(
        'removing allowlisted',
        response,
        ethService,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('removeAllowlisted', API_NAME, error, 500);
    }
  }

  /**
   * [Release token hold]
   */
  async releaseHold(
    tenantId: string,
    callerId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    holdId: string,
    tokenAddress: string,
    signerAddress: string,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ) {
    try {
      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        signerAddress,
      );

      const extensionAddress: string = await this.retrieveTokenExtensionAddress(
        callerId,
        ethService,
        tokenAddress,
      );

      const body = {
        token: tokenAddress,
        holdId: holdId,
        contractAddress: extensionAddress,
        signerAddress,
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/transaction/${this.adaptName(
              SmartContract.ERC1400_TOKENS_VALIDATOR,
            )}/releaseHold`,
            this.decorateBody(tenantId, body),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 3000, 1);

      this.checkTxSendingResponseFormat(
        'releasing token hold',
        response,
        ethService,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('releaseHold', API_NAME, error, 500);
    }
  }

  /**
   * [Execute token hold]
   */
  async executeHold(
    tenantId: string,
    callerId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    holdId: string,
    value: string,
    secret: string,
    tokenAddress: string,
    signerAddress: string,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ) {
    try {
      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        signerAddress,
      );

      const extensionAddress: string = await this.retrieveTokenExtensionAddress(
        callerId,
        ethService,
        tokenAddress,
      );

      const body = {
        token: tokenAddress,
        holdId: holdId,
        value: value,
        secret: secret,
        contractAddress: extensionAddress,
        signerAddress,
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/transaction/${this.adaptName(
              SmartContract.ERC1400_TOKENS_VALIDATOR,
            )}/executeHold`,
            this.decorateBody(tenantId, body),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 3000, 1);

      this.checkTxSendingResponseFormat(
        'executing token hold',
        response,
        ethService,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('executeHold', API_NAME, error, 500);
    }
  }

  /**
   * [Execute delivery-vs-payment]
   */
  async executeDVP(
    tenantId: string,
    callerId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    token1Address: string,
    token1HoldId: string,
    token1StandardAsNumber: number,
    token2Address: string,
    token2HoldId: string,
    token2StandardAsNumber: number,
    htlcSecret: string,
    signerAddress: string,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ) {
    try {
      const config: any = await this.craftConfig(
        authToken,
        tenantConfig,
        ethService,
        signer,
        web3Utils.toChecksumAddress(signerAddress),
      );

      const dvpAddress: string = await this.retrieveDVPAddress(
        callerId,
        ethService,
      );

      const body: any = {
        token1: web3Utils.toChecksumAddress(token1Address),
        token1HoldId: token1HoldId,
        tokenStandard1: token1StandardAsNumber,
        token2: web3Utils.toChecksumAddress(token2Address),
        token2HoldId: token2HoldId,
        tokenStandard2: token2StandardAsNumber,
        preimage: htlcSecret,
        contractAddress: web3Utils.toChecksumAddress(dvpAddress),
        signerAddress: web3Utils.toChecksumAddress(signerAddress),
        ethServiceType: ethService[EthServiceKeys.TYPE],
        chain: ethService[EthServiceKeys.DATA][NetworkKeys.KEY],
      };

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/transaction/${this.adaptName(
              SmartContract.DVP_HOLDABLE_LOCKABLE,
            )}/executeHolds`,
            this.decorateBody(tenantId, body),
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 3000, 1);

      this.checkTxSendingResponseFormat(
        'executing delivery-vs-payment',
        response,
        ethService,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('executeDVP', API_NAME, error, 500);
    }
  }

  /**
   * [Fetch ether balance]
   */
  async listAllNetworks(): Promise<ListAllNetworksOutput> {
    try {
      const cacheParams = {};
      const res = await CacheService.getDataFromCache(
        cacheParams,
        NETWORKS_DATA_NAME,
        undefined, // callerId (here we share the same cache for all api users, as networks are almost never updated - thus we don't need to specify callerId)
      );

      if (res) {
        this.logger.info(
          {},
          `>>> list of networks found in cache: list of ${res?.networks?.length} networks (default: ${res?.defaultNetwork})`,
        );

        // Cache hit: the solver is a trivial promise
        return res;
      } else {
        // Cache miss: we need to perform the request

        const retriedClosure = () => {
          return this.httpService.get(`${SC_HOST}/networks`).toPromise();
        };
        const response = await execRetry(retriedClosure, 10, 3000, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'listing all networks',
          response,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache(
          cacheParams,
          NETWORKS_DATA_NAME,
          undefined, // callerId (here we share the same cache for all api users, as networks are almost never updated - thus we don't need to specify callerId)
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError('listAllNetworks', API_NAME, error, 500);
    }
  }

  /**
   * [Can be used to check response format for any kind of transaction request to Api-smart-contract]
   */
  checkTxSendingResponseFormat(
    actionDescription: string,
    response: any,
    ethService: EthService,
  ): boolean {
    try {
      this.apiCallHelperService.checkRequestResponseFormat(
        actionDescription,
        response,
      );

      if (!response.data[ApiSCResponseKeys.TYPE]) {
        ErrorService.throwError('response contains no type');
      }

      if (!response.data[ApiSCResponseKeys.TX_IDENTIFIER]) {
        ErrorService.throwError(
          'response contains no type or no txIdentifier or no tx',
        );
      }

      if (!response.data[ApiSCResponseKeys.TX]) {
        ErrorService.throwError('response contains no tx');
      }

      if (
        ethService[EthServiceKeys.TYPE] !==
        response.data[ApiSCResponseKeys.TYPE]
      ) {
        ErrorService.throwError(
          `response type (${
            response.data[ApiSCResponseKeys.TYPE]
          }) is not expected response type(${ethService[EthServiceKeys.TYPE]})`,
        );
      }

      if (
        ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER &&
        !response.data[ApiSCResponseKeys.TX_SERIALIZED]
      ) {
        ErrorService.throwError('response contains no txSerialized');
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "checking 'send tx' response format",
        'checkTxSendingResponseFormat',
        false,
        500,
      );
    }
  }

  /**
   * [Check whether or not token belongs to expected category]
   */
  retrieveSmartContractFunctionName(
    tokenCategory: TokenCategory,
    functionName: FunctionName,
  ): string {
    try {
      let smartContractFunctionName: string;
      if (tokenCategory === TokenCategory.FUNGIBLE) {
        smartContractFunctionName =
          functionRules[functionName][FunctionRule.ERC20_FUNCTION_NAME];
      } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
        smartContractFunctionName =
          functionRules[functionName][FunctionRule.ERC721_FUNCTION_NAME];
      } else if (tokenCategory === TokenCategory.HYBRID) {
        smartContractFunctionName =
          functionRules[functionName][FunctionRule.ERC1400_FUNCTION_NAME];
      } else {
        ErrorService.throwError(`unknown token category (${tokenCategory})`);
      }

      if (!smartContractFunctionName) {
        ErrorService.throwError(
          `no ${functionName} smart contract function for ${tokenCategory.toLowerCase()} tokens`,
        );
      }

      return smartContractFunctionName;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving smart contract function name',
        'retrieveSmartContractFunctionName',
        false,
        500,
      );
    }
  }

  async retrieveDeployerAddress(callerId: string, ethService: EthService) {
    try {
      let networkKey: string;
      if (
        ethService &&
        ethService[EthServiceKeys.DATA] &&
        ethService[EthServiceKeys.DATA][NetworkKeys.KEY]
      ) {
        networkKey = ethService[EthServiceKeys.DATA][NetworkKeys.KEY];
      } else {
        ErrorService.throwError('invalid ethService');
      }

      const deployerAddresses = await this.getDeployerAddress(callerId);

      let deployerAddress: string;
      deployerAddresses.map(
        (networkDeployer: { key: string; deployer: string }) => {
          if (networkDeployer.key === networkKey) {
            deployerAddress = networkDeployer.deployer;
          }
        },
      );
      this.checkEthAddressFormat(deployerAddress, 'deployer');

      return deployerAddress;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving deployer address',
        'retrieveDeployerAddress',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve smart contract extension address]
   */
  async retrieveTokenExtensionControllers(
    callerId: string,
    ethService: EthService,
    tokenAddress: string,
  ): Promise<Array<string>> {
    try {
      const extensionAddress: string = await this.retrieveTokenExtensionAddress(
        callerId,
        ethService,
        tokenAddress,
      );

      const tokenExtensionSetup: Array<any> =
        await this.retrieveTokenExtensionSetup(
          tokenAddress,
          extensionAddress,
          ethService,
        );

      const tokenControllers: Array<string> =
        tokenExtensionSetup[TokenExtensionSetup.TOKEN_CONTROLLERS];

      return tokenControllers;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token extension controllers',
        'retrieveTokenExtensionControllers',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve smart contract extension address]
   */
  async retrieveTokenExtensionAddress(
    callerId: string,
    ethService: EthService,
    tokenAddress: string,
  ): Promise<string> {
    try {
      const extensionContract: ContractDeployed =
        await this.retrieveTokenExtension(callerId, ethService, tokenAddress);
      if (!extensionContract.deployed) {
        ErrorService.throwError(
          `shall never happen: token ${tokenAddress} is not linked to an extension`,
        );
      }

      return extensionContract.address;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token extension address',
        'retrieveTokenExtensionAddress',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve smart contract extension address]
   */
  async retrieveTokenExtension(
    callerId: string,
    ethService: EthService,
    tokenAddress: string,
  ): Promise<ContractDeployed> {
    try {
      const extensionAddress: string = await this.getInterfaceImplementer(
        callerId, // required for cache management
        SmartContract.ERC1400_TOKENS_VALIDATOR,
        ethService,
        tokenAddress,
      );
      if (
        extensionAddress &&
        extensionAddress.length === 42 &&
        extensionAddress !== ZERO_ADDRESS
      ) {
        return {
          deployed: true,
          address: extensionAddress,
        };
      } else {
        return {
          deployed: false,
          address: extensionAddress,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token extension',
        'retrieveTokenExtension',
        false,
        500,
      );
    }
  }

  /**
   * [Check Ethereum address format]
   */
  checkEthAddressFormat(address: string, addressLabel: string) {
    try {
      if (!(address && address.length === 42 && address !== ZERO_ADDRESS)) {
        ErrorService.throwError(
          `invalid ${addressLabel} address retrieved: ${address}`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking ETH address format',
        'checkEthAddressFormat',
        false,
        500,
      );
    }
  }

  /**
   * [Check if batch reader smart contract is deployed]
   */
  async checkBatchReaderIsDeployed(
    callerId: string,
    ethService: EthService,
  ): Promise<ContractDeployed> {
    try {
      const deployerAddress: string = await this.retrieveDeployerAddress(
        callerId,
        ethService,
      );

      const readerAddress: string = await this.getInterfaceImplementer(
        callerId, // required for cache management
        SmartContract.BATCH_READER,
        ethService,
        deployerAddress,
      );

      if (
        readerAddress &&
        readerAddress.length === 42 &&
        readerAddress !== ZERO_ADDRESS
      ) {
        return {
          deployed: true,
          address: readerAddress,
        };
      } else {
        return {
          deployed: false,
          address: readerAddress,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if batch reader smart contract is deployed',
        'checkBatchReaderIsDeployed',
        false,
        500,
      );
    }
  }

  /**
   * [Check if generic extension smart contract is deployed]
   */
  async checkGenericTokenExtensionIsDeployed(
    callerId: string,
    ethService: EthService,
  ): Promise<ContractDeployed> {
    try {
      const deployerAddress: string = await this.retrieveDeployerAddress(
        callerId,
        ethService,
      );

      const extensionAddress: string = await this.getInterfaceImplementer(
        callerId, // required for cache management
        SmartContract.ERC1400_TOKENS_VALIDATOR,
        ethService,
        deployerAddress,
      );
      if (
        extensionAddress &&
        extensionAddress.length === 42 &&
        extensionAddress !== ZERO_ADDRESS
      ) {
        return {
          deployed: true,
          address: extensionAddress,
        };
      } else {
        return {
          deployed: false,
          address: extensionAddress,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if generic extension smart contract is deployed',
        'checkGenericTokenExtensionIsDeployed',
        false,
        500,
      );
    }
  }

  /**
   * [Check if DVP smart contract is deployed]
   */
  async checkDVPIsDeployed(
    callerId: string,
    ethService: EthService,
  ): Promise<ContractDeployed> {
    try {
      const deployerAddress: string = await this.retrieveDeployerAddress(
        callerId,
        ethService,
      );

      const dvpAddress: string = await this.getInterfaceImplementer(
        callerId, // required for cache management
        SmartContract.DVP_HOLDABLE_LOCKABLE,
        ethService,
        deployerAddress,
      );
      if (
        dvpAddress &&
        dvpAddress.length === 42 &&
        dvpAddress !== ZERO_ADDRESS
      ) {
        return {
          deployed: true,
          address: dvpAddress,
        };
      } else {
        return {
          deployed: false,
          address: dvpAddress,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if dvp smart contract is deployed',
        'checkDVPIsDeployed',
        false,
        500,
      );
    }
  }

  /**
   * [Check if DVP smart contract is deployed]
   */
  async retrieveDVPAddress(
    callerId: string,
    ethService: EthService,
  ): Promise<string> {
    try {
      const dvpContract: ContractDeployed = await this.checkDVPIsDeployed(
        callerId,
        ethService,
      );
      if (!dvpContract.deployed) {
        ErrorService.throwError(
          'shall never happen: no DVP is deployed on this network',
        );
      }
      return dvpContract.address;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving DVP address',
        'retrieveDVPAddress',
        false,
        500,
      );
    }
  }

  /**
   * [Check if holdId is valid]
   */
  async retrieveHoldIfExisting(
    callerId: string,
    ethService: EthService,
    holdId: string,
    tokenAddress: string,
    checkHoldValue: boolean,
    value: number,
    validReceiver?: string,
  ): Promise<Hold> {
    try {
      checkSolidityBytes32(holdId);

      const hold: Hold = await this.retrieveHoldData(
        callerId,
        holdId,
        tokenAddress,
        ethService,
      );

      if (
        parseInt(hold[HoldKeys.VALUE]) === 0 &&
        hold[HoldKeys.SENDER] === ZERO_ADDRESS &&
        hold[HoldKeys.RECIPIENT] === ZERO_ADDRESS
      ) {
        ErrorService.throwError(
          `no hold with ID ${holdId} was found in extension for token contract at address ${tokenAddress}`,
        );
      }

      if (validReceiver && validReceiver !== hold[HoldKeys.RECIPIENT]) {
        ErrorService.throwError(
          `hold with ID ${holdId} has a different payment account address (${
            hold[HoldKeys.RECIPIENT]
          }) from expected ${validReceiver}`,
        );
      }

      const holdValue: number = removeDecimalsFromBalances(
        hold[HoldKeys.VALUE],
        DECIMALS,
      );
      if (checkHoldValue && holdValue < value) {
        ErrorService.throwError(
          `hold with ID ${holdId} contains less tokens (${holdValue}) than expected ${value}`,
        );
      }

      return hold;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving hold if existing',
        'retrieveHoldIfExisting',
        false,
        500,
      );
    }
  }

  /**
   * [Create faucet]
   */
  async createFaucet(
    networkKey: string,
    faucetWallet: string,
    tenantId: string,
    name: string,
    authToken: string,
  ): Promise<IFaucet> {
    try {
      const headers: any = {
        Authorization: 'Bearer '.concat(authToken),
      };

      const config = { headers };

      const retriedClosure = () => {
        return this.httpService
          .post(
            `${SC_HOST}/networks/faucet`,
            {
              networkKey,
              faucetWallet,
              forceTenantId: OrchestrateUtils.publicTenantId, //  publicTenantId = '_', // TODO this will be removed as soon as "nested multi-tenancy" is added to orchestrate
              tenantId,
              name,
              authToken,
            },
            config,
          )
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating faucet',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createFaucet', API_NAME, error, 500);
    }
  }

  /**
   * [Get faucet balance]
   */
  async getFaucets(networkKey: string, authToken: string): Promise<IFaucet[]> {
    try {
      const config: any = {
        params: { networkKey },
        headers: {
          Authorization: 'Bearer ' + authToken,
        },
      };

      const retriedClosure = () => {
        return this.httpService
          .get(`${SC_HOST}/networks/faucets`, config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 5, 3000, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'getting faucets',
        response,
        true,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('getFaucetBalance', API_NAME, error, 500);
    }
  }

  /**
   * [Test network is alive]
   */
  async testNetworkIsAlive(network: Network): Promise<{
    jsonrpc: string; // Ex: "2.0"
    id: number; // Ex: 67
    result: string; // Ex: "291528645"
  }> {
    try {
      const rpcEndpoint = network[NetworkKeys.RPC_ENDPOINT];

      if (!rpcEndpoint) {
        ErrorService.throwError(
          `undefined rpcEndpont for network with key ${
            network?.[NetworkKeys.KEY]
          }`,
        );
      }

      const cacheParams = {
        rpcEndpoint,
      };

      const res = await CacheService.getDataFromCache(
        cacheParams,
        NETWORK_ALIVE,
        undefined, // callerId (here we share the same cache for all api users, as networks are almost never updated - thus we don't need to specify callerId)
      );

      if (res) {
        if (res === THROW_ERROR) {
          this.logger.info(
            {},
            `>>> network alive status found in cache for ${
              network[NetworkKeys.KEY]
            }: NOT ALIVE`,
          );
          ErrorService.throwError(
            `Network ${
              network[NetworkKeys.KEY]
            } is not alive (please check if your rpcEndpoint is still valid)`,
          );
        } else {
          this.logger.info(
            {},
            `>>> network alive status found in cache for ${
              network[NetworkKeys.KEY]
            }: ${JSON.stringify(res || {})}`,
          );

          return res;
        }
      } else {
        const retriedClosure = () => {
          return this.httpService
            .post(rpcEndpoint, {
              jsonrpc: '2.0',
              method: 'net_version',
              params: [],
              id: 67,
            })
            .toPromise();
        };

        let response;

        try {
          response = await execRetry(retriedClosure, 3, 1000, 1); // no retry
        } catch (error) {
          // Save error in cache in order to avoid trying to test if network is alive too many times
          await CacheService.setDataInCache(
            cacheParams,
            NETWORK_ALIVE,
            undefined, // callerId (here we share the same cache for all api users, as networks are almost never updated - thus we don't need to specify callerId)
            THROW_ERROR,
          );
        }

        this.apiCallHelperService.checkRequestResponseFormat(
          'test if network is alive',
          response,
          true,
        );

        const finalOutput = response.data;

        await CacheService.setDataInCache(
          cacheParams,
          NETWORK_ALIVE,
          undefined, // callerId (here we share the same cache for all api users, as networks are almost never updated - thus we don't need to specify callerId)
          finalOutput,
        );

        return finalOutput;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'testNetworkIsAlive',
        API_NAME,
        error,
        500,
      );
    }
  }
}
