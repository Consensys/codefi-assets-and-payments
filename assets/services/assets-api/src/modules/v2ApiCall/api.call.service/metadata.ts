import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import axios, { AxiosInstance } from 'axios';
import web3Utils from 'web3-utils';

import ErrorService from 'src/utils/errorService';
import { ApiCallHelperService } from '.';

import { keys as UserKeys, UserType, User } from 'src/types/user';

import { keys as TokenKeys, Token } from 'src/types/token';
import {
  TokenIdentifierEnum,
  ProjectEnum,
  CycleEnum,
  UserEnum,
} from 'src/old/constants/enum';
import { CycleStatus } from 'src/types/asset/cycle';

import { keys as DeploymentKeys } from 'src/types/deployment';
import { AssetType, RawAssetTemplate } from 'src/types/asset/template';
import { AssetElementInstance } from 'src/types/asset/elementInstance';
import { keys as ConfigKeys, Config, TENANT_FLAG } from 'src/types/config';
import execRetry from 'src/utils/retry';
import { keys as ProjectKeys, Project } from 'src/types/project';
import {
  keys as WorkflowInstanceKeys,
  PrimaryTradeType,
  WorkflowInstance,
  WorkflowInstanceMetadata,
} from 'src/types/workflow/workflowInstances';
import { EntityType } from 'src/types/entity';
import { MetadataApiTenantDeletionResponse } from 'src/modules/v2ApiCall/DTO/metadata-api-tenant-deletion-response.dto';
import { AssetDataKeys, retrieveTokenCurrency } from 'src/types/asset';
import { ApiEntityCallService } from './entity';

const METADATA_HOST: string = process.env.METADATA_API;
const API_NAME = 'Metadata-Api';

@Injectable()
export class ApiMetadataCallService {
  private metadata: AxiosInstance;

  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiCallHelperService: ApiCallHelperService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {
    this.metadata = axios.create({
      baseURL: METADATA_HOST,
    });
  }

  // TODO: FUNCTION TO BE DEPRECATED
  /**
   * [Fetch user infos]
   *  - _keyType: Defines whether the user(s) shall be fetched per userId/authId/
   *    email/firstConnectionCode/etc.
   *  - _userKey: Value of userId/authId/email/firstConnectionCode/etc.
   *  - _shallReturnSingleUser: Defines whether a single user shall be returned (unique user)
   *    or whether multiple users shall be returned (array of users)
   */
  async retrieveUserInDB(
    tenantId: string,
    keyType: number,
    userKey: string,
    shallReturnSingleUser: boolean,
  ) {
    try {
      let params: any;

      if (keyType !== UserEnum.all && !userKey) {
        ErrorService.throwError(
          'shall never happen: missing parameter when calling Metadata-Api to retrieve users',
        );
      }

      if (keyType === UserEnum.all) {
        params = {
          tenantId,
        };
      } else if (keyType === UserEnum.userId) {
        params = {
          tenantId,
          userId: userKey,
        };
      } else if (keyType === UserEnum.authId) {
        params = {
          tenantId,
          authId: userKey,
        };
      } else if (keyType === UserEnum.email) {
        params = {
          tenantId,
          email: userKey,
        };
      } else if (keyType === UserEnum.firstConnectionCode) {
        params = {
          tenantId,
          firstConnectionCode: userKey,
        };
      } else if (keyType === UserEnum.superUserId) {
        params = {
          tenantId,
          superUserId: userKey,
        };
      } else if (keyType === UserEnum.userType) {
        params = {
          tenantId,
          userType: userKey,
        };
      } else if (keyType === UserEnum.userTypes) {
        params = {
          tenantId,
          userTypes: userKey,
        };
      } else {
        throw new Error(`Unknown key type: ${keyType}`);
      }

      const BATCH_SIZE = 1000;

      let offset = 0; // number of users to skip
      const limit = BATCH_SIZE; // total number of users returned
      let usersList = [];
      let nbRequests = 0;
      let nbUsersToFetch: number;

      while (nbUsersToFetch === undefined || nbUsersToFetch > 0) {
        nbRequests++;

        const retriedClosure = () => {
          return this.metadata.get(`/users?offset=${offset}&limit=${limit}`, {
            params,
          });
        };
        const response = await execRetry(retriedClosure, 3, 1500, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'retrieving user from DB',
          response,
          true, // allowZeroLengthData
        );

        if (
          !(response.data && response.data.length && response.data.length === 2)
        ) {
          ErrorService.throwError(
            'invalid response format: metadata-api is supposed to return an array of [usersList, totalUsersNumber]',
          );
        }

        // Add fetched users to final response
        usersList = [...usersList, ...response.data[0]];

        // Update 'nbUsersToFetch' and 'offset'
        if (nbUsersToFetch === undefined) {
          nbUsersToFetch = response.data[1];
        }
        nbUsersToFetch = nbUsersToFetch - response.data[0]?.length;
        offset += response.data[0]?.length;
      }

      this.logger.debug(
        `Performed ${nbRequests} requests of max ${BATCH_SIZE} users to retrieve a total of ${usersList.length} users`,
      );
      if (nbRequests > 100) {
        ErrorService.throwError(
          `Shall never happen: too many users to retrieve (more than ${
            BATCH_SIZE * 100
          })`,
        );
      }

      if (usersList.length !== 0) {
        if (shallReturnSingleUser) {
          return usersList[0];
        } else {
          return usersList;
        }
      } else {
        if (shallReturnSingleUser) {
          throw new Error(`user ${userKey} does not exist`);
        } else {
          return [];
        }
      }
    } catch (error) {
      ErrorService.throwApiCallError('retrieveUserInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Craft token object]
   */
  async craftToken(
    name: string,
    symbol: string,
    contractType,
    defaultContractAddress: string,
    defaultChainId: string, // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
    defaultNetworkKey: string,
    picture: string,
    description: string,
    bankDepositDetail: any,
    assetClasses: Array<string>,
    assetTemplateId: string,
    issuerId: string,
    creatorId: string,
    reviewerId: string,
    data: any,
  ) {
    try {
      const deployments = [];
      if (defaultContractAddress) {
        deployments.push({
          [DeploymentKeys.DEPLOYMENT_ADDRESS]: web3Utils.toChecksumAddress(
            defaultContractAddress,
          ),
          [DeploymentKeys.DEPLOYMENT_CHAIN_ID]: defaultChainId,
        });
      }

      return {
        [TokenKeys.NAME]: name,
        [TokenKeys.SYMBOL]: symbol,
        [TokenKeys.STANDARD]: contractType,
        [TokenKeys.DEFAULT_DEPLOYMENT]: defaultContractAddress
          ? web3Utils.toChecksumAddress(defaultContractAddress)
          : null,
        [TokenKeys.DEFAULT_CHAIN_ID]: defaultChainId, // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
        [TokenKeys.DEFAULT_NETWORK_KEY]: defaultNetworkKey,
        [TokenKeys.DEPLOYMENTS]: deployments,
        [TokenKeys.PICTURE]: picture,
        [TokenKeys.DESCRIPTION]: description,
        [TokenKeys.BANK_ACCOUNT]: bankDepositDetail,
        [TokenKeys.ASSET_TEMPLATE_ID]: assetTemplateId,
        [TokenKeys.ISSUER_ID]: issuerId,
        [TokenKeys.CREATOR_ID]: creatorId,
        [TokenKeys.REVIEWER_ID]: reviewerId,
        [TokenKeys.ASSET_CLASSES]: assetClasses
          ? assetClasses.map((assetclass: string) => {
              return assetclass.toLowerCase();
            })
          : [''],
        [TokenKeys.DATA]: data ? data : {},
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'craftig token',
        'craftToken',
        false,
        500,
      );
    }
  }

  /**
   * [Create token]
   *  - tokenName Name of the token (in the smart contract)
   *  - tokenSymbol Symbol of the token (in the smart contract)
   *  - contractType Type of token standard (ERC20/ERC721/ERC1400)
   *  - tokenAddress Address of the token smart contract
   *  - defaultChainId ChainId of the blockchain network, where the smart contract is deployed // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
   *  - defaultNetworkKey Network key of the blockchain network, where the smart contract is deployed
   *  - [OPTIONAL] picture Picture of the token
   *  - [OPTIONAL] description Description of the token
   *  - [OPTIONAL] bankDepositDetail Bank account detail, for the issuer to receive payments
   *  - assetClasses Asset classes authorized for this token (off-chain authorization)
   */
  async createTokenInDB(
    tenantId: string,
    tokenName: string,
    tokenSymbol: string,
    contractType: string,
    tokenAddress: string,
    defaultChainId: string, // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
    defaultNetworkKey: string,
    picture: string,
    description: string,
    bankDepositDetail: any,
    assetClasses: Array<string>,
    assetTemplateId: string,
    issuerId: string,
    creatorId: string,
    reviewerId: string,
    data: any,
  ) {
    try {
      if (tokenAddress) {
        const tokensWithSameAddress = await this.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.address,
          tokenAddress,
          false,
          undefined,
          undefined,
          false,
        );

        if (tokensWithSameAddress.tokens.length > 0) {
          ErrorService.throwError(
            `a token with address ${tokenAddress} has already been created (ID: ${
              tokensWithSameAddress[0][TokenKeys.TOKEN_ID]
            })`,
          );
        }
      }

      const craftedToken = await this.craftToken(
        tokenName,
        tokenSymbol,
        contractType,
        tokenAddress,
        defaultChainId,
        defaultNetworkKey,
        picture,
        description,
        bankDepositDetail,
        assetClasses,
        assetTemplateId,
        issuerId,
        creatorId,
        reviewerId,
        data,
      );

      const retriedClosure = () => {
        return this.metadata.post(`/tokens?tenantId=${tenantId}`, craftedToken);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating token in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createTokenInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Fetch token infos]
   *  - keyType: Defines whether the token(s) shall be fetched per
   *    tokenId/address/name/symbol/etc.
   *  - tokenKey: Value of tokenId/address/name/symbol/etc.
   *  - shallReturnSingleToken: Defines whether a single token shall be
   *    returned (unique token) or whether multiple users shall be returned
   *    (array of tokens)
   */
  async retrieveTokenInDB(
    tenantId: string,
    keyType: number,
    tokenKey: string,
    shallReturnSingleToken: true,
    _globalOffset: number,
    _globalLimit: number,
    withAssetData: boolean,
  ): Promise<Token>;
  async retrieveTokenInDB(
    tenantId: string,
    keyType: number,
    tokenKey: string,
    shallReturnSingleToken: false,
    _globalOffset: number,
    _globalLimit: number,
    withAssetData: boolean,
  ): Promise<{ tokens: Token[]; total: number }>;
  async retrieveTokenInDB(
    tenantId: string,
    keyType: number,
    tokenKey: string,
    shallReturnSingleToken: boolean,
    _globalOffset: number,
    _globalLimit: number,
    withAssetData: boolean,
  ): Promise<Token | { tokens: Token[]; total: number }>;
  async retrieveTokenInDB(
    tenantId: string,
    keyType: number,
    tokenKey: string,
    shallReturnSingleToken: boolean,
    _globalOffset: number,
    _globalLimit: number,
    withAssetData: boolean,
    chainId?: string,
  ): Promise<Token | { tokens: Token[]; total: number }> {
    try {
      let params: any;
      if (keyType !== TokenIdentifierEnum.all && !tokenKey) {
        ErrorService.throwError(
          'shall never happen: missing parameter when calling Metadata-Api to retrieve tokens',
        );
      }

      if (keyType === TokenIdentifierEnum.all) {
        params = {
          tenantId,
        };
      } else if (keyType === TokenIdentifierEnum.tokenId) {
        params = {
          tenantId,
          tokenId: tokenKey,
        };
      } else if (keyType === TokenIdentifierEnum.address) {
        params = {
          tenantId,
          defaultDeployment: tokenKey,
          defaultChainId: chainId,
        };
      } else if (keyType === TokenIdentifierEnum.name) {
        params = {
          tenantId,
          name: tokenKey,
        };
      } else if (keyType === TokenIdentifierEnum.symbol) {
        params = {
          tenantId,
          symbol: tokenKey,
        };
      } else {
        throw new Error(`Unknown key type: ${keyType}`);
      }

      const BATCH_SIZE = 1000;

      let offset = _globalOffset !== undefined ? _globalOffset : 0; // number of tokens to skip
      const limit =
        _globalLimit !== undefined && _globalLimit < BATCH_SIZE
          ? _globalLimit
          : BATCH_SIZE; // total number of tokens returned
      let tokensList = [];
      let nbRequests = 0;
      let nbTokensToFetch: number;
      let totalTokensLengthSaved: number;

      while (nbTokensToFetch === undefined || nbTokensToFetch > 0) {
        nbRequests++;

        const requestUrl = `/tokens?offset=${offset}&limit=${limit}&withAssetData=${withAssetData}`;

        const retriedClosure = () => {
          return this.metadata.get(requestUrl, { params });
        };
        const response = await execRetry(retriedClosure, 3, 1500, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'retrieving token from DB',
          response,
          true, // allowZeroLengthData
        );

        if (
          !(response.data && response.data.length && response.data.length === 2)
        ) {
          ErrorService.throwError(
            'invalid response format: metadata-api is supposed to return an array of [tokensList, totalTokensNumber]',
          );
        }

        const partialTokensList = response.data[0];

        // Add fetched tokens to final response
        tokensList = [...tokensList, ...partialTokensList];

        // Update 'nbTokensToFetch' and 'offset'
        if (nbTokensToFetch === undefined) {
          // We shall only enter this condition the first time the loop is called
          const totalTokensLength = response.data[1];
          totalTokensLengthSaved = totalTokensLength; // We save total number of tokens to return it in the response

          nbTokensToFetch =
            _globalLimit !== undefined && _globalLimit < totalTokensLength
              ? _globalLimit
              : totalTokensLength; // If _limit is defined, we use it otherwise, we fetch the total list
        }
        nbTokensToFetch = nbTokensToFetch - partialTokensList?.length;
        offset += partialTokensList?.length;
      }

      this.logger.debug(
        `Performed ${nbRequests} requests of max ${BATCH_SIZE} tokens to retrieve a total of ${tokensList.length} tokens`,
      );
      if (nbRequests > 100) {
        ErrorService.throwError(
          `Shall never happen: too many tokens to retrieve (more than ${
            BATCH_SIZE * 100
          })`,
        );
      }

      if (tokensList.length !== 0) {
        if (shallReturnSingleToken) {
          return tokensList[0];
        }

        return {
          tokens: tokensList,
          total: totalTokensLengthSaved,
        };
      }

      if (shallReturnSingleToken) {
        throw new Error(`token ${tokenKey} does not exist`);
      }

      return {
        tokens: [],
        total: totalTokensLengthSaved,
      };
    } catch (error) {
      ErrorService.throwApiCallError('retrieveTokenInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Fetch token infos in batch]
   */
  async retrieveTokensBatchInDB(
    tenantId: string,
    tokenIds: Array<string>,
    withAssetData: boolean,
    withSearch?: string,
  ) {
    try {
      if (!(tokenIds && Array.isArray(tokenIds))) {
        ErrorService.throwError(
          `invalid input (${tokenIds}), an array of token IDs is expected`,
        );
      }
      let requestUrl;
      if (withSearch) {
        web3Utils.isAddress(withSearch)
          ? (requestUrl = `/tokens?tenantId=${tenantId}&defaultDeployment=${withSearch}`)
          : (requestUrl = `/tokens/search?tenantId=${tenantId}&name=${withSearch}`);
      } else {
        requestUrl = `/tokens?tenantId=${tenantId}&tokenIds=${JSON.stringify(
          tokenIds,
        )}&withAssetData=${withAssetData}`;
      }

      const retriedClosure = () => {
        return this.metadata.get(requestUrl);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving tokens batch from DB',
        response,
        true, // allowZeroLengthData
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveTokensBatchInDB',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Update token]
   * - tokenId: ID of the token to update in DB
   * - updatedParameters: Parameters to update in DB
   */
  async updateTokenInDB(
    tenantId: string,
    tokenId: string,
    updatedParameters: any,
  ) {
    try {
      const retriedClosure = () => {
        return this.metadata.put(
          `/tokens/${tokenId}?tenantId=${tenantId}`,
          updatedParameters,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating token in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateTokenInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Delete token]
   */
  async deleteTokenInDB(tenantId: string, tokenId: string) {
    try {
      const retriedClosure = () => {
        return this.metadata.delete(`/tokens/${tokenId}?tenantId=${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting token in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteTokenInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Retrieve list of all cycles]
   */
  async listAllCycles(tenantId: string) {
    try {
      const retriedClosure = () => {
        return this.metadata.get(`/cycles?tenantId=${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving list of all cycles',
        response,
        true, // allowZeroLengthData
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('listAllCycles', API_NAME, error, 500);
    }
  }

  /**
   * [Create cycle]
   */
  async createCycleInDB(
    tenantId: string,
    assetInstanceId: string,
    assetInstanceClassKey: string,
    startDate: Date,
    endDate: Date,
    valuationDate: Date,
    settlementDate: Date,
    unpaidFlagDate: Date,
    status: CycleStatus,
    type: PrimaryTradeType,
    nav?: number,
    data?: any,
  ) {
    try {
      const cycle = {
        assetInstanceId,
        assetInstanceClassKey,
        startDate,
        endDate,
        valuationDate,
        settlementDate,
        unpaidFlagDate,
        status,
        type,
        nav,
        data,
      };

      const retriedClosure = () => {
        return this.metadata.post(`/cycles?tenantId=${tenantId}`, cycle);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating cycle in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createCycleInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Retrieve cycle]
   *  - keyType: Defines whether the cycle(s) shall be fetched per cycleId, assetId, assetId & assetClassKey, etc.
   *  - cycleKey1: Value of cycleId/assetId/etc.
   *  - shallReturnSingleCycle: Defines whether a single cycle shall be returned (unique cycle)
   *    or whether multiple cycles shall be returned (array of cycles)
   */
  async retrieveCycle(
    tenantId: string,
    keyType: number,
    cycleKey1: string,
    cycleKey2: string,
    cycleKey3: string,
    shallReturnSingleCycle: boolean,
  ) {
    try {
      let params;

      if (keyType === CycleEnum.cycleId) {
        params = {
          tenantId,
          cycleId: cycleKey1,
        };
      } else if (keyType === CycleEnum.assetId) {
        params = {
          tenantId,
          assetId: cycleKey1,
        };
      } else if (keyType === CycleEnum.assetIdAndAssetClassKey) {
        params = {
          tenantId,
          assetId: cycleKey1,
          assetClassKey: cycleKey2,
        };
      } else if (keyType === CycleEnum.assetIdAndAssetClassKeyAndType) {
        params = {
          tenantId,
          assetId: cycleKey1,
          assetClassKey: cycleKey2,
          type: cycleKey3,
        };
      } else {
        throw new Error(`Unknown key type: ${keyType}`);
      }

      let finalOutput;

      const retriedClosure = () =>
        this.metadata.get('/cycles', {
          params,
        });

      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving cycle from DB',
        response,
        true, // allowZeroLengthData
      );

      if (response.data.length !== 0) {
        finalOutput = shallReturnSingleCycle ? response.data[0] : response.data;
      } else {
        if (shallReturnSingleCycle) {
          throw new Error(`cycle ${cycleKey1} ${cycleKey2} does not exist`);
        } else {
          finalOutput = response.data;
        }
      }

      return finalOutput;
    } catch (error) {
      ErrorService.throwApiCallError('retrieveCycle', API_NAME, error, 500);
    }
  }

  /**
   * [Update cycle]
   */
  async updateCycleInDB(tenantId: string, cycleId: string, updates: any) {
    try {
      const retriedClosure = () => {
        return this.metadata.put(
          `/cycles/${cycleId}?tenantId=${tenantId}`,
          updates,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating cycle in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateCycleInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Delete cycle]
   */
  async deleteCycleInDB(tenantId: string, cycleId: string) {
    try {
      const retriedClosure = () => {
        return this.metadata.delete(`/cycles/${cycleId}?tenantId=${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting cycle in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteCycleInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Fetch list of all asset templates]
   */
  async fetchAssetTemplates(
    tenantId: string,
  ): Promise<Array<RawAssetTemplate>> {
    try {
      const retriedClosure = () => {
        return this.metadata.get(`/assetTemplates?tenantId=${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'fetching asset templates in DB',
        response,
        true,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'fetchAssetTemplates',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Fetch list of all asset templates]
   */
  async fetchAssetTemplate(
    tenantId: string,
    assetTemplateId: string,
  ): Promise<RawAssetTemplate> {
    try {
      const retriedClosure = () => {
        return this.metadata.get(
          `/assetTemplates?tenantId=${tenantId}&id=${assetTemplateId}`,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'fetching asset templates in DB',
        response,
      );

      return response.data[0];
    } catch (error) {
      ErrorService.throwApiCallError(
        'fetchAssetTemplate',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Delete asset template by id]
   */
  async deleteAssetTemplate(
    tenantId: string,
    assetTemplateId: string,
  ): Promise<{ message: string }> {
    try {
      const retriedClosure = () => {
        return this.metadata.delete(
          `/assetTemplates/${assetTemplateId}?tenantId=${tenantId}`,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting asset template by id in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'deleteAssetTemplate',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Fetch asset data]
   */
  async fetchAssetData(
    tenantId: string,
    issuerId: string,
    templateId: string,
    tokenId: string,
  ) {
    try {
      const retriedClosure = () => {
        return this.metadata.get(`/assetInstances/data?tenantId=${tenantId}`, {
          params: {
            issuerId,
            templateId,
            tokenId,
          },
        });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'fetching asset data in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('fetchAssetData', API_NAME, error, 500);
    }
  }

  /**
   * [Check asset data validity]
   */
  async checkAssetDataValidity(
    tenantId: string,
    templateId: string,
    elementInstances: Array<any>,
  ): Promise<[boolean, string]> {
    try {
      const retriedClosure = () => {
        return this.metadata.post(
          `/assetInstances/validity/check?tenantId=${tenantId}`,
          {
            templateId,
            elementInstances,
          },
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'checking asset data validity',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'checkAssetDataValidity',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Check asset data completion]
   */
  async checkAssetDataCompletion(
    tenantId: string,
    issuerId: string,
    templateId: string,
    tokenId: string,
  ): Promise<[boolean, string]> {
    try {
      const retriedClosure = () => {
        return this.metadata.get(
          `/assetInstances/completion/check?tenantId=${tenantId}`,
          {
            params: {
              issuerId,
              templateId,
              tokenId,
            },
          },
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'checking asset data completion',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'checkAssetDataCompletion',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Fetch asset data batch]
   */
  async fetchAssetDataBatch(
    tenantId: string,
    issuerIds: Array<string>,
    templateIds: Array<string>,
    tokensIds: Array<string>,
  ) {
    try {
      if (!(issuerIds && Array.isArray(issuerIds))) {
        ErrorService.throwError(
          `invalid input (${issuerIds}), an array of issuer IDs is expected`,
        );
      }
      if (!(templateIds && Array.isArray(templateIds))) {
        ErrorService.throwError(
          `invalid input (${templateIds}), an array of template IDs is expected`,
        );
      }
      if (!(tokensIds && Array.isArray(tokensIds))) {
        ErrorService.throwError(
          `invalid input (${tokensIds}), an array of entity IDs is expected`,
        );
      }

      const retriedClosure = () => {
        return this.metadata.get(`/assetInstances/data?tenantId=${tenantId}`, {
          params: {
            issuerIds: JSON.stringify(issuerIds),
            templateIds: JSON.stringify(templateIds),
            tokenIds: JSON.stringify(tokensIds),
          },
        });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'fetching asset data batch in DB',
        response,
        true, // allowZeroLengthData
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'fetchAssetDataBatch',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Fetch assetCreation]
   */
  async saveAssetData(
    tenantId: string,
    issuerId: string,
    templateId: string,
    tokenId: string,
    elementInstances: Array<any>,
    data: object,
  ): Promise<{
    id: string;
    tenantId: string;
    tokenId: string;
    templateId: string;
    issuerId: string;
    elementInstances: Array<AssetElementInstance>;
  }> {
    try {
      const retriedClosure = () => {
        return this.metadata.post(`/assetInstances?tenantId=${tenantId}`, {
          issuerId,
          templateId,
          tokenId,
          elementInstances,
          data,
        });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'saving asset data in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('saveAssetData', API_NAME, error, 500);
    }
  }

  /**
   * [Retrieve list of all projects]
   */
  async listAllProjects(tenantId: string): Promise<Array<Project>> {
    try {
      const retriedClosure = () => {
        return this.metadata.get(`/projects?tenantId=${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving list of all projects',
        response,
        true, // allowZeroLengthData
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('listAllProjects', API_NAME, error, 500);
    }
  }

  /**
   * [Create project]
   */
  async createProjectInDB(
    tenantId: string,
    key: string,
    name: string,
    description: string,
    picture: Array<string>,
    bankAccount: any,
    kycTemplateId: string,
    data: any,
  ): Promise<Project> {
    try {
      const body = {
        [ProjectKeys.KEY]: key,
        [ProjectKeys.NAME]: name,
        [ProjectKeys.DESCRIPTION]: description,
        [ProjectKeys.PICTURE]: picture,
        [ProjectKeys.BANK_ACCOUNT]: bankAccount,
        [ProjectKeys.KYC_TEMPLATE_ID]: kycTemplateId,
        [ProjectKeys.DATA]: data,
      };

      const retriedClosure = () => {
        return this.metadata.post(`/projects?tenantId=${tenantId}`, body);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating project in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createProjectInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Retrieve project]

   *  - keyType: Defines whether the project(s) shall be fetched per
   *    id/tenantId/name/etc.
   *  - projectKey: Value of id/tenantId/name/etc.
   *  - shallReturnSingleProject: Defines whether a single project shall be
   *    returned (unique project) or whether multiple projects shall be returned
   *    (array of projects)
   */
  async retrieveProject(
    tenantId: string,
    keyType: number,
    projectKey: string,
    shallReturnSingleProject: boolean,
  ) {
    try {
      let requestUrl;

      if (keyType === ProjectEnum.tenantId) {
        requestUrl = `/projects?tenantId=${tenantId}`;
      } else if (keyType === ProjectEnum.projectId) {
        requestUrl = `/projects?tenantId=${tenantId}&projectId=${projectKey}`;
      } else if (keyType === ProjectEnum.key) {
        requestUrl = `/projects?tenantId=${tenantId}&key=${projectKey}`;
      } else if (keyType === ProjectEnum.name) {
        requestUrl = `/projects?tenantId=${tenantId}&name=${projectKey}`;
      } else {
        throw new Error(`Unknown key type: ${keyType}`);
      }

      const retriedClosure = () => {
        return this.metadata.get(requestUrl);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving project from DB',
        response,
        true, // allowZeroLengthData
      );

      let finalOutput;

      if (response.data.length !== 0) {
        finalOutput = shallReturnSingleProject
          ? response.data[0]
          : response.data;
      } else {
        if (shallReturnSingleProject) {
          throw new Error('project does not exist');
        } else {
          finalOutput = response.data;
        }
      }

      return finalOutput;
    } catch (error) {
      ErrorService.throwApiCallError('retrieveProject', API_NAME, error, 500);
    }
  }

  /**
   * [Update project]

   *  - projectId: ID of the project to update in DB
   *  - updatedParameters: Parameters to update in DB
   */
  async updateProjectInDB(
    tenantId: string,
    projectId: string,
    updatedParameters: any,
  ) {
    try {
      const retriedClosure = () => {
        return this.metadata.put(
          `/projects/${projectId}?tenantId=${tenantId}`,
          updatedParameters,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating project in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateProjectInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Delete project]
   */
  async deleteProjectInDB(tenantId: string, projectId: string) {
    try {
      const retriedClosure = () => {
        return this.metadata.delete(
          `/projects/${projectId}?tenantId=${tenantId}`,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting project in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteProjectInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Create config]
   *  - userId: ID of user that is creating custom config
   */
  async createConfigInDB(
    tenantId: string,
    name: string,
    logo: string,
    mailLogo: string,
    mailColor: string,
    mainColor: string,
    mainColorLight: string,
    mainColorLighter: string,
    mainColorDark: string,
    mainColorDarker: string,
    data: any,
    userId: string,
    preferences: any,
    language: string,
    region: string,
    restrictedUserTypes: UserType[],
    restrictedAssetTypes: AssetType[],
  ): Promise<Config> {
    try {
      const body = {
        [ConfigKeys.NAME]: name,
        [ConfigKeys.LOGO]: logo,
        [ConfigKeys.MAIL_LOGO]: mailLogo,
        [ConfigKeys.MAIL_COLOR]: mailColor,
        [ConfigKeys.MAIN_COLOR]: mainColor,
        [ConfigKeys.MAIN_COLOR_LIGHT]: mainColorLight,
        [ConfigKeys.MAIN_COLOR_LIGHTER]: mainColorLighter,
        [ConfigKeys.MAIN_COLOR_DARK]: mainColorDark,
        [ConfigKeys.MAIN_COLOR_DARKER]: mainColorDarker,
        [ConfigKeys.DATA]: data,
        [ConfigKeys.LANGUAGE]: language,
        [ConfigKeys.REGION]: region,
        [ConfigKeys.PREFERENCES]: preferences || {},
        [ConfigKeys.USER_ID]: userId,
        [ConfigKeys.RESTRICTED_USER_TYPES]: restrictedUserTypes,
        [ConfigKeys.RESTRICTED_ASSET_TYPES]: restrictedAssetTypes,
      };

      const retriedClosure = () => {
        return this.metadata.post(
          `/configs?tenantId=${tenantId}&userId=${userId}`,
          body,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating config in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createConfigInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Fetch usecases]
   */
  fetchUsecases = async (
    tenantId: string,
    usecase?: string,
  ): Promise<Array<Config>> => {
    try {
      const retriedUsecaseClosure = () => {
        if (usecase) {
          return this.metadata.get(
            `/usecases?tenantId=${tenantId}&usecase=${usecase}`,
          );
        } else {
          return this.metadata.get(`/usecases?tenantId=${tenantId}`);
        }
      };

      const usecases = await execRetry(retriedUsecaseClosure, 3, 1500, 1);

      return usecases.data;
    } catch (error) {
      ErrorService.throwApiCallError('fetchUsecases', API_NAME, error, 500);
    }
  };

  /**
   * [Create usecases]
   */
  createUsecases = async (
    tenantId: string,
    name: string,
    config: any,
    keys: any,
  ): Promise<Array<Config>> => {
    try {
      const retriedUsecaseClosure = () => {
        return this.metadata.post(`/usecases?tenantId=${tenantId}`, {
          name,
          config,
          keys,
        });
      };

      const usecases = await execRetry(retriedUsecaseClosure, 3, 1500, 1);

      return usecases.data;
    } catch (error) {
      ErrorService.throwApiCallError('createUsecase', API_NAME, error, 500);
    }
  };

  /**
   * [Delete usecases]
   */
  deleteUsecases = async (
    tenantId: string,
    usecase: string,
  ): Promise<Array<Config>> => {
    try {
      const retriedUsecaseClosure = () => {
        return this.metadata.delete(
          `/usecases?tenantId=${tenantId}&usecase=${usecase}`,
        );
      };

      const usecases = await execRetry(retriedUsecaseClosure, 3, 1500, 1);

      return usecases.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteUsecase', API_NAME, error, 500);
    }
  };

  /**
   * [Delete usecases]
   */
  updateUsecases = async (
    tenantId: string,
    name: string,
    config: any,
    keys: any,
  ): Promise<Array<Config>> => {
    try {
      const retriedUsecaseClosure = () => {
        return this.metadata.put(`/usecases?tenantId=${tenantId}`, {
          name,
          config,
          keys,
        });
      };

      const usecases = await execRetry(retriedUsecaseClosure, 3, 1500, 1);

      return usecases.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateUsecase', API_NAME, error, 500);
    }
  };

  /**
   * [Fetch config]
   */
  fetchConfig = async (
    tenantId: string,
    userId: string, // If userId is undefined, API will fetch tenant config
  ): Promise<Array<Config>> => {
    try {
      const retriedTenantClosure = () => {
        return this.metadata.get(
          `/configs?tenantId=${tenantId}&userId=${userId ?? TENANT_FLAG}`,
        );
      };
      const tenant = await execRetry(retriedTenantClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'fetching config in DB',
        tenant,
        true,
      );
      return tenant.data;
    } catch (error) {
      ErrorService.throwApiCallError('fetchConfig', API_NAME, error, 500);
    }
  };

  /**
   * [Update config]
   */
  async updateConfigInDB(
    tenantId: string,
    name: string,
    logo: string,
    mailLogo: string,
    mailColor: string,
    mainColor: string,
    mainColorLight: string,
    mainColorLighter: string,
    mainColorDark: string,
    mainColorDarker: string,
    data: any,
    userId: string,
    preferences: any,
    language: string,
    region: string,
    restrictedUserTypes: UserType[],
    restricedAssetTypes: AssetType[],
  ): Promise<Config> {
    try {
      const body = {
        [ConfigKeys.NAME]: name,
        [ConfigKeys.LOGO]: logo,
        [ConfigKeys.MAIL_LOGO]: mailLogo,
        [ConfigKeys.MAIL_COLOR]: mailColor,
        [ConfigKeys.MAIN_COLOR]: mainColor,
        [ConfigKeys.MAIN_COLOR_LIGHT]: mainColorLight,
        [ConfigKeys.MAIN_COLOR_LIGHTER]: mainColorLighter,
        [ConfigKeys.MAIN_COLOR_DARK]: mainColorDark,
        [ConfigKeys.MAIN_COLOR_DARKER]: mainColorDarker,
        [ConfigKeys.DATA]: data,
        [ConfigKeys.LANGUAGE]: language,
        [ConfigKeys.REGION]: region,
        [ConfigKeys.PREFERENCES]: preferences,
        [ConfigKeys.USER_ID]: userId,
        [ConfigKeys.RESTRICTED_USER_TYPES]: restrictedUserTypes,
        [ConfigKeys.RESTRICTED_ASSET_TYPES]: restricedAssetTypes,
      };

      const retriedClosure = () => {
        return this.metadata.put(
          `/configs?tenantId=${tenantId}&userId=${userId}`,
          body,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating config in DB',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateConfigInDB', API_NAME, error, 500);
    }
  }

  /**
   * [Add metadata to workflow instance]
   */
  addMetadataToWorkflowInstance(
    workflowInstance: WorkflowInstance,
    user: User,
    recipient: User,
    issuer: User,
    token: Token,
    assetData: any,
  ): WorkflowInstance {
    try {
      const metadata: WorkflowInstanceMetadata = {};
      if (user) {
        metadata[WorkflowInstanceKeys.METADATA_USER] = {
          [WorkflowInstanceKeys.METADATA_USER_ID]: user[UserKeys.USER_ID],
          [WorkflowInstanceKeys.METADATA_USER_FIRST_NAME]:
            user[UserKeys.FIRST_NAME],
          [WorkflowInstanceKeys.METADATA_USER_LAST_NAME]:
            user[UserKeys.LAST_NAME],
          [WorkflowInstanceKeys.METADATA_USER_ENTITY_NAME]:
            user[UserKeys.DATA]?.[UserKeys.DATA__CLIENT_NAME],
          [WorkflowInstanceKeys.METADATA_USER_USER_TYPE]:
            user[UserKeys.USER_TYPE],
          [WorkflowInstanceKeys.METADATA_USER_DEFAULT_WALLET]:
            user[UserKeys.DEFAULT_WALLET],
          [WorkflowInstanceKeys.METADATA_USER_WALLETS]: user[UserKeys.WALLETS],
        };
      }

      if (recipient) {
        metadata[WorkflowInstanceKeys.METADATA_RECIPIENT] = {
          [WorkflowInstanceKeys.METADATA_RECIPIENT_ID]:
            recipient[UserKeys.USER_ID],
          [WorkflowInstanceKeys.METADATA_RECIPIENT_FIRST_NAME]:
            recipient[UserKeys.FIRST_NAME],
          [WorkflowInstanceKeys.METADATA_RECIPIENT_LAST_NAME]:
            recipient[UserKeys.LAST_NAME],
          [WorkflowInstanceKeys.METADATA_RECIPIENT_ENTITY_NAME]:
            recipient[UserKeys.DATA]?.[UserKeys.DATA__CLIENT_NAME],
          [WorkflowInstanceKeys.METADATA_RECIPIENT_USER_TYPE]:
            recipient[UserKeys.USER_TYPE],
          [WorkflowInstanceKeys.METADATA_USER_DEFAULT_WALLET]:
            recipient[UserKeys.DEFAULT_WALLET],
          [WorkflowInstanceKeys.METADATA_USER_WALLETS]:
            recipient[UserKeys.WALLETS],
        };
      }

      if (issuer) {
        metadata[WorkflowInstanceKeys.METADATA_ISSUER] = {
          [WorkflowInstanceKeys.METADATA_ISSUER_ID]: issuer[UserKeys.USER_ID],
          [WorkflowInstanceKeys.METADATA_ISSUER_FIRST_NAME]:
            issuer[UserKeys.FIRST_NAME],
          [WorkflowInstanceKeys.METADATA_ISSUER_LAST_NAME]:
            issuer[UserKeys.LAST_NAME],
          [WorkflowInstanceKeys.METADATA_ISSUER_ENTITY_NAME]:
            issuer[UserKeys.DATA]?.[UserKeys.DATA__CLIENT_NAME],
          [WorkflowInstanceKeys.METADATA_ISSUER_COMPANY]:
            issuer[UserKeys.DATA][UserKeys.COMPANY],
          [WorkflowInstanceKeys.METADATA_ISSUER_DEFAULT_WALLET]:
            issuer[UserKeys.DEFAULT_WALLET],
          [WorkflowInstanceKeys.METADATA_ISSUER_WALLETS]:
            issuer[UserKeys.WALLETS],
        };
      }

      if (token) {
        let assetType: AssetType;
        if (token?.[TokenKeys.ASSET_DATA]?.[AssetDataKeys.TYPE]) {
          assetType = token[TokenKeys.ASSET_DATA][AssetDataKeys.TYPE];
        }

        const assetCurrency = retrieveTokenCurrency(
          token,
          workflowInstance[WorkflowInstanceKeys.ASSET_CLASS],
        );

        const automateRetirement =
          token?.[TokenKeys.DATA]?.[TokenKeys.DATA__AUTOMATE_RETIREMENT] ??
          false;
        const automateHoldCreation =
          token?.[TokenKeys.DATA]?.[TokenKeys.DATA__AUTOMATE_HOLD_CREATION] ??
          false;
        const automateSettlement =
          token?.[TokenKeys.DATA]?.[TokenKeys.DATA__AUTOMATE_SETTLEMENT] ??
          false;

        metadata[WorkflowInstanceKeys.METADATA_TOKEN] = {
          [WorkflowInstanceKeys.METADATA_TOKEN_ID]: token[TokenKeys.TOKEN_ID],
          [WorkflowInstanceKeys.METADATA_TOKEN_NAME]: token[TokenKeys.NAME],
          [WorkflowInstanceKeys.METADATA_TOKEN_SYMBOL]: token[TokenKeys.SYMBOL],
          [WorkflowInstanceKeys.METADATA_TOKEN_CURRENCY]: assetCurrency,
          [WorkflowInstanceKeys.METADATA_TOKEN_AUTOMATE_RETIREMENT]:
            automateRetirement,
          [WorkflowInstanceKeys.METADATA_TOKEN_AUTOMATE_HOLD_CREATION]:
            automateHoldCreation,
          [WorkflowInstanceKeys.METADATA_TOKEN_AUTOMATE_SETTLEMENT]:
            automateSettlement,
          [WorkflowInstanceKeys.METADATA_ASSET_TYPE]: assetType,
          [WorkflowInstanceKeys.METADATA_ASSET_TEMPLATE_ID]:
            token[TokenKeys.ASSET_TEMPLATE_ID],
        };
      }

      if (assetData) {
        metadata[WorkflowInstanceKeys.METADATA_ASSET_DATA] = assetData;
      }

      return {
        ...workflowInstance,
        [WorkflowInstanceKeys.METADATA]: metadata,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding metadata to workflow instance',
        'addMetadataToWorkflowInstance',
        false,
        500,
      );
    }
  }

  /**
   * [Add metadata to workflow instances]
   */
  async addMetadataToWorkflowInstances(
    tenantId: string,
    workflowInstances: Array<WorkflowInstance>,
    withAssetData: boolean,
  ): Promise<Array<WorkflowInstance>> {
    try {
      const userIds: Array<string> = [];
      const tokenIds: Array<string> = [];
      workflowInstances.map((workflowInstance: WorkflowInstance) => {
        const userId: string = workflowInstance[WorkflowInstanceKeys.USER_ID];
        if (userId && userIds.indexOf(userId) < 1) {
          userIds.push(userId);
        }

        const recipientId: string =
          workflowInstance[WorkflowInstanceKeys.RECIPIENT_ID];
        if (recipientId && userIds.indexOf(recipientId) < 0) {
          userIds.push(recipientId);
        }

        const entityId: string =
          workflowInstance[WorkflowInstanceKeys.ENTITY_ID];
        const entityType: EntityType =
          workflowInstance[WorkflowInstanceKeys.ENTITY_TYPE];
        if (
          entityType === EntityType.ISSUER &&
          entityId &&
          userIds.indexOf(entityId) < 0
        ) {
          userIds.push(entityId);
        }

        if (
          entityType === EntityType.TOKEN &&
          entityId &&
          tokenIds.indexOf(entityId) === -1
        ) {
          tokenIds.push(entityId);
        }
      });

      const tokens: Array<Token> = await this.retrieveTokensBatchInDB(
        tenantId,
        tokenIds,
        withAssetData,
      );

      // Arrays required to fetch asset data (when relevant)
      const assetDataBatchIssuerIds: Array<string> = [];
      const assetDataBatchTemplateIds: Array<string> = [];
      const assetDataBatchTokenIds: Array<string> = [];

      const tokensMap: { [key: string]: Token } = {};
      tokens.map((token: Token) => {
        // Create token map
        tokensMap[token[TokenKeys.TOKEN_ID]] = token;

        // In case issuerId is defined, add it to the list of users to fetch in batch
        const issuerId: string = token[TokenKeys.ISSUER_ID];
        if (issuerId && userIds.indexOf(issuerId) < 1) {
          userIds.push(issuerId);
        }

        if (withAssetData && token && token[TokenKeys.ASSET_TEMPLATE_ID]) {
          // In case, asset template id and issuer are defined, asset data shall be fetched
          assetDataBatchIssuerIds.push(issuerId);
          assetDataBatchTemplateIds.push(token[TokenKeys.ASSET_TEMPLATE_ID]);
          assetDataBatchTokenIds.push(token[TokenKeys.TOKEN_ID]);
        }
      });

      const users: Array<User> =
        await this.apiEntityCallService.fetchEntitiesBatch(
          tenantId,
          userIds,
          true, // includeWallets
        );
      const usersMap: { [key: string]: User } = {};
      users.map((user: User) => {
        usersMap[user[UserKeys.USER_ID]] = user;
      });

      const assetDataBatch: Array<any> = withAssetData
        ? await this.fetchAssetDataBatch(
            tenantId,
            assetDataBatchIssuerIds,
            assetDataBatchTemplateIds,
            assetDataBatchTokenIds,
          )
        : [];
      if (assetDataBatchTokenIds.length !== assetDataBatch.length) {
        ErrorService.throwError(
          `Shall never happen: entityIds(${assetDataBatchTokenIds.length}) and assetDataBatch(${assetDataBatch.length}) don't have the same length`,
        );
      }
      const assetDataMap: { [key: string]: any } = {};
      for (let i = 0; i < assetDataBatchTokenIds.length; i++) {
        const entityId = assetDataBatchTokenIds[i];
        const assetData = assetDataBatch[i];
        assetDataMap[entityId] = assetData;
      }

      return workflowInstances.map((workflowInstance: WorkflowInstance) => {
        const userId: string = workflowInstance[WorkflowInstanceKeys.USER_ID];
        const recipientId: string =
          workflowInstance[WorkflowInstanceKeys.RECIPIENT_ID];
        const entityId: string =
          workflowInstance[WorkflowInstanceKeys.ENTITY_ID];
        const entityType: EntityType =
          workflowInstance[WorkflowInstanceKeys.ENTITY_TYPE];
        let issuerId: string;
        let tokenId: string;

        let token: Token;
        if (entityType === EntityType.ISSUER && entityId) {
          issuerId = entityId;
        } else if (entityType === EntityType.TOKEN && entityId) {
          tokenId = entityId;
          token = tokensMap[tokenId];

          issuerId = token ? token[TokenKeys.ISSUER_ID] : undefined; // token can be undefined
        }

        return this.addMetadataToWorkflowInstance(
          workflowInstance,
          usersMap[userId], // user
          usersMap[recipientId], // recipient
          usersMap[issuerId], // issuer
          token,
          assetDataMap[tokenId],
        );
      });
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding metadata to workflow instances',
        'addMetadataToWorkflowInstances',
        false,
        500,
      );
    }
  }

  /**
   * [Build mail body]

   *  - key: key of the mail in metadata db
   *  - elements: mail variables pre filled
   */
  buildMailBody = async ({
    tenantId,
    key,
    elements,
  }: {
    tenantId: string;
    key: string;
    elements: Record<string, string>;
  }): Promise<any> => {
    try {
      const retriedTenantClosure = () => {
        return this.metadata.post('/mails/build', {
          tenantId,
          key,
          elements,
        });
      };
      const response = await execRetry(retriedTenantClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'building mail body',
        response,
        true,
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('buildMailBody', API_NAME, error, 500);
    }
  };

  /**
   * [Fetch Mail Templates]
   */
  async fetchMailTemplates(tenantId: string, key: string) {
    try {
      const retriedClosure = () =>
        this.metadata.get('/mails', {
          params: { tenantId, key },
        });
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'find mail templates',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('fetchMailTemplates', API_NAME, error);
    }
  }

  /**
   * [Upsert Mail Templates]
   */
  async upsertTemplates(items: any[]) {
    try {
      const retriedClosure = () =>
        this.metadata.post('/mails/bulk', {
          items,
        });
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'upsert mail templates',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('upsertTemplates', API_NAME, error);
    }
  }
}

@Injectable()
export class ApiMetadataUtilsService {
  constructor(
    private readonly apiCallHelperService: ApiCallHelperService,
    private readonly logger: NestJSPinoLogger,
  ) {
    logger.setContext(ApiMetadataCallService.name);
    this.metadataApi = axios.create({ baseURL: METADATA_HOST });
  }

  private metadataApi: AxiosInstance;

  /**
   * [Delete Tenant data]
   */
  async deleteTenant(
    tenantId: string,
    doNotDeleteTenantConfigs?: boolean,
    doNotDeleteTenantUsers?: boolean,
    doNotDeleteTenantAssetTemplates?: boolean,
    doNotDeleteTenantAssetElements?: boolean,
  ): Promise<MetadataApiTenantDeletionResponse> {
    try {
      let url = `/utils/tenant/${tenantId}`;
      let queryParms = '';

      if (doNotDeleteTenantConfigs) {
        queryParms = `doNotDeleteTenantConfigs=${doNotDeleteTenantConfigs}`;
      }

      if (doNotDeleteTenantUsers) {
        queryParms = queryParms
          ? `${queryParms}&doNotDeleteTenantUsers=${doNotDeleteTenantUsers}`
          : `doNotDeleteTenantUsers=${doNotDeleteTenantUsers}`;
      }

      if (doNotDeleteTenantAssetTemplates) {
        queryParms = queryParms
          ? `${queryParms}&doNotDeleteTenantAssetTemplates=${doNotDeleteTenantAssetTemplates}`
          : `doNotDeleteTenantAssetTemplates=${doNotDeleteTenantAssetTemplates}`;
      }

      if (doNotDeleteTenantAssetElements) {
        queryParms = queryParms
          ? `${queryParms}&doNotDeleteTenantAssetElements=${doNotDeleteTenantAssetElements}`
          : `doNotDeleteTenantAssetElements=${doNotDeleteTenantAssetElements}`;
      }

      if (queryParms) {
        url = `${url}?${queryParms}`;
      }

      const retriedClosure = () => {
        return this.metadataApi.delete(url);
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting tenant related data',
        response,
      );

      this.logger.info(
        `Tenant data deleted for Metadata API: ${JSON.stringify(
          response.data,
        )}`,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteTenant', API_NAME, error, 500);
    }
  }
}
