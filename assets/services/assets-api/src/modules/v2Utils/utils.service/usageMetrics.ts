import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiAdminCallService } from '../../v2ApiCall/api.call.service/admin';
import { ApiEntityCallService } from '../../v2ApiCall/api.call.service/entity';
import { keys as UserKeys, User } from '../../../types/user';
import { Auth0User } from 'src/types/authentication';

import { TenantService } from './tenant';
import { Transaction } from 'src/types/transaction';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';
import { extractNameFromClientApplicationName } from 'src/types/clientApplication';
import { keys as ClientApplicationKeys } from 'src/types/clientApplication';
import {
  TokenIdentifierEnum,
  WorkflowInstanceEnum,
} from 'src/old/constants/enum';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { NetworkService } from 'src/modules/v2Network/network.service';
import { keys as NetworkKeys, Network } from 'src/types/network';
import { keys as TokenKeys, Token } from 'src/types/token';
import {
  keys as WorkflowInstanceKeys,
  WorkflowInstance,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';

interface IUsageMetrics {
  count: number;
  first: Date;
  latest: Date;
  list?: Array<any>;
}

interface ITenantUsageMetrics {
  tenantId: string;
  name: string;
  entities?: IUsageMetrics;
  users?: IUsageMetrics;
  transactions?: IUsageMetrics;
}

interface ITenantNetworkUsageMetrics {
  tenantId: string;
  name: string;
  tokens?: IUsageMetrics;
  workflowInstances?: IUsageMetrics;
}

@Injectable()
export class UsageMetricsService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly tenantService: TenantService,
    private readonly transactionService: ApiWorkflowTransactionService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly networkService: NetworkService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
  ) {}

  async retrieveUsageMetrics(
    fetchAuth0Users: boolean,
    fetchTransactions: boolean,
    singleTenantIdToRetrieve?: string,
  ) {
    this.logger.info('RETRIEVE USAGE METRICS');

    const { tenantIds, clientApplicationsObject } =
      await this.tenantService.listAllTenantIdsAndClientApplicationsInAuth0();

    const stackUsageMetrics: Array<ITenantUsageMetrics> = [];

    // For each tenant, check if it has changed or not
    for (const tenantId of tenantIds) {
      if (singleTenantIdToRetrieve && tenantId !== singleTenantIdToRetrieve) {
        continue;
      }

      this.logger.info(`RETRIEVE USAGE METRICS: tenantId ${tenantId}`);

      const tenantUsageMetric: ITenantUsageMetrics = {
        tenantId,
        name: extractNameFromClientApplicationName(
          clientApplicationsObject[tenantId]?.[ClientApplicationKeys.NAME],
        ),
      };

      // List of entity-api entities
      const entities = await this.apiEntityCallService.fetchEntities(
        tenantId,
        {},
        true, // includeWallets
        false, // crossNamespaceMigration
      );

      // Sort entities [newest entity, ..., oldest entity]
      const sortedEntities: Array<User> = entities.sort((a: User, b: User) => {
        const timestampA: number = new Date(a?.createdAt).getTime();
        const timestampB: number = new Date(b?.createdAt).getTime();
        return timestampB - timestampA;
      });

      if (sortedEntities.length > 0) {
        const firstEntity: User = sortedEntities[sortedEntities.length - 1];
        const latestEntity: User = sortedEntities[0];
        tenantUsageMetric.entities = {
          count: sortedEntities?.length,
          first: new Date(firstEntity?.createdAt),
          latest: new Date(latestEntity?.createdAt),
        };
      }

      // Users without 'user.data.subTenantId' flags
      const entitiesWithAuthId = sortedEntities.filter((entity: User) => {
        if (entity?.[UserKeys.AUTH_ID]) {
          return true;
        } else {
          return false;
        }
      });

      // For each user without an 'authId', we retrieve the user in auth0
      if (fetchAuth0Users) {
        tenantUsageMetric.users = await this.retrieveAuth0UsersUsageMetrics(
          tenantId,
          entitiesWithAuthId,
        );
      }

      if (fetchTransactions) {
        tenantUsageMetric.transactions =
          await this.retrieveTransactionsUsageMetrics(tenantId);
      }

      stackUsageMetrics.push(tenantUsageMetric);
    }

    return stackUsageMetrics;
  }

  async retrieveAuth0UsersUsageMetrics(
    tenantId: string,
    entitiesWithAuthId: Array<User>,
  ) {
    let i = 0;
    const auth0Users: Array<Auth0User> = [];
    for (const entity of entitiesWithAuthId) {
      this.logger.info(
        `RETRIEVE USAGE METRICS: tenantId ${tenantId} user ${
          entity?.[UserKeys.AUTH_ID]
        } (${++i}/${entitiesWithAuthId.length})`,
      );
      let auth0User: Auth0User;
      try {
        auth0User = await this.apiAdminCallService.retrieveUsersInAuth0ById(
          tenantId,
          entity?.[UserKeys.AUTH_ID],
        );

        auth0Users.push(auth0User);
      } catch (error) {
        this.logger.error(
          `RETRIEVE USAGE METRICS: tenantId ${tenantId} entity ${entity?.id} doesn't exist in anymore in Auth0`,
        );
      }
    }

    // Sort Auth0 users [newest Auth0 users, ..., oldest Auth0 user]
    const sortedAuth0Users: Array<Auth0User> = auth0Users
      .filter((auth0User: Auth0User) => auth0User?.lastLogin) // Remove users who never logged in the product
      .sort((a: Auth0User, b: Auth0User) => {
        const timestampA: number = new Date(a?.lastLogin).getTime();
        const timestampB: number = new Date(b?.lastLogin).getTime();
        return timestampB - timestampA;
      });

    let first: Date;
    let latest: Date;
    if (sortedAuth0Users.length > 0) {
      const firstUser: Auth0User =
        sortedAuth0Users[sortedAuth0Users.length - 1];
      const latestUser: Auth0User = sortedAuth0Users[0];
      first = new Date(firstUser?.lastLogin);
      latest = new Date(latestUser?.lastLogin);
    }

    return {
      count: sortedAuth0Users?.length,
      first,
      latest,
    };
  }

  async retrieveTransactionsUsageMetrics(tenantId: string) {
    const transactions: Array<Transaction> =
      await this.transactionService.retrieveTransactions(tenantId);

    // Sort transactions [newest transaction, ..., oldest transaction]
    const sortedTransactions: Array<Transaction> = transactions.sort(
      (a: Transaction, b: Transaction) => {
        const timestampA: number = new Date(a?.createdAt).getTime();
        const timestampB: number = new Date(b?.createdAt).getTime();
        return timestampB - timestampA;
      },
    );

    let first: Date;
    let latest: Date;
    if (sortedTransactions.length > 0) {
      const firstTransaction: Transaction =
        sortedTransactions[sortedTransactions.length - 1];
      const latestTransaction: Transaction = sortedTransactions[0];
      first = new Date(firstTransaction?.createdAt);
      latest = new Date(latestTransaction?.createdAt);
    }

    return {
      count: sortedTransactions?.length,
      first,
      latest,
    };
  }

  async retrieveNetworkUsageMetrics(
    networkKey: string,
    singleTenantIdToRetrieve?: string,
    withDetailedTokenList?: boolean,
  ) {
    this.logger.info(`RETRIEVE NETWORK USAGE METRICS FOR ${networkKey}`);

    const { tenantIds, clientApplicationsObject } =
      await this.tenantService.listAllTenantIdsAndClientApplicationsInAuth0();

    const stackNetworkUsageMetrics: Array<ITenantNetworkUsageMetrics> = [];

    // For each tenant, check if it has changed or not
    for (const tenantId of tenantIds) {
      if (singleTenantIdToRetrieve && tenantId !== singleTenantIdToRetrieve) {
        continue;
      }

      this.logger.info(
        `RETRIEVE NETWORK USAGE METRICS FOR ${networkKey}: tenantId ${tenantId}`,
      );

      const tenantNetworkUsageMetric: ITenantNetworkUsageMetrics = {
        tenantId,
        name: extractNameFromClientApplicationName(
          clientApplicationsObject[tenantId]?.[ClientApplicationKeys.NAME],
        ),
      };

      const network: Network = await this.networkService.retrieveNetwork(
        tenantId,
        undefined, // chainId - TO BE DEPRECATED (replaced by 'networkKey')
        networkKey,
        false, // networkShallExist
      );

      if (!network) {
        continue;
      }

      // List of tokens
      const tokensList: Array<Token> = (
        await this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.all,
          undefined, // tokenKey
          false, // shallReturnSingleToken
          0, // offset
          undefined, // limit,
          false,
        )
      ).tokens;

      const filteredTokensList: Array<Token> = tokensList.filter(
        (token: Token) => {
          return (
            (network[NetworkKeys.KEY] &&
              network[NetworkKeys.KEY] ===
                token[TokenKeys.DEFAULT_NETWORK_KEY]) ||
            (network[NetworkKeys.CHAIN_ID] &&
              network[NetworkKeys.CHAIN_ID] ===
                token[TokenKeys.DEFAULT_CHAIN_ID])
          );
        },
      );

      const tokenDeploymentWorkflowInstances: Array<WorkflowInstance> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.all,
          undefined,
          undefined, // idempotencyKey
          undefined, // userId or userIds
          undefined, // entityId
          undefined, // objectId
          undefined, // entityType
          WorkflowType.TOKEN, // workflowType
          undefined, // otherWorkflowType
          false,
        );

      filteredTokensList.forEach((token: Token) => {
        const tokenDeploymentWorkflowInstance: WorkflowInstance =
          tokenDeploymentWorkflowInstances.find(
            (workflowInstance: WorkflowInstance) =>
              token?.[TokenKeys.DATA]?.[
                TokenKeys.DATA__WORKFLOW_INSTANCE_ID
              ] === workflowInstance[WorkflowInstanceKeys.ID],
          );

        if (
          tokenDeploymentWorkflowInstance &&
          tokenDeploymentWorkflowInstance[WorkflowInstanceKeys.CREATED_AT]
        ) {
          token.createdAt =
            tokenDeploymentWorkflowInstance[WorkflowInstanceKeys.CREATED_AT];
        }
      });

      // Sort tokens [newest token, ..., oldest token]
      const sortedTokens: Array<Token> = filteredTokensList.sort(
        (a: Token, b: Token) => {
          const timestampA: number = new Date(a?.createdAt).getTime();
          const timestampB: number = new Date(b?.createdAt).getTime();
          return timestampB - timestampA;
        },
      );

      if (sortedTokens.length > 0) {
        const firstToken: Token = sortedTokens[sortedTokens.length - 1];
        const latestToken: Token = sortedTokens[0];

        tenantNetworkUsageMetric.tokens = {
          count: sortedTokens?.length,
          first: new Date(firstToken?.createdAt),
          latest: new Date(latestToken?.createdAt),
        };

        if (withDetailedTokenList) {
          tenantNetworkUsageMetric.tokens.list = sortedTokens.map(
            (token: Token) => {
              return {
                id: token[TokenKeys.TOKEN_ID],
                name: token[TokenKeys.NAME],
              };
            },
          );
        }
      }

      const tenantWorkflowInstances: Array<WorkflowInstance> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.all,
          undefined,
          undefined, // idempotencyKey
          undefined, // userId or userIds
          undefined, // entityId
          undefined, // objectId
          undefined, // entityType
          WorkflowType.ACTION, // workflowType
          WorkflowType.ORDER, // otherWorkflowType
          false,
        );

      const filteredWorkflowInstances = tenantWorkflowInstances.filter(
        (workflowInstance: WorkflowInstance) => {
          if (
            sortedTokens &&
            sortedTokens.length > 0 &&
            sortedTokens.find((token: Token) => {
              return (
                workflowInstance?.[WorkflowInstanceKeys.ENTITY_ID] &&
                workflowInstance?.[WorkflowInstanceKeys.ENTITY_ID] ===
                  token?.[TokenKeys.TOKEN_ID]
              );
            })
          ) {
            return true;
          }
          return false;
        },
      );

      // Sort workflow instances [newest workflow instance, ..., oldest workflow instance]
      const sortedWorkflowInstances: Array<WorkflowInstance> =
        filteredWorkflowInstances.sort(
          (a: WorkflowInstance, b: WorkflowInstance) => {
            const timestampA: number = new Date(a?.createdAt).getTime();
            const timestampB: number = new Date(b?.createdAt).getTime();
            return timestampB - timestampA;
          },
        );

      if (sortedWorkflowInstances.length > 0) {
        const firstWorkflowInstance: WorkflowInstance =
          sortedWorkflowInstances[sortedWorkflowInstances.length - 1];
        const latestWorkflowInstance: WorkflowInstance =
          sortedWorkflowInstances[0];

        tenantNetworkUsageMetric.workflowInstances = {
          count: sortedWorkflowInstances?.length,
          first: new Date(firstWorkflowInstance?.createdAt),
          latest: new Date(latestWorkflowInstance?.createdAt),
        };
      }

      if (
        tenantNetworkUsageMetric.tokens &&
        tenantNetworkUsageMetric.tokens.count > 0
      ) {
        // We shall not add the tenant in the global report in case it
        // includes no token deployed on the specified network.
        stackNetworkUsageMetrics.push(tenantNetworkUsageMetric);
      }
    }

    return stackNetworkUsageMetrics;
  }
}
