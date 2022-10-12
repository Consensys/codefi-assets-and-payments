/**
 * FUND CORPORATE ACTIONS WORKFLOW
 *
 * -- On-chain event-workflow --
 *
 * The fund subscription workflow allows an investor to purchase new tokens:
 *  1) Creating a event off-chain
 *  2) Accepting/rejecting event off-chain

 *
 *  createEvent     ___________   settleEvent    _____________
 *         -->     | SCHEDULED |      -->       |   SETTLED   |
 *      [issuer]    -----------    [issuer]      -------------
 *
 */
import {
  TokenIdentifierEnum,
  WorkflowTemplateEnum,
  WorkflowInstanceEnum,
} from 'src/old/constants/enum';

import { keys as TokenKeys, Token } from 'src/types/token';
import ErrorService from 'src/utils/errorService';
import { keys as UserKeys, User, UserType } from 'src/types/user';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import { LinkService } from 'src/modules/v2Link/link.service';
import { Injectable } from '@nestjs/common';
import {
  CancelEventOutput,
  CreateEventOutput,
  SettleEventOutput,
} from '../workflows.digitalasset.dto';

import { FunctionName } from 'src/types/smartContract';
import {
  keys as EventKeys,
  EventType,
  EventStatus,
  EventInvestors,
  IEventInvestors,
} from 'src/types/workflow/workflowInstances';
import { ClassData } from 'src/types/asset';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';

import { EntityType } from 'src/types/entity';

import { WorkflowType } from 'src/types/workflow/workflowInstances';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import {
  keys as WorkflowTemplateKeys,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';
import { ApiMailingCallService } from 'src/modules/v2ApiCall/api.call.service/mailing';
import { Event } from 'src/types/workflow/workflowInstances/event';
import { UserListingService } from 'src/modules/v2User/user.service/listAllUsers';
import { getClientName } from 'src/utils/commonUtils';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.EVENT;

@Injectable()
export class WorkFlowsEventService {
  constructor(
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly apiMailingCallService: ApiMailingCallService,
    private readonly userListingService: UserListingService,
    private readonly linkService: LinkService,
    private readonly assetDataService: AssetDataService,
  ) {}

  /**
   * [Create corporate action (also called lifecycle event)]
   *
   * This function can only be called by an issuer.
   * It starts a new event-workflow .
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: SCHEDULED
   */
  async createEvent(
    tenantId: string,
    idempotencyKey: string,
    typeFunctionUser: UserType,
    userId: string,
    tokenId: string,
    assetClassKey: string,
    eventType: EventType,
    settlementDate: Date,
    amount: string,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<CreateEventOutput> {
    try {
      const functionName: FunctionName = FunctionName.CREATE_EVENT;

      //  Preliminary step: Fetch all required data in databases

      const [user, investors, token, eventWithSameKey]: [
        User,
        Array<User>,
        Token,
        Event,
      ] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, userId, true),
        this.userListingService.listAllThirdPartiesLinkedToEntity(
          tenantId,
          UserType.INVESTOR,
          tokenId,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tokenId,
          true,
          undefined,
          undefined,
          true,
        ),
        this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.EVENT,
          idempotencyKey,
        ),
      ]);
      // Idempotency
      if (eventWithSameKey) {
        // Event was already created (idempotency)
        return {
          event: eventWithSameKey,
          created: false,
          message: 'Event creation was already done (idempotencyKey)',
        };
      }

      const assetClassData: ClassData =
        this.assetDataService.retrieveAssetClassData(token, assetClassKey);

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // createEvents
      );

      const eventsWorkflowId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          TYPE_WORKFLOW_NAME,
        )
      )[WorkflowTemplateKeys.ID];

      const eventInvestors: Array<IEventInvestors> = investors.map(
        (investor) => {
          return {
            [EventInvestors.INVESTOR_ID]: investor.id,
            [EventInvestors.INVESTOR_NAME]: getClientName(investor),
            [EventInvestors.EVENT_STATE]: EventStatus.SCHEDULED,
          };
        },
      );

      const eventData = {
        [EventKeys.DATA__EVENT_SETTLEMENT_DATE]: settlementDate,
        [EventKeys.DATA__EVENT_TYPE]: eventType,
        [EventKeys.DATA__EVENT_AMOUNT]: amount,
        [EventKeys.DATA__EVENT_INVESTORS]: eventInvestors,
      };

      // Create workflow instance in Workflow-API
      const event: Event = await this.workflowService.createWorkflowInstance(
        tenantId,
        idempotencyKey,
        WorkflowType.EVENT,
        functionName,
        typeFunctionUser,
        userId,
        token[TokenKeys.TOKEN_ID],
        EntityType.TOKEN,
        undefined, // objectId
        undefined, // recipientId
        undefined, // brokerId
        undefined, // agentId
        eventsWorkflowId,
        0, // quantity
        0, // price
        undefined, // documentId
        undefined,
        assetClassKey, // assetClass
        new Date(),
        nextState, // EventWorkflow.SCHEDULED if called by Issuer
        undefined, //offerId
        undefined, //orderSide
        eventData,
      );

      if (sendNotification) {
        this.apiMailingCallService.notifyInvestorEventCreated(
          tenantId,
          user,
          investors,
          token,
          eventType,
          authToken,
        );
      }

      return {
        event: event,
        created: true,
        message: `${eventType} event ${
          event[EventKeys.ID]
        } is created successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating event',
        'createEvent',
        false,
        500,
      );
    }
  }

  /**
   * [Settle corporate action (also called lifecycle event)]
   *
   * This function can only be called by the issuer.
   * It can only be called for an event-workflow (issuance) in state SCHEDULED.
   * It allows the issuer to settle his event.
   *
   * Off-chain state machine:
   *  - Initial state: SCHEDULED
   *  - Destination state: SETTLED
   */
  async settleEvent(
    tenantId: string,
    typeFunctionUser: UserType,
    issuerId: string,
    investorsIds: Array<string>,
    eventId: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<SettleEventOutput> {
    try {
      const functionName: FunctionName = FunctionName.SETTLE_EVENT;

      // Preliminary step: Fetch all required data in databases

      const event: Event = await this.workflowService.retrieveWorkflowInstances(
        tenantId,
        WorkflowInstanceEnum.id,
        Number(eventId),
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        WorkflowType.EVENT,
        undefined, // otherWorkflowType
        true,
      );

      const [issuer, investors, token]: [User, Array<User>, Token] =
        await Promise.all([
          this.linkService.retrieveIssuerLinkedToEntity(
            tenantId,
            event[EventKeys.ENTITY_ID],
            EntityType.TOKEN,
          ),
          this.userListingService.listAllThirdPartiesLinkedToEntity(
            tenantId,
            UserType.INVESTOR,
            event[EventKeys.ENTITY_ID],
          ),
          this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.tokenId,
            event[EventKeys.ENTITY_ID],
            true,
            undefined,
            undefined,
            true,
          ),
        ]);

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the asset (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }
      const eventInvestors: Array<EventInvestors> =
        event[EventKeys.DATA][EventKeys.DATA__EVENT_INVESTORS];

      const investorsMap: Map<string, EventInvestors> = new Map(
        event[EventKeys.DATA][EventKeys.DATA__EVENT_INVESTORS].map(
          (investor) => [investor[UserKeys.USER_ID], investor],
        ),
      );

      investorsIds.forEach((investorId) => {
        const investor = investorsMap.get(investorId);
        investor[EventInvestors.EVENT_STATE] = EventStatus.SETTLED;
      });

      const eventInvestorsStates: Array<string> = eventInvestors.map(
        (eventInvestor: EventInvestors) =>
          eventInvestor[EventInvestors.EVENT_STATE],
      );

      const newEvent: Event = {
        ...event,
        [EventKeys.DATA]: { [EventKeys.DATA__EVENT_INVESTORS]: eventInvestors },
      };
      const allSettled = (eventInvestorsState: Array<string>) =>
        eventInvestorsState.every((v) => v === EventStatus.SETTLED);

      let updatedEvent: Event;

      if (!allSettled(eventInvestorsStates)) {
        updatedEvent = await this.workflowService.updateWorkflowInstance(
          tenantId,
          event[EventKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newEvent,
        );
      } else {
        const nextState: string = await WorkflowMiddleWare.checkStateTransition(
          tenantId,
          TYPE_WORKFLOW_NAME,
          event[EventKeys.ID], // workflow instance ID
          typeFunctionUser,
          functionName, // settleEvent
        );

        updatedEvent = await this.workflowService.updateWorkflowInstance(
          tenantId,
          event[EventKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          event,
        );
        if (sendNotification) {
          this.apiMailingCallService.notifyInvestorEventSettled(
            tenantId,
            issuer,
            investors,
            event[EventKeys.DATA][EventKeys.DATA__EVENT_TYPE],
            token,
            authToken,
          );
        }
      }
      return {
        event: updatedEvent,
        updated: true,
        message: 'Event successfully settled',
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'settling event',
        'settleEvent',
        false,
        500,
      );
    }
  }

  /**
   * [Cancel corporate action (also called lifecycle event)]
   *
   * This function can only be called by the issuer.
   * It can only be called for an event-workflow (issuance) in state SCHEDULED.
   * It allows the issuer to cancel his event.
   *
   * Off-chain state machine:
   *  - Initial state: SCHEDULED
   *  - Destination state: CANCELLED
   */
  async cancelEvent(
    tenantId: string,
    typeFunctionUser: UserType,
    issuerId: string,
    investorsIds: Array<string>,
    eventId: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<CancelEventOutput> {
    try {
      const functionName: FunctionName = FunctionName.CANCEL_EVENT;

      // Preliminary step: Fetch all required data in databases

      const event: Event = await this.workflowService.retrieveWorkflowInstances(
        tenantId,
        WorkflowInstanceEnum.id,
        Number(eventId),
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        WorkflowType.EVENT,
        undefined, // otherWorkflowType
        true,
      );

      const eventType: EventType =
        event[EventKeys.DATA][EventKeys.DATA__EVENT_TYPE];

      const [issuer, investors, token]: [User, Array<User>, Token] =
        await Promise.all([
          this.apiEntityCallService.fetchEntity(
            tenantId,
            event[EventKeys.USER_ID],
            true,
          ),
          this.userListingService.listAllThirdPartiesLinkedToEntity(
            tenantId,
            UserType.INVESTOR,
            event[EventKeys.ENTITY_ID],
          ),
          this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.tokenId,
            event[EventKeys.ENTITY_ID],
            true,
            undefined,
            undefined,
            true,
          ),
        ]);

      // ==> Step1: Perform several checks

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer who created the event (${
            event[EventKeys.USER_ID]
          })`,
        );
      }

      const eventInvestors: Array<EventInvestors> =
        event[EventKeys.DATA][EventKeys.DATA__EVENT_INVESTORS];

      const investorsMap: Map<string, EventInvestors> = new Map(
        event[EventKeys.DATA][EventKeys.DATA__EVENT_INVESTORS].map(
          (investor) => [investor[UserKeys.USER_ID], investor],
        ),
      );

      investorsIds.forEach((investorId) => {
        investorsMap.delete(investorId);
      });

      const newEventInvestors: IterableIterator<EventInvestors> =
        investorsMap.values();
      const newEvent: Event = {
        ...event,
        [EventKeys.DATA]: {
          [EventKeys.DATA__EVENT_INVESTORS]: [...newEventInvestors],
        },
      };
      const eventInvestorsStates: Array<string> = eventInvestors.map(
        (eventInvestor: EventInvestors) =>
          eventInvestor[EventInvestors.EVENT_STATE],
      );

      const allSettled = (eventInvestorsState: Array<string>) =>
        eventInvestorsState.every((v) => v === EventStatus.SETTLED);
      let updatedEvent: Event;

      if (!investorsMap.size) {
        const nextState: string = await WorkflowMiddleWare.checkStateTransition(
          tenantId,
          TYPE_WORKFLOW_NAME,
          event[EventKeys.ID], // workflow instance ID
          typeFunctionUser,
          functionName, // cancelEvent
        );

        updatedEvent = await this.workflowService.updateWorkflowInstance(
          tenantId,
          event[EventKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newEvent,
        );
        if (sendNotification) {
          this.apiMailingCallService.notifyInvestorEventCanceled(
            tenantId,
            issuer,
            investors,
            event[EventKeys.DATA][EventKeys.DATA__EVENT_TYPE],
            token,
            authToken,
          );
        }
      } else if (!allSettled(eventInvestorsStates)) {
        updatedEvent = await this.workflowService.updateWorkflowInstance(
          tenantId,
          event[EventKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newEvent,
        );
      } else {
        const nextState: string = await WorkflowMiddleWare.checkStateTransition(
          tenantId,
          TYPE_WORKFLOW_NAME,
          event[EventKeys.ID], // workflow instance ID
          typeFunctionUser,
          FunctionName.SETTLE_EVENT, // settleEvent
        );

        updatedEvent = await this.workflowService.updateWorkflowInstance(
          tenantId,
          event[EventKeys.ID],
          FunctionName.SETTLE_EVENT,
          typeFunctionUser,
          nextState,
          event,
        );

        if (sendNotification) {
          this.apiMailingCallService.notifyInvestorEventSettled(
            tenantId,
            issuer,
            investors,
            event[EventKeys.DATA][EventKeys.DATA__EVENT_TYPE],
            token,
            authToken,
          );
        }
      }

      return {
        event: updatedEvent,
        updated: true,
        message: `${eventType} event ${
          event[EventKeys.ID]
        } updated successfully (event cancelled)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cancelling event',
        'cancelEvent',
        false,
        500,
      );
    }
  }
}
