import { Injectable } from '@nestjs/common';

import { NestJSPinoLogger } from '@consensys/observability';

import ErrorService from 'src/utils/errorService';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { WorkflowInstanceEnum } from 'src/old/constants/enum';
import {
  keys as WorkflowInstancesKeys,
  keys as ActionKeys,
  keys as LinkKeys,
  WorkflowType,
  WorkflowInstance,
} from 'src/types/workflow/workflowInstances';
import { EntityType } from 'src/types/entity';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { keys as UserKeys, User, UserType } from 'src/types/user';

import { EntityService } from 'src/modules/v2Entity/entity.service';
import { LinkService } from 'src/modules/v2Link/link.service';
import {
  Field,
  SortCriteria,
  V2QueryOption,
} from 'src/modules/v2ApiCall/api.call.service/query';
import { getCommonFilters } from 'src/utils/checks/v2Filters';

@Injectable()
export class WorkflowInstanceService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly entityService: EntityService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly linkService: LinkService,
  ) {}

  /**
   * Retrieve list of workflow instances
   */
  async listAllWorkflowInstances(
    tenantId: string,
    workflowType: WorkflowType,
    otherWorkflowType: WorkflowType, // optional
    user: User,
    tokenId: string,
    tokenIds: Array<string>, // Optional filter (not taken into account in case tokenId is defined)
    workflowInstancesStates: Array<string>, // Optional filter
    functionNames: Array<string>, // Optional filter
    userIds: Array<string>, // Optional filter
    dates: Array<Date>, // Optional filter
    filters?: Array<Field>, // Optional V2 filter
    sorts?: Array<SortCriteria>, // Optional V2 Order
    queryOption?: V2QueryOption, // Optional V2 Query option
  ): Promise<Array<WorkflowInstance>> {
    try {
      let sortingRequired: boolean;

      const userType: UserType = user[UserKeys.USER_TYPE];
      if (
        userType !== UserType.SUPERADMIN &&
        userType !== UserType.ADMIN &&
        userType !== UserType.ISSUER &&
        userType !== UserType.INVESTOR &&
        userType !== UserType.UNDERWRITER &&
        userType !== UserType.BROKER &&
        userType !== UserType.VEHICLE &&
        userType !== UserType.AGENT
      ) {
        ErrorService.throwError(
          `invalid userType (${userType}): shall be chosen amongst ${UserType.SUPERADMIN}, ${UserType.ADMIN}, ${UserType.ISSUER}, ${UserType.INVESTOR}, ${UserType.UNDERWRITER}, ${UserType.BROKER},${UserType.AGENT}  and ${UserType.VEHICLE}`,
        );
      }

      let allWorkflowInstances: Array<WorkflowInstance>;

      let investorIdsOnBoardedByThirdParty: {
        [userId: string]: boolean;
      } = {};
      if (userType === UserType.BROKER) {
        investorIdsOnBoardedByThirdParty =
          await this.linkService.listAllInvestorIdsLinkedToThirdParty(
            tenantId,
            user[UserKeys.USER_ID],
            userType,
          );
      }

      /*------------------------------------- If/else start -----------------------------------------*/
      if (userType === UserType.SUPERADMIN || userType === UserType.ADMIN) {
        allWorkflowInstances = await this.listWorkflowInstancesAsAdmin(
          tenantId,
          workflowType,
          otherWorkflowType,
          tokenId,
        );
      } else if (tokenId) {
        if (userType === UserType.ISSUER) {
          allWorkflowInstances = await this.listWorkflowInstancesAsIssuer(
            tenantId,
            workflowType,
            otherWorkflowType,
            user,
            tokenId,
          );
        } else if (userType === UserType.UNDERWRITER) {
          allWorkflowInstances = await this.listWorkflowInstancesAsUnderwriter(
            tenantId,
            workflowType,
            otherWorkflowType,
            user,
            tokenId,
          );
        } else if (userType === UserType.BROKER) {
          allWorkflowInstances = await this.listWorkflowInstancesAsBroker(
            tenantId,
            workflowType,
            otherWorkflowType,
            user,
            tokenId,
            investorIdsOnBoardedByThirdParty,
          );
        } else if (userType === UserType.AGENT) {
          allWorkflowInstances = await this.listWorkflowInstancesAsAgent(
            tenantId,
            workflowType,
            otherWorkflowType,
            user,
            tokenId,
          );
        } else if (userType === UserType.NOTARY) {
          allWorkflowInstances = await this.listWorkflowInstancesAsNotary(
            tenantId,
            workflowType,
            otherWorkflowType,
            user,
            tokenId,
          );
        } else {
          allWorkflowInstances = await this.listWorkflowInstancesAsInvestor(
            tenantId,
            workflowType,
            otherWorkflowType,
            user,
            tokenId,
            tokenIds,
            filters,
            sorts,
            queryOption,
          );
        }
      } else {
        // Fetch all user's links
        const userEntityLinks: Array<Link> =
          await this.workflowService.retrieveWorkflowInstances(
            tenantId,
            WorkflowInstanceEnum.userId,
            undefined, // userEntityLinkId
            undefined, // idempotencyKey
            user[UserKeys.USER_ID],
            undefined, // entityId
            undefined, // objectId
            undefined, // entityType
            WorkflowType.LINK,
            undefined, // otherWorkflowType
            false,
          );

        // Filter links to keep only user-token links (e.g. direct user-token links)
        const directUserTokenLinks: Array<Link> = userEntityLinks.filter(
          (userEntityLink: Link) => {
            return userEntityLink[LinkKeys.ENTITY_TYPE] === EntityType.TOKEN;
          },
        );

        // In case user is a third party (e.g. UNDERWRITER, BROKER or NOTARY), filter
        // links to keep only user-issuer links.
        // Based on this, we can deduce a list of issuerIds, that can then be used
        // to fetch issuer-token links (e.g. indirect user-token links)
        let indirectUserTokenLinks: Array<Link> = [];
        if (
          userType === UserType.UNDERWRITER ||
          userType === UserType.BROKER ||
          userType === UserType.NOTARY ||
          userType === UserType.AGENT
        ) {
          // Filter links to keep only user-issuer links
          const thirPartyIssuerLinks: Array<Link> = userEntityLinks.filter(
            (userEntityLink: Link) => {
              return userEntityLink[LinkKeys.ENTITY_TYPE] === EntityType.ISSUER;
            },
          );
          const issuerIds: Array<string> = [];
          thirPartyIssuerLinks.map((thirPartyIssuerLink: Link) => {
            if (
              issuerIds.indexOf(thirPartyIssuerLink[LinkKeys.ENTITY_ID]) < 0
            ) {
              issuerIds.push(thirPartyIssuerLink[LinkKeys.ENTITY_ID]);
            }
          });
          indirectUserTokenLinks =
            await this.workflowService.retrieveWorkflowInstances(
              tenantId,
              WorkflowInstanceEnum.entityTypeAndUserIds,
              undefined, // userEntityLinkId
              undefined, // idempotencyKey
              issuerIds, // userIds
              undefined, // entityId
              undefined, // objectId
              EntityType.TOKEN, // entityType
              WorkflowType.LINK,
              undefined, // otherWorkflowType
              false,
            );
        }

        // We extract IDs by taking care of deduplicating them.
        // Indeed, in the case, where a user is both linked to a token overall + to an
        // asset class, there will be 2 links between him and the token.
        const tokenIdsToFetch: Array<string> = [];
        [...directUserTokenLinks, ...indirectUserTokenLinks].map(
          (userTokenLink: Link) => {
            const currentTokenId = userTokenLink[LinkKeys.ENTITY_ID];
            const tokenIdAlreadyInArray: boolean =
              tokenIdsToFetch.indexOf(currentTokenId) >= 0;
            const tokenIdToFilter: boolean =
              !tokenIds || (tokenIds && tokenIds.indexOf(currentTokenId) >= 0);
            if (!tokenIdAlreadyInArray && tokenIdToFilter) {
              tokenIdsToFetch.push(currentTokenId);
            }
          },
        );

        if (userType === UserType.INVESTOR) {
          allWorkflowInstances = await this.listWorkflowInstancesAsInvestor(
            tenantId,
            workflowType,
            otherWorkflowType,
            user,
            tokenId,
            tokenIdsToFetch,
            filters,
            sorts,
            queryOption,
          );
        } else {
          const allWorkflowInstancesArrays: Array<Array<WorkflowInstance>> = (
            await Promise.all(
              tokenIdsToFetch.map(async (tokenIdToFetch: string) => {
                try {
                  switch (userType) {
                    case UserType.ISSUER: {
                      return await this.listWorkflowInstancesAsIssuer(
                        tenantId,
                        workflowType,
                        otherWorkflowType,
                        user,
                        tokenIdToFetch,
                      );
                    }
                    case UserType.UNDERWRITER: {
                      return await this.listWorkflowInstancesAsUnderwriter(
                        tenantId,
                        workflowType,
                        otherWorkflowType,
                        user,
                        tokenIdToFetch,
                      );
                    }
                    case UserType.AGENT: {
                      return await this.listWorkflowInstancesAsAgent(
                        tenantId,
                        workflowType,
                        otherWorkflowType,
                        user,
                        tokenIdToFetch,
                      );
                    }
                    case UserType.BROKER: {
                      return await this.listWorkflowInstancesAsBroker(
                        tenantId,
                        workflowType,
                        otherWorkflowType,
                        user,
                        tokenIdToFetch,
                        investorIdsOnBoardedByThirdParty,
                      );
                    }
                    case UserType.NOTARY: {
                      return await this.listWorkflowInstancesAsNotary(
                        tenantId,
                        workflowType,
                        otherWorkflowType,
                        user,
                        tokenIdToFetch,
                      );
                    }
                  }
                } catch (error) {
                  this.logger.error({ error });
                  return null;
                }
              }),
            )
          ).filter((workflowInstanceArrays) => !!workflowInstanceArrays);

          allWorkflowInstances = allWorkflowInstancesArrays.reduce(
            (newArr, currentArr) => {
              return [...currentArr, ...newArr];
            },
            [],
          );
        }

        // Sorting is required here as we merged multiple workflow instances arrays
        sortingRequired = true;
      }
      /*------------------------------------- If/else end -----------------------------------------*/

      // Apply filters (if any)
      const datesStrings: Array<string> = dates
        ? dates.map((date) => date.toDateString())
        : undefined;
      const filteredWorkflowInstances: Array<WorkflowInstance> =
        allWorkflowInstances.filter((workflowInstance: WorkflowInstance) => {
          if (
            workflowInstancesStates &&
            workflowInstancesStates.indexOf(
              workflowInstance[WorkflowInstancesKeys.STATE],
            ) < 0
          ) {
            return false;
          } else if (
            functionNames &&
            functionNames.indexOf(
              workflowInstance[WorkflowInstancesKeys.NAME],
            ) < 0
          ) {
            return false;
          } else if (
            userIds &&
            userIds.indexOf(workflowInstance[WorkflowInstancesKeys.USER_ID]) < 0
          ) {
            return false;
          } else if (
            datesStrings &&
            datesStrings.indexOf(
              new Date(
                workflowInstance[WorkflowInstancesKeys.CREATED_AT],
              ).toDateString(),
            ) < 0
          ) {
            return false;
          } else {
            return true;
          }
        });

      // Apply sorting (if required)
      if (sortingRequired) {
        // This sorts workflow isntances array: [newest workflow instance, ..., oldest workflow instance]
        return filteredWorkflowInstances.sort(
          (a: WorkflowInstance, b: WorkflowInstance) => {
            const timestampA: number = new Date(
              a[ActionKeys.CREATED_AT],
            ).getTime();
            const timestampB: number = new Date(
              b[ActionKeys.CREATED_AT],
            ).getTime();
            return timestampB - timestampA;
          },
        );
      } else {
        return filteredWorkflowInstances;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all workflow instances',
        'listAllWorkflowInstances',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve list of workflow instances as a SUPERADMIN or as an ADMIN
   */
  async listWorkflowInstancesAsAdmin(
    tenantId: string,
    workflowType: WorkflowType,
    otherWorkflowType: WorkflowType, // optional
    tokenId: string,
  ): Promise<Array<WorkflowInstance>> {
    try {
      const workflowInstancesList: Array<WorkflowInstance> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          tokenId ? WorkflowInstanceEnum.entityId : WorkflowInstanceEnum.all,
          undefined,
          undefined, // idempotencyKey
          undefined,
          tokenId ? tokenId : undefined,
          undefined,
          undefined, // entityType
          workflowType,
          otherWorkflowType, // optional
          false,
        );

      return workflowInstancesList;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing workflow isntances as admin',
        'listWorkflowInstancesAsAdmin',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve list of workflow isntances for a given token, as an issuer
   */
  async listWorkflowInstancesAsIssuer(
    tenantId: string,
    workflowType: WorkflowType,
    otherWorkflowType: WorkflowType, // optional
    issuer: User,
    tokenId: string,
  ): Promise<Array<WorkflowInstance>> {
    try {
      // Check if token exists + if caller is indeed the issuer of the token
      await this.entityService.retrieveEntityAsIssuer(
        tenantId,
        issuer[UserKeys.USER_ID],
        `retrieve list of ${workflowType.toLowerCase()}s`,
        tokenId,
        EntityType.TOKEN,
      );

      const workflowInstancesList: Array<WorkflowInstance> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityId,
          undefined,
          undefined, // idempotencyKey
          undefined,
          tokenId,
          undefined,
          undefined, // entityType
          workflowType,
          otherWorkflowType, // otherWorkflowType
          false,
        );

      return workflowInstancesList;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing workflow instances as issuer',
        'listWorkflowInstancesAsIssuer',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve list of workflow instances for a given token, as an investor
   */
  async listWorkflowInstancesAsInvestor(
    tenantId: string,
    workflowType: WorkflowType,
    otherWorkflowType: WorkflowType, // optional
    investor: User,
    tokenId: string,
    tokenIds?: Array<string>,
    filters?: Array<Field>,
    sorts?: Array<SortCriteria>,
    queryOption?: V2QueryOption,
  ): Promise<Array<WorkflowInstance>> {
    const commonFilters = getCommonFilters(
      tenantId,
      otherWorkflowType ? [workflowType, otherWorkflowType] : [workflowType],
      tokenIds ? Array.from(new Set([tokenId, ...tokenIds])) : [tokenId],
    );

    if (!queryOption) {
      queryOption = {
        callerId: investor[UserKeys.USER_ID],
        isInvestorQuery: true,
      };
    }

    try {
      const workflowInstancesList =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityIdAndUserId,
          undefined,
          undefined,
          investor[UserKeys.USER_ID],
          tokenId,
          undefined, // objectId
          undefined, // entityType
          workflowType,
          otherWorkflowType, // otherWorkflowType
          false,
          filters ? [...commonFilters, ...filters] : commonFilters,
          sorts ? sorts : [],
          queryOption,
        );

      return workflowInstancesList;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing workflow instances as investor',
        'listWorkflowInstancesAsInvestor',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve list of workflow instances for a given token, as a broker
   */
  async listWorkflowInstancesAsBroker(
    tenantId: string,
    workflowType: WorkflowType,
    otherWorkflowType: WorkflowType, // optional
    broker: User,
    tokenId: string,
    userIdsOnBoardedByBroker: {
      [userId: string]: boolean;
    },
  ): Promise<Array<WorkflowInstance>> {
    try {
      try {
        // Check if token exists and can be accessed
        await this.entityService.retrieveEntityAsBroker(
          tenantId,
          broker,
          tokenId,
          EntityType.TOKEN,
        );
      } catch (error) {
        // Brokers can be "directly" or "indirectly" linked to a token
        //  - "directly" when an broker-token link exists
        //  - "indirectly" when an broker-issuer link exists (where 'issuer', is the issuer of the token)
        // In some edge cases, when a different 'kycTemplateId' is defined at token level and at issuer level,
        // it can happen that an broker finalized his KYC on-boarding at issuer level, but is not
        // authorized to acces token because KYC on-boarding requirements are different at token level.
        // In such cases, we don't return token's workflowInstances (empty array instead).
        this.logger.error(
          {
            error,
          },
          `Broker(id: ${
            broker[UserKeys.USER_ID]
          }) is not allowed to access data related to token(id: ${tokenId}).\n`,
        );
        return [];
      }

      let entityWorkflowInstances =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityId,
          undefined, // instanceId
          undefined, // idempotencyKey
          undefined, // userId
          tokenId,
          undefined, // objectId
          undefined, // entityType
          workflowType,
          otherWorkflowType, // otherWorkflowType
          false,
        );

      // For BROKER, filtering out links that were not related with the broker
      entityWorkflowInstances = entityWorkflowInstances.filter(
        (workflowInstance: WorkflowInstance) => {
          return (
            workflowInstance[LinkKeys.BROKER_ID] === broker[UserKeys.USER_ID] ||
            userIdsOnBoardedByBroker[workflowInstance[LinkKeys.USER_ID]] ||
            userIdsOnBoardedByBroker[workflowInstance[LinkKeys.RECIPIENT_ID]]
          );
        },
      );

      return entityWorkflowInstances;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing workflow instances as broker',
        'listWorkflowInstancesAsBroker',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve list of workflow instances for a given token, as an underwriter
   */
  async listWorkflowInstancesAsAgent(
    tenantId: string,
    workflowType: WorkflowType,
    otherWorkflowType: WorkflowType, // optional
    agent: User,
    tokenId: string,
  ): Promise<Array<WorkflowInstance>> {
    try {
      // Check if token can be accessed
      try {
        await this.entityService.retrieveEntityAsAgent(
          tenantId,
          agent,
          tokenId,
          EntityType.TOKEN,
        );
      } catch (error) {
        this.logger.error(
          {
            error,
          },
          `Agent(id: ${
            agent[UserKeys.USER_ID]
          }) is not allowed to access data related to token(id: ${tokenId}).\n`,
        );
        return [];
      }

      const entityWorkflowInstances =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityIdAndAgentId,
          undefined, // instanceId
          undefined, // idempotencyKey
          agent[UserKeys.USER_ID], // userId
          tokenId,
          undefined, // objectId
          undefined, // entityType
          workflowType,
          otherWorkflowType, // otherWorkflowType
          false,
        );

      return entityWorkflowInstances;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing workflow instances as agent',
        'listWorkflowInstancesAsAgent',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve list of workflow instances for a given token, as an underwriter
   */
  async listWorkflowInstancesAsUnderwriter(
    tenantId: string,
    workflowType: WorkflowType,
    otherWorkflowType: WorkflowType, // optional
    underwriter: User,
    tokenId: string,
  ): Promise<Array<WorkflowInstance>> {
    try {
      // Check if token can be accessed
      try {
        await this.entityService.retrieveEntityAsUnderwriter(
          tenantId,
          underwriter,
          tokenId,
          EntityType.TOKEN,
        );
      } catch (error) {
        // Undrwriters can be "directly" or "indirectly" linked to a token
        //  - "directly" when an underwriter-token link exists
        //  - "indirectly" when an underwriter-issuer link exists (where 'issuer', is the issuer of the token)
        // In some edge cases, when a different 'kycTemplateId' is defined at token level and at issuer level,
        // it can happen that an underwriter finalized his KYC on-boarding at issuer level, but is not
        // authorized to acces token because KYC on-boarding requirements are different at token level.
        // In such cases, we don't return token's workflowInstances (empty array instead).
        this.logger.error(
          {
            error,
          },
          `Underwriter(id: ${
            underwriter[UserKeys.USER_ID]
          }) is not allowed to access data related to token(id: ${tokenId}).\n`,
        );
        return [];
      }

      const entityWorkflowInstances =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityId,
          undefined, // instanceId
          undefined, // idempotencyKey
          undefined, // userId
          tokenId,
          undefined, // objectId
          undefined, // entityType
          workflowType,
          otherWorkflowType, // otherWorkflowType
          false,
        );

      return entityWorkflowInstances;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing workflow instances as underwriter',
        'listWorkflowInstancesAsUnderwriter',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve list of workflow instances for a given token, as a notary
   */
  async listWorkflowInstancesAsNotary(
    tenantId: string,
    workflowType: WorkflowType,
    otherWorkflowType: WorkflowType, // optional
    notary: User,
    tokenId: string,
  ): Promise<Array<WorkflowInstance>> {
    try {
      // Check if token can be accessed
      try {
        await this.entityService.retrieveEntityAsNotary(
          tenantId,
          notary,
          tokenId,
          EntityType.TOKEN,
        );
      } catch (error) {
        // Notaries can be "directly" or "indirectly" linked to a token
        //  - "directly" when an notary-token link exists
        //  - "indirectly" when an notary-issuer link exists (where 'issuer', is the issuer of the token)
        // In some edge cases, when a different 'kycTemplateId' is defined at token level and at issuer level,
        // it can happen that an notary finalized his KYC on-boarding at issuer level, but is not
        // authorized to acces token because KYC on-boarding requirements are different at token level.
        // In such cases, we don't return token's workflowInstances (empty array instead).
        this.logger.error(
          {
            error,
          },
          `Notary(id: ${
            notary[UserKeys.USER_ID]
          }) is not allowed to access data related to token(id: ${tokenId}).\n`,
        );
        return [];
      }

      const entityWorkflowInstances =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityId,
          undefined, // instanceId
          undefined, // idempotencyKey
          undefined, // userId
          tokenId,
          undefined, // objectId
          undefined, // entityType
          workflowType,
          otherWorkflowType, // otherWorkflowType
          false,
        );

      return entityWorkflowInstances;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing workflow instances as notary',
        'listWorkflowInstancesAsNotary',
        false,
        500,
      );
    }
  }
}
