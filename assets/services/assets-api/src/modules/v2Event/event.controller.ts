import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  Delete,
} from '@nestjs/common';

import {
  RetrieveEventParamInput,
  RetrieveEventOutput,
  ListAllEventsOutput,
  ListAllEventsQueryInput,
  MAX_EVENTS_COUNT,
  DeleteEventOutput,
  DeleteEventParamInput,
} from './event.dto';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

import { WorkflowInstanceEnum } from 'src/old/constants/enum';

import { UserType } from 'src/types/user';
import {
  keys as EventKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { Event } from 'src/types/workflow/workflowInstances/event';
import { ApiWorkflowWorkflowInstanceService } from '../v2ApiCall/api.call.service/workflow';
import { EventService } from './event.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { validateSorting } from 'src/utils/checks/v2Sorts';
import { SortCriteria } from '../v2ApiCall/api.call.service/query';

@Controller('v2/essentials/digital/asset/event')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  @Get()
  @HttpCode(200)
  async listAllEvents(
    @UserContext() userContext: IUserContext,
    @Query() eventQuery: ListAllEventsQueryInput,
  ): Promise<ListAllEventsOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);
      const offset = Number(eventQuery.offset || 0);
      const limit: number = Math.min(
        Number(eventQuery.limit || MAX_EVENTS_COUNT),
        MAX_EVENTS_COUNT,
      );

      // Extract states filter from query param
      let states: Array<string>;
      if (eventQuery.states) {
        states = JSON.parse(eventQuery.states);
        if (!(states && Array.isArray(states))) {
          ErrorService.throwError(
            'Invalid input for states. Shall be a stringified array.',
          );
        }
      }

      // Extract functionNames filter from query param
      let functionNames: Array<string>;
      if (eventQuery.functionNames) {
        functionNames = JSON.parse(eventQuery.functionNames);
        if (!(functionNames && Array.isArray(functionNames))) {
          ErrorService.throwError(
            'Invalid input for functionNames. Shall be a stringified array.',
          );
        }
      }

      // Extract userIds filter from query param
      let userIds: Array<string>;
      if (eventQuery.userIds) {
        userIds = JSON.parse(eventQuery.userIds);
        if (!(userIds && Array.isArray(userIds))) {
          ErrorService.throwError(
            'Invalid input for userIds. Shall be a stringified array.',
          );
        }
      }

      // Extract dates filter from query param
      let stringDates: Array<string>;
      if (eventQuery.dates) {
        stringDates = JSON.parse(eventQuery.dates);
        if (!(stringDates && Array.isArray(stringDates))) {
          ErrorService.throwError(
            'Invalid input for dates. Shall be a stringified array.',
          );
        }
      }
      const dates: Array<Date> = stringDates
        ? stringDates.map((stringDate: string) => new Date(stringDate))
        : undefined;

      let sorts: Array<SortCriteria>;
      if (eventQuery.sorts) {
        sorts = JSON.parse(eventQuery.sorts);
        validateSorting(sorts);
      }

      const eventsList: Array<Event> = await this.eventService.listAllEvents(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER],
        eventQuery.tokenId,
        undefined,
        states,
        functionNames,
        userIds,
        dates,
        sorts,
      );

      const slicedEventsList: Array<Event> = eventsList.slice(
        offset,
        Math.min(offset + limit, eventsList.length),
      );

      const slicedEventsListWithMetadata: Array<Event> =
        await this.apiMetadataCallService.addMetadataToWorkflowInstances(
          userContext[UserContextKeys.TENANT_ID],
          slicedEventsList,
          false, // withAssetData
        );

      const response: ListAllEventsOutput = {
        events: slicedEventsListWithMetadata,
        count: slicedEventsListWithMetadata.length,
        total: eventsList.length,
        message: `${
          slicedEventsListWithMetadata.length
        } event(s) listed successfully for user ${
          userContext[UserContextKeys.USER_ID]
        }${
          eventQuery.tokenId
            ? `, filtered for  token ${eventQuery.tokenId}`
            : ''
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing events',
        'listAllEvents',
        true,
        500,
      );
    }
  }

  @Get(':eventIndex')
  @HttpCode(200)
  async retrieveEvent(
    @UserContext() userContext: IUserContext,
    @Param() eventParam: RetrieveEventParamInput,
  ): Promise<RetrieveEventOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const event: Event = await this.workflowService.retrieveWorkflowInstances(
        userContext[UserContextKeys.TENANT_ID],
        WorkflowInstanceEnum.id,
        eventParam.eventIndex,
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        WorkflowType.EVENT,
        undefined, // otherWorkflowType
        true,
      );
      if (event[EventKeys.TYPE] !== WorkflowType.EVENT) {
        ErrorService.throwError(
          `workflow instance with ID ${
            event[EventKeys.ID]
          } was found, but is not an event (${event[EventKeys.TYPE]} instead)`,
        );
      }
      const fetchedEventWithMetadata: Event = (
        await this.apiMetadataCallService.addMetadataToWorkflowInstances(
          userContext[UserContextKeys.TENANT_ID],
          [event],
          true, // withAssetData
        )
      )[0];

      const response: RetrieveEventOutput = {
        event: fetchedEventWithMetadata,
        message: `Event with index ${eventParam.eventIndex} retrieved successfully`,
      };
      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving event',
        'retrieveEvent',
        true,
        500,
      );
    }
  }

  @Delete(':eventIndex')
  @HttpCode(200)
  async deleteEvent(
    @UserContext() userContext: IUserContext,
    @Param() eventParam: DeleteEventParamInput,
  ): Promise<DeleteEventOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const event: Event = await this.workflowService.retrieveWorkflowInstances(
        userContext[UserContextKeys.TENANT_ID],
        WorkflowInstanceEnum.id,
        eventParam.eventIndex,
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        WorkflowType.EVENT,
        undefined, // otherWorkflowType
        true,
      );
      if (event[EventKeys.TYPE] !== WorkflowType.EVENT) {
        ErrorService.throwError(
          `workflow instance with ID ${
            event[EventKeys.ID]
          } was found, but is not an event (${event[EventKeys.TYPE]} instead)`,
        );
      }
      const eventId: number = await this.eventService.deleteEvent(
        userContext[UserContextKeys.TENANT_ID],
        eventParam.eventIndex,
      );

      const response: DeleteEventOutput = {
        event: event,
        message: `Event with index ${eventId} deleted successfully`,
      };
      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting event',
        'deleteEvent',
        true,
        500,
      );
    }
  }
}
