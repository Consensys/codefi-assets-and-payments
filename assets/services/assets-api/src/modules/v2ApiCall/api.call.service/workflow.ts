import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';
import { ApiCallHelperService } from '.';
import {
  WorkflowInstanceEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';
import { generateSimpleCode } from 'src/utils/codeGenerator';
import {
  keys as WorkflowInstanceKeys,
  OrderSide,
  WorkflowInstance,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import {
  WorkflowTemplate,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import axios, { AxiosResponse, AxiosInstance } from 'axios';
import { UserType } from 'src/types/user';
import { TransitionInstance } from 'src/types/workflow/transition';
import execRetry from 'src/utils/retry';
import { FunctionName } from 'src/types/smartContract';
import { EntityType } from 'src/types/entity';
import {
  Field,
  FindAllOptions,
  LIMIT,
  Paginate,
  SortCriteria,
  V2QueryOption,
} from 'src/modules/v2ApiCall/api.call.service/query';
import {
  DELAY,
  FACTOR,
  MAX_RETRY,
} from 'src/modules/v2ApiCall/api.call.service/constants';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { WorkflowApiTenantDeletionResponse } from 'src/modules/v2ApiCall/DTO/workflow-api-tenant-deletion-response.dto';

const API_NAME = 'Workflow-API';
const workflowHost = process.env.WORKFLOW_API;

export const craftWorkflowInstance = (
  idempotencyKey: string,
  type: WorkflowType,
  functionName: string,
  userType: string,
  userId: string,
  entityId: string,
  entityType: EntityType,
  assetClass: string,
  objectId: string,
  paymentId: string,
  recipientId: string,
  brokerId: string,
  agentId: string,
  workflowTemplateId: number,
  quantity: number,
  price: number,
  documentId: string,
  walletAddress: string,
  date: Date,
  state: string,
  offerId,
  orderSide: OrderSide,
  data: object,
): WorkflowInstance => {
  try {
    let _entityType: EntityType;

    if (entityType) {
      if (
        entityType !== EntityType.TOKEN &&
        entityType !== EntityType.ASSET_CLASS &&
        entityType !== EntityType.PROJECT &&
        entityType !== EntityType.ISSUER &&
        entityType !== EntityType.ADMIN &&
        entityType !== EntityType.PLATFORM
      ) {
        ErrorService.throwError(
          `invalid entityType (${entityType}) for link: needs to be chosen amongst ${EntityType.TOKEN}, ${EntityType.ASSET_CLASS}, ${EntityType.ISSUER}, ${EntityType.ADMIN} or ${EntityType.PLATFORM}`,
        );
      }
      _entityType = entityType;
    }

    // cleanup data by removing keys with null values
    const _data: object = {
      ...data,
    };
    Object.keys(_data).forEach((key) => {
      if (_data[key] === null) {
        delete _data[key];
      }
    });

    const craftedWorkflowInstance: WorkflowInstance = {
      [WorkflowInstanceKeys.IDEMPOTENCY_KEY]: idempotencyKey,
      [WorkflowInstanceKeys.TYPE]: type, //type, FIXME: SHALL BE REPLACED BY TYPE ONCE WORKFLOW-API IS READY xxx
      [WorkflowInstanceKeys.NAME]: functionName,
      [WorkflowInstanceKeys.ROLE]: userType,
      [WorkflowInstanceKeys.BROKER_ID]: brokerId ? brokerId : null,
      [WorkflowInstanceKeys.AGENT_ID]: agentId ? agentId : null,
      [WorkflowInstanceKeys.TENANT_ID]: null,
      [WorkflowInstanceKeys.STATE]: state,
      [WorkflowInstanceKeys.WORKFLOW_TEMPLATE_ID]: workflowTemplateId,
      [WorkflowInstanceKeys.TRANSITION_TEMPLATES]: [],
      [WorkflowInstanceKeys.USER_ID]: userId,
      [WorkflowInstanceKeys.RECIPIENT_ID]: recipientId,
      [WorkflowInstanceKeys.ENTITY_ID]: entityId,
      [WorkflowInstanceKeys.ENTITY_TYPE]: _entityType,
      [WorkflowInstanceKeys.ASSET_CLASS]: assetClass,
      [WorkflowInstanceKeys.QUANTITY]: quantity,
      [WorkflowInstanceKeys.PRICE]: price,
      [WorkflowInstanceKeys.OBJECT_ID]: objectId,
      [WorkflowInstanceKeys.PAYMENT_ID]: paymentId || generateSimpleCode(),
      [WorkflowInstanceKeys.DOCUMENT_ID]: documentId,
      [WorkflowInstanceKeys.WALLET]: walletAddress,
      [WorkflowInstanceKeys.DATE]: date,
      [WorkflowInstanceKeys.OFFER_ID]: offerId,
      [WorkflowInstanceKeys.ORDER_SIDE]: orderSide,
      [WorkflowInstanceKeys.DATA]: {
        ..._data,
        [WorkflowInstanceKeys.DATA__WALLET_USED]:
          _data[WorkflowInstanceKeys.DATA__WALLET_USED],
        [WorkflowInstanceKeys.DATA__NEXT_STATUS]:
          _data[WorkflowInstanceKeys.DATA__NEXT_STATUS],
        [WorkflowInstanceKeys.DATA__TRANSACTION]:
          _data[WorkflowInstanceKeys.DATA__TRANSACTION],
      },
    };

    return craftedWorkflowInstance;
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'crafting workflow instance',
      'craftWorkflowInstance',
      false,
      500,
    );
  }
};

@Injectable()
export class ApiWorkflowWorkflowTemplateService {
  constructor(
    private readonly apiCallHelperService: ApiCallHelperService,
    private readonly logger: NestJSPinoLogger,
  ) {
    this.logger.setContext(ApiWorkflowWorkflowTemplateService.name);
    this.workflowApi = axios.create({
      baseURL: workflowHost,
    });
  }

  private workflowApi: AxiosInstance;

  async listAllWorkflowTemplates(
    tenantId: string,
  ): Promise<Array<WorkflowTemplate>> {
    try {
      const retriedClosure = () => {
        return this.workflowApi.get(`/workflow/templates?tenantId=${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'fetching a workflow template',
        response,
        true, // allowZeroLengthData
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'listAllWorkflowTemplates',
        API_NAME,
        error,
        500,
      );
    }
  }

  async retrieveWorkflowTemplate(
    tenantId: string,
    keyType: number,
    workflowId: number,
    workflowName: WorkflowName,
  ): Promise<WorkflowTemplate> {
    try {
      let requestUrl;

      if (keyType === WorkflowTemplateEnum.id) {
        requestUrl = `/workflow/templates?tenantId=${tenantId}&id=${workflowId}`;
      } else if (keyType === WorkflowTemplateEnum.name) {
        requestUrl = `/workflow/templates?tenantId=${tenantId}&field=name&value=${workflowName}`;
      } else {
        ErrorService.throwError(`Unknown key type: ${keyType}`);
      }

      const retriedClosure = () => {
        return this.workflowApi.get(requestUrl);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving a workflow template',
        response,
      );

      if (response.data.length === 1) {
        return response.data[0];
      } else {
        ErrorService.throwError(
          `We should only retrieve 1 workflow template. Error for name=${workflowName} where length of fetched items is ${response.data.length}.`,
          500,
        );
      }

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveWorkflowTemplate',
        API_NAME,
        error,
        500,
      );
    }
  }

  async getNextStateBatch(
    tenantId: string,
    workflowName: string,
    functionName: string,
    currentStates: Array<string>,
    role: string,
  ): Promise<Array<string>> {
    try {
      const retriedClosure = () => {
        return this.workflowApi.get(
          `/workflow/templates/nextState?tenantId=${tenantId}&workflowName=${workflowName}&transitionName=${functionName}&fromStates=${JSON.stringify(
            currentStates,
          )}&role=${role}`,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);
      this.apiCallHelperService.checkRequestResponseFormat(
        'fetching a batch of next states',
        response,
        true, // allowZeroLengthData
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('getNextStateBatch', API_NAME, error, 500);
    }
  }

  async getNextState(
    tenantId: string,
    workflowName: string,
    functionName: string,
    currentState: string,
    role: string,
  ): Promise<string> {
    try {
      const retriedClosure = () => {
        return this.workflowApi.get(
          `/workflow/templates/nextState?tenantId=${tenantId}&workflowName=${workflowName}&transitionName=${functionName}&fromState=${currentState}&role=${role}`,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);
      this.apiCallHelperService.checkRequestResponseFormat(
        'fetching a next state',
        response,
        true, // allowZeroLengthData
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('getNextState', API_NAME, error, 500);
    }
  }
}

@Injectable()
export class ApiWorkflowWorkflowInstanceService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiCallHelperService: ApiCallHelperService,
  ) {
    logger.setContext(ApiWorkflowWorkflowInstanceService.name);
    this.workflowApi = axios.create({
      baseURL: workflowHost,
    });
  }

  private workflowApi: AxiosInstance;

  async createWorkflowInstance(
    tenantId: string,
    idempotencyKey: string,
    type: WorkflowType,
    functionName: FunctionName,
    userType: UserType,
    userId: string,
    entityId: string,
    entityType: EntityType,
    objectId: string, // can be a cycleId, assetClassKey, etc.
    recipientId: string,
    brokerId: string,
    agentId: string,
    workflowTemplateId: number,
    quantity: number,
    price: number,
    documentId: string,
    walletAddress: string,
    assetClass: string,
    date: Date,
    state: string,
    offerId: number,
    orderSide: OrderSide, //optional
    data: object,
  ): Promise<WorkflowInstance> {
    try {
      const workflowInstance: WorkflowInstance = craftWorkflowInstance(
        idempotencyKey,
        type,
        functionName,
        userType,
        userId,
        entityId,
        entityType,
        assetClass,
        objectId,
        undefined, // leave 'undefined' to generate a random code
        recipientId,
        brokerId,
        agentId,
        workflowTemplateId,
        quantity,
        price,
        documentId,
        walletAddress,
        date,
        state,
        offerId,
        orderSide, //optional only applicable for 'ORDER' workflowType
        data,
      );

      const workflowInstanceData = workflowInstance[WorkflowInstanceKeys.DATA];
      if (
        !workflowInstanceData[
          WorkflowInstanceKeys.DATA__STATE_UPDATED_TIMESTAMPS
        ]
      ) {
        workflowInstanceData[
          WorkflowInstanceKeys.DATA__STATE_UPDATED_TIMESTAMPS
        ] = {};
      }
      workflowInstanceData[WorkflowInstanceKeys.DATA__STATE_UPDATED_TIMESTAMPS][
        new Date().getTime()
      ] = state;

      const retriedClosure = () => {
        return this.workflowApi.post(
          `/workflow/instances?tenantId=${tenantId}`,
          workflowInstance,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating a workflow instance',
        response,
      );
      return this.formatWorkflowInstance(response.data);
    } catch (error) {
      ErrorService.throwApiCallError(
        'createWorkflowInstance',
        API_NAME,
        error,
        500,
      );
    }
  }

  formatWorkflowInstance(workflowInstance) {
    try {
      workflowInstance[WorkflowInstanceKeys.QUANTITY] = Number(
        workflowInstance[WorkflowInstanceKeys.QUANTITY],
      );
      workflowInstance[WorkflowInstanceKeys.PRICE] = Number(
        workflowInstance[WorkflowInstanceKeys.PRICE],
      );

      if (workflowInstance && workflowInstance.transitionTemplates) {
        workflowInstance.transitionTemplates = undefined;
      }
      return workflowInstance;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'formatting workflow instance',
        'formatWorkflowInstance',
        false,
        500,
      );
    }
  }

  async retrieveWorkflowInstances(
    tenantId: string,
    keyType: number,
    instanceIdOrInstanceIds: any, // can be an instanceId or an array of instanceIds
    idempotencyKey: string,
    userIdOrUserIds: any, // can be a userId or an array of userIds
    entityId: string,
    objectId: string,
    entityType: EntityType,
    workflowType: WorkflowType,
    otherWorkflowType: WorkflowType,
    shallReturnSingleInstance: boolean,
    // FOR V2 WORKFLOW
    filters: Array<Field> = [],
    sorts: Array<SortCriteria> = [],
    queryOption?: V2QueryOption,
  ) {
    try {
      let instanceId: number;
      let instanceIds: string;
      if (keyType === WorkflowInstanceEnum.ids) {
        instanceIds = JSON.stringify(instanceIdOrInstanceIds);
      } else if (keyType === WorkflowInstanceEnum.id) {
        instanceId = instanceIdOrInstanceIds;
      }

      const usingV2 = filters.length > 0;

      let userId: string;
      let userIds: string;
      if (
        keyType === WorkflowInstanceEnum.entityIdAndUserIds ||
        keyType === WorkflowInstanceEnum.entityTypeAndUserIds
      ) {
        userIds = JSON.stringify(userIdOrUserIds);
      } else {
        userId = userIdOrUserIds;
      }

      const commonParams: any = {
        tenantId,
        field1: 'workflowType',
        value1: workflowType,
      };
      if (otherWorkflowType) {
        commonParams.otherValue1 = otherWorkflowType;
      }

      let params: any;
      if (keyType === WorkflowInstanceEnum.id) {
        params = {
          tenantId,
          id: instanceId,
        };
      } else if (keyType === WorkflowInstanceEnum.ids) {
        params = {
          tenantId,
          ids: instanceIds,
        };
      } else if (keyType === WorkflowInstanceEnum.userId) {
        params = {
          ...commonParams,
          field2: 'userId',
          value2: userId,
        };
      } else if (keyType === WorkflowInstanceEnum.entityId) {
        params = {
          ...commonParams,
        };
        if (entityId) {
          params['field2'] = 'entityId';
          params['value2'] = entityId;
        }
      } else if (keyType === WorkflowInstanceEnum.recipientId) {
        params = {
          ...commonParams,
          field2: 'recipientId',
          value2: userId,
        };
      } else if (keyType === WorkflowInstanceEnum.entityIdAndUserId) {
        params = {
          ...commonParams,
          field2: 'userId',
          value2: userId,
        };
        if (entityId) {
          params['field3'] = 'entityId';
          params['value3'] = entityId;
        }
      } else if (keyType === WorkflowInstanceEnum.entityIdAndUserIds) {
        params = {
          ...commonParams,
          field2: 'entityId',
          value2: entityId,
          field3: 'userId',
          multiValue3: userIds,
        };
      } else if (keyType === WorkflowInstanceEnum.entityIdAndRecipientId) {
        params = {
          ...commonParams,
          field2: 'recipientId',
          value2: userId,
        };
        if (entityId) {
          params['field3'] = 'entityId';
          params['value3'] = entityId;
        }
      } else if (keyType === WorkflowInstanceEnum.objectId) {
        params = {
          ...commonParams,
          field2: 'objectId',
          value2: objectId,
        };
      } else if (keyType === WorkflowInstanceEnum.entityType) {
        params = {
          ...commonParams,
          field2: 'entityType',
          value2: entityType,
        };
      } else if (keyType === WorkflowInstanceEnum.entityTypeAndUserId) {
        params = {
          ...commonParams,
          field2: 'entityType',
          value2: entityType,
          field3: 'userId',
          value3: userId,
        };
      } else if (keyType === WorkflowInstanceEnum.entityTypeAndUserIds) {
        params = {
          ...commonParams,
          field2: 'entityType',
          value2: entityType,
          field3: 'userId',
          multiValue3: userIds,
        };
      } else if (keyType === WorkflowInstanceEnum.idempotencyKey) {
        params = {
          ...commonParams,
          field2: 'idempotencyKey',
          value2: idempotencyKey,
        };
      } else if (keyType === WorkflowInstanceEnum.all) {
        params = {
          ...commonParams,
        };
      } else if (keyType === WorkflowInstanceEnum.entityIdAndAgentId) {
        params = {
          ...commonParams,
          field2: 'agentId',
          value2: userId,
        };
        if (entityId) {
          params['field3'] = 'entityId';
          params['value3'] = entityId;
        }
      } else {
        throw new Error(`Unknown key type: ${keyType}`);
      }

      const BATCH_SIZE = 1000;

      let offset = 0; // number of instances to skip
      const limit = BATCH_SIZE; // total number of instances returned
      let instancesList = [];
      let nbRequests = 0;
      let nbInstancesToFetch: number;

      while (nbInstancesToFetch === undefined || nbInstancesToFetch > 0) {
        nbRequests++;

        let retriedClosure;
        if (usingV2) {
          const response = await this.findAll({
            tenantId,
            filters,
            skip: offset,
            limit,
            order: sorts,
            queryOption,
          });

          // Add fetched instances to final response
          instancesList = [...instancesList, ...response.items];

          // Update 'nbInstancesToFetch' and 'offset'
          if (nbInstancesToFetch === undefined) {
            nbInstancesToFetch = response.total;
          }
          nbInstancesToFetch = nbInstancesToFetch - response.items.length;
          offset += response.items.length;
        } else {
          retriedClosure = () => {
            return this.workflowApi.get(
              `/workflow/instances?offset=${offset}&limit=${limit}`,
              { params },
            );
          };
          const response = await execRetry(retriedClosure, 3, 1500, 1);

          this.apiCallHelperService.checkRequestResponseFormat(
            'retrieving workflow instances',
            response,
            true, // allowZeroLengthData
          );

          if (
            !(
              response.data &&
              response.data.length &&
              response.data.length === 2
            )
          ) {
            ErrorService.throwError(
              'invalid response format: workflow-api is supposed to return an array of [instancesList, totalInstancesNumber]',
            );
          }

          // Add fetched instances to final response
          instancesList = [...instancesList, ...response.data[0]];

          // Update 'nbInstancesToFetch' and 'offset'
          if (nbInstancesToFetch === undefined) {
            nbInstancesToFetch = response.data[1];
          }
          nbInstancesToFetch = nbInstancesToFetch - response.data[0]?.length;
          offset += response.data[0]?.length;
        }
      }

      this.logger.debug(
        `Performed ${nbRequests} requests of max ${BATCH_SIZE} instances to retrieve a total of ${instancesList.length} instances`,
      );
      if (nbRequests > 100) {
        ErrorService.throwError(
          `Shall never happen: too many instances to retrieve (more than ${
            BATCH_SIZE * 100
          })`,
        );
      }

      if (instancesList.length !== 0) {
        const result = instancesList.map((workflowInstance) => {
          return this.formatWorkflowInstance(workflowInstance);
        });

        if (shallReturnSingleInstance) {
          return result[0];
        } else {
          return result;
        }
      } else {
        if (shallReturnSingleInstance) {
          throw new Error(
            `workflow instance ${instanceId} (userId ${userId}, entityId ${entityId}, objectId ${objectId}) does not exist`,
          );
        } else {
          return [];
        }
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveWorkflowInstances',
        API_NAME,
        error,
        500,
      );
    }
  }

  async retrieveWorkflowInstanceByIdempotencyKey(
    tenantId: string,
    workflowType: WorkflowType,
    idempotencyKey: string,
  ): Promise<WorkflowInstance> {
    try {
      if (!idempotencyKey) {
        return undefined;
      }

      const workflowInstances: Array<WorkflowInstance> =
        await this.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.idempotencyKey,
          undefined, // instanceId
          idempotencyKey,
          undefined, // userId
          undefined, // enitytId
          undefined, // objectId
          undefined, // entityType
          workflowType,
          undefined, // otherWorkflowType
          false, // shallReturnSingleInstance
        );
      if (workflowInstances.length === 1) {
        return workflowInstances[0];
      } else if (workflowInstances.length > 1) {
        ErrorService.throwError(
          `shall never happen: multiple workflow instances with same idempotency key (${idempotencyKey})`,
        );
      } else {
        return undefined;
      }
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveWorkflowInstanceByIdempotencyKey',
        API_NAME,
        error,
        500,
      );
    }
  }

  async findAll<T>({
    tenantId,
    filters = [],
    skip = 0,
    limit = LIMIT,
    order = [],
    queryOption,
  }: FindAllOptions): Promise<Paginate<T>> {
    try {
      const requestUrl = '/v2/workflow-instances';

      const retriedClosure = async () => {
        const attempt = await this.workflowApi.get(requestUrl, {
          params: {
            tenantId,
            filters,
            skip,
            limit,
            order,
            queryOption,
          },
        });
        return attempt;
      };
      const response = await execRetry(
        retriedClosure,
        MAX_RETRY,
        DELAY,
        FACTOR,
      );

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving workflow instances',
        response,
        true, // allowZeroLengthData
      );

      return {
        // WORKAROUND cast quantity and price to number
        items: response.data.items.map(this.formatWorkflowInstance),
        total: response.data.total,
      };
    } catch (error) {
      ErrorService.throwApiCallError('findAll', API_NAME, error, 500);
    }
  }

  async updateWorkflowInstance(
    tenantId: string,
    workFlowInstanceId: number,
    newFunctionName: FunctionName,
    newUserType: UserType,
    newState: string,
    updates: WorkflowInstance,
  ): Promise<WorkflowInstance> {
    try {
      let stateTransitionTriggered: boolean;
      if (newFunctionName && newUserType && newState) {
        stateTransitionTriggered = true;
      }

      // Useful step to create empty object in case "updates===undefined"
      const _updates: WorkflowInstance = {
        ...updates,
      };

      if (stateTransitionTriggered) {
        const workflowInstanceData = _updates[WorkflowInstanceKeys.DATA];
        if (
          !workflowInstanceData[
            WorkflowInstanceKeys.DATA__STATE_UPDATED_TIMESTAMPS
          ]
        ) {
          workflowInstanceData[
            WorkflowInstanceKeys.DATA__STATE_UPDATED_TIMESTAMPS
          ] = {};
        }
        workflowInstanceData[
          WorkflowInstanceKeys.DATA__STATE_UPDATED_TIMESTAMPS
        ][new Date().getTime()] = newState;
      }

      const updatedWorkflowInstance = craftWorkflowInstance(
        _updates[WorkflowInstanceKeys.IDEMPOTENCY_KEY],
        _updates[WorkflowInstanceKeys.TYPE],
        stateTransitionTriggered
          ? newFunctionName
          : _updates[WorkflowInstanceKeys.NAME],
        stateTransitionTriggered
          ? newUserType
          : _updates[WorkflowInstanceKeys.ROLE],
        _updates[WorkflowInstanceKeys.USER_ID],
        _updates[WorkflowInstanceKeys.ENTITY_ID],
        _updates[WorkflowInstanceKeys.ENTITY_TYPE],
        _updates[WorkflowInstanceKeys.ASSET_CLASS],
        _updates[WorkflowInstanceKeys.OBJECT_ID],
        _updates[WorkflowInstanceKeys.PAYMENT_ID],
        _updates[WorkflowInstanceKeys.RECIPIENT_ID],
        _updates[WorkflowInstanceKeys.BROKER_ID],
        _updates[WorkflowInstanceKeys.AGENT_ID],
        _updates[WorkflowInstanceKeys.WORKFLOW_ID],
        _updates[WorkflowInstanceKeys.QUANTITY],
        _updates[WorkflowInstanceKeys.PRICE],
        _updates[WorkflowInstanceKeys.DOCUMENT_ID],
        _updates[WorkflowInstanceKeys.WALLET],
        _updates[WorkflowInstanceKeys.DATE],
        stateTransitionTriggered
          ? newState
          : _updates[WorkflowInstanceKeys.STATE],
        undefined, //offerId
        undefined, //orderSide
        _updates[WorkflowInstanceKeys.DATA],
      );

      const retriedClosure = () => {
        return this.workflowApi.put(
          `/workflow/instances/${workFlowInstanceId}?tenantId=${tenantId}`,
          updatedWorkflowInstance,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating a workflow instance',
        response,
      );

      return this.formatWorkflowInstance(response.data);
    } catch (error) {
      ErrorService.throwApiCallError(
        'updateWorkflowInstance',
        API_NAME,
        error,
        500,
      );
    }
  }

  async updateWorkflowInstancesBatch(
    tenantId: string,
    newFunctionName: FunctionName,
    newUserType: UserType,
    newState: string,
    updatesArray: Array<WorkflowInstance>,
  ): Promise<Array<WorkflowInstance>> {
    try {
      let stateTransitionTriggered: boolean;
      if (newFunctionName && newUserType && newState) {
        stateTransitionTriggered = true;
      }

      const updatedWorkflowInstances: Array<WorkflowInstance> =
        updatesArray.map((updates: WorkflowInstance) => {
          // Useful step to create empty object in case "updates===undefined"
          const _updates: WorkflowInstance = {
            ...updates,
          };

          if (stateTransitionTriggered) {
            const workflowInstanceData = _updates[WorkflowInstanceKeys.DATA];
            if (
              !workflowInstanceData[
                WorkflowInstanceKeys.DATA__STATE_UPDATED_TIMESTAMPS
              ]
            ) {
              workflowInstanceData[
                WorkflowInstanceKeys.DATA__STATE_UPDATED_TIMESTAMPS
              ] = {};
            }
            workflowInstanceData[
              WorkflowInstanceKeys.DATA__STATE_UPDATED_TIMESTAMPS
            ][new Date().getTime()] = newState;
          }

          return {
            ...craftWorkflowInstance(
              _updates[WorkflowInstanceKeys.IDEMPOTENCY_KEY],
              _updates[WorkflowInstanceKeys.TYPE],
              stateTransitionTriggered
                ? newFunctionName
                : _updates[WorkflowInstanceKeys.NAME],
              stateTransitionTriggered
                ? newUserType
                : _updates[WorkflowInstanceKeys.ROLE],
              _updates[WorkflowInstanceKeys.USER_ID],
              _updates[WorkflowInstanceKeys.ENTITY_ID],
              _updates[WorkflowInstanceKeys.ENTITY_TYPE],
              _updates[WorkflowInstanceKeys.ASSET_CLASS],
              _updates[WorkflowInstanceKeys.OBJECT_ID],
              _updates[WorkflowInstanceKeys.PAYMENT_ID],
              _updates[WorkflowInstanceKeys.RECIPIENT_ID],
              _updates[WorkflowInstanceKeys.BROKER_ID],
              _updates[WorkflowInstanceKeys.AGENT_ID],
              _updates[WorkflowInstanceKeys.WORKFLOW_ID],
              _updates[WorkflowInstanceKeys.QUANTITY],
              _updates[WorkflowInstanceKeys.PRICE],
              _updates[WorkflowInstanceKeys.DOCUMENT_ID],
              _updates[WorkflowInstanceKeys.WALLET],
              _updates[WorkflowInstanceKeys.DATE],
              stateTransitionTriggered
                ? newState
                : _updates[WorkflowInstanceKeys.STATE],
              undefined, //offerId
              undefined, //orderSide
              _updates[WorkflowInstanceKeys.DATA],
            ),
            id: _updates[WorkflowInstanceKeys.ID],
          };
        });

      const retriedClosure = () => {
        return this.workflowApi.put(
          `/v2/workflow-instances?tenantId=${tenantId}`,
          updatedWorkflowInstances,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating a batch of workflow instances',
        response,
      );

      return response.data.map((instance: WorkflowInstance) => {
        return this.formatWorkflowInstance(instance);
      });
    } catch (error) {
      ErrorService.throwApiCallError(
        'updateWorkflowInstancesBatch',
        API_NAME,
        error,
        500,
      );
    }
  }

  async deleteWorkflowInstance(
    tenantId: string,
    instanceId: number,
  ): Promise<AxiosResponse<number>> {
    try {
      const retriedClosure = () => {
        return this.workflowApi.delete(
          `/workflow/instances/${instanceId}?tenantId=${tenantId}`,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting a workflow instance',
        response,
        true,
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'deleteWorkflowInstance',
        API_NAME,
        error,
        500,
      );
    }
  }

  async listAllUserWorkflowInstances(
    tenantId: string,
    userId: string,
    workflowType: WorkflowType,
  ): Promise<WorkflowInstance[]> {
    try {
      const userWorkflowInstances: Array<WorkflowInstance> =
        await this.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.userId,
          undefined,
          undefined, // idempotencyKey
          userId,
          undefined,
          undefined,
          undefined, // entityType
          workflowType,
          undefined, // otherWorkflowType
          false,
        );
      const recipientWorkflowInstances: Array<WorkflowInstance> =
        await this.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.recipientId,
          undefined,
          undefined, // idempotencyKey
          userId,
          undefined,
          undefined,
          undefined, // entityType
          workflowType,
          undefined, // otherWorkflowType
          false,
        );
      return userWorkflowInstances.concat(recipientWorkflowInstances);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'lisiting all workflow instances for a given user',
        'listAllUserWorkflowInstances',
        false,
        500,
      );
    }
  }

  async listAllUserTokenWorkflowInstances(
    tenantId,
    userId: string,
    tokenId: string,
    assetClassKey: string, // [OPTIONAL] Used to filter for a specific asset class
    workflowType: WorkflowType, // [OPTIONAL] Used to filter for a specific worklfow type
    otherWorkflowType: WorkflowType, // [OPTIONAL] Used to filter for a specific worklfow type
  ): Promise<WorkflowInstance[]> {
    try {
      const userWorkflowInstances: Array<WorkflowInstance> =
        await this.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityIdAndUserId,
          undefined,
          undefined, // idempotencyKey
          userId,
          tokenId,
          undefined,
          undefined, // entityType
          workflowType,
          otherWorkflowType,
          false,
        );

      const recipientWorkflowInstances: Array<WorkflowInstance> =
        await this.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityIdAndRecipientId,
          undefined,
          undefined, // idempotencyKey
          userId,
          tokenId,
          undefined,
          undefined, // entityType
          workflowType,
          otherWorkflowType,
          false,
        );

      const filteredUserWorkflowInstances: Array<WorkflowInstance> =
        userWorkflowInstances.filter(
          (userWorkflowInstance: WorkflowInstance) => {
            if (assetClassKey) {
              return (
                userWorkflowInstance[WorkflowInstanceKeys.ASSET_CLASS] ===
                assetClassKey
              );
            } else {
              return true;
            }
          },
        );
      const filteredRecipientWorkflowInstances: Array<WorkflowInstance> =
        recipientWorkflowInstances.filter(
          (recipientWorkflowInstance: WorkflowInstance) => {
            if (assetClassKey) {
              return (
                recipientWorkflowInstance[WorkflowInstanceKeys.ASSET_CLASS] ===
                assetClassKey
              );
            } else {
              return true;
            }
          },
        );
      return filteredUserWorkflowInstances.concat(
        filteredRecipientWorkflowInstances,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'lisiting all workflow instances for a given token',
        'listAllUserTokenWorkflowInstances',
        false,
        500,
      );
    }
  }

  async listAllTokenWorkflowInstances(
    tenantId: string,
    tokenId: string,
    workflowType: WorkflowType,
  ): Promise<WorkflowInstance[]> {
    try {
      const allWorkflows: Array<WorkflowInstance> =
        await this.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityId,
          undefined,
          undefined, // idempotencyKey
          undefined,
          tokenId,
          undefined,
          undefined, // entityType
          workflowType,
          undefined, // otherWorkflowType
          false,
        );

      return allWorkflows;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'lisiting all workflow instances',
        'listAllTokenWorkflowInstances',
        false,
        500,
      );
    }
  }

  async deleteAllUserWorkflowInstances(
    tenantId: string,
    userId: string,
    workflowType: WorkflowType,
  ): Promise<number[]> {
    try {
      const allWorkflowInstances = await this.listAllUserWorkflowInstances(
        tenantId,
        userId,
        workflowType,
      );
      const allWorkflowInstancesIds = allWorkflowInstances.map(
        (workflowInstance) => workflowInstance[WorkflowInstanceKeys.ID],
      );
      if (allWorkflowInstancesIds.length > 0) {
        await Promise.all(
          allWorkflowInstancesIds.map((instanceId) => {
            return this.deleteWorkflowInstance(tenantId, instanceId);
          }),
        );
      }
      return allWorkflowInstancesIds;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting all workflow instances of a user',
        'deleteAllUserWorkflowInstances',
        false,
        500,
      );
    }
  }

  async deleteAllUserEntityWorkflowInstances(
    tenantId: string,
    userId: string,
    tokenId: string,
    workflowType: WorkflowType,
  ): Promise<number[]> {
    try {
      const allWorkflowInstances: Array<WorkflowInstance> =
        await this.listAllUserTokenWorkflowInstances(
          tenantId,
          userId,
          tokenId,
          undefined, // assetClassKey - no filter since we want to delete all workflow instances
          workflowType,
          undefined, // otherWorkflowType
        );
      const allWorkflowInstancesIds = allWorkflowInstances.map(
        (workflowInstance: WorkflowInstance) =>
          workflowInstance[WorkflowInstanceKeys.ID],
      );
      if (allWorkflowInstancesIds.length > 0) {
        await Promise.all(
          allWorkflowInstancesIds.map((instanceId) => {
            return this.deleteWorkflowInstance(tenantId, instanceId);
          }),
        );
      }
      return allWorkflowInstancesIds;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting all workflow instances of a user for a given entity',
        'deleteAllUserEntityWorkflowInstances',
        false,
        500,
      );
    }
  }

  async deleteAllEntityWorkflowInstances(
    tenantId: string,
    tokenId: string,
    workflowType: WorkflowType,
  ): Promise<number[]> {
    try {
      const allWorkflowInstances = await this.listAllTokenWorkflowInstances(
        tenantId,
        tokenId,
        workflowType,
      );

      const allWorkflowInstancesIds = allWorkflowInstances.map(
        (workflowInstance: WorkflowInstance) =>
          workflowInstance[WorkflowInstanceKeys.ID],
      );
      if (allWorkflowInstancesIds.length > 0) {
        await Promise.all(
          allWorkflowInstancesIds.map((instanceId) => {
            return this.deleteWorkflowInstance(tenantId, instanceId);
          }),
        );
      }
      return allWorkflowInstancesIds;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting all workflow instances for a given entity',
        'deleteAllEntityWorkflowInstances',
        false,
        500,
      );
    }
  }

  async listAllTransitionInstances(
    tenantId: string,
    instanceId: number,
  ): Promise<TransitionInstance[]> {
    try {
      const requestUrl = `/workflow/instances/${instanceId}/transitions?tenantId=${tenantId}`;
      const retriedClosure = () => {
        return this.workflowApi.get(requestUrl);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);
      this.apiCallHelperService.checkRequestResponseFormat(
        'listing transitions instances for a given workflow instance',
        response,
        true, // allowZeroLengthData
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'listAllTransitionInstances',
        API_NAME,
        error,
        500,
      );
    }
  }
}

@Injectable()
export class ApiWorkflowUtilsService {
  constructor(
    private readonly apiCallHelperService: ApiCallHelperService,
    private readonly logger: NestJSPinoLogger,
  ) {
    logger.setContext(ApiWorkflowUtilsService.name);
    this.workflowApi = axios.create({
      baseURL: workflowHost,
    });
  }

  private workflowApi: AxiosInstance;

  /**
   * [Delete Tenant data]
   */
  async deleteTenant(
    tenantId: string,
  ): Promise<WorkflowApiTenantDeletionResponse> {
    try {
      const retriedClosure = () => {
        return this.workflowApi.delete(`/utils/tenant/${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting tenant related data',
        response,
      );

      this.logger.info(
        `Tenant data deleted for Workflow API: ${JSON.stringify(
          response.data,
        )}`,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteTenant', API_NAME, error, 500);
    }
  }
}
