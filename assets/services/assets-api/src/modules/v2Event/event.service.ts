import { Injectable } from '@nestjs/common';
import ErrorService from 'src/utils/errorService';
import { Event } from 'src/types/workflow/workflowInstances/event';
import {
  WorkflowInstance,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { User, keys as UserKeys } from 'src/types/user';

import { WorkflowInstanceService } from 'src/modules/v2WorkflowInstance/workflow.instance.service';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { keys as WorkflowInstancesKeys } from 'src/types/workflow/workflowInstances';
import { getQueryFilters } from 'src/utils/checks/v2Filters';
import { Field, SortCriteria } from '../v2ApiCall/api.call.service/query';

@Injectable()
export class EventService {
  constructor(
    private readonly workflowInstanceService: WorkflowInstanceService,

    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
  ) {}

  /**
   * Retrieve list of events
   */
  async listAllEvents(
    tenantId: string,
    user: User,
    tokenId: string,
    types: Array<string>, // Optional filter (for corporate actions type)
    workflowInstancesStates: Array<string>, // Optional filter
    functionNames: Array<string>, // Optional filter
    userIds: Array<string>, // Optional filter
    dates: Array<Date>, // Optional filter
    sorts?: Array<SortCriteria>, // Optional Sort
  ): Promise<Array<Event>> {
    try {
      const filters: Array<Field> = getQueryFilters(
        user[UserKeys.USER_ID],
        workflowInstancesStates,
        functionNames,
        userIds,
        dates,
      );

      const eventsList: Array<Event> =
        await this.workflowInstanceService.listAllWorkflowInstances(
          tenantId,
          WorkflowType.EVENT,
          undefined, // otherWorkflowType
          user,
          tokenId,
          undefined, // tokensId
          workflowInstancesStates,
          functionNames,
          userIds,
          dates,
          filters,
          sorts,
        );

      const filteredEventsList: Array<WorkflowInstance> = eventsList.filter(
        (workflowInstance: WorkflowInstance) => {
          if (
            types &&
            types.indexOf(
              workflowInstance[WorkflowInstancesKeys.DATA][
                WorkflowInstancesKeys.DATA__EVENT_TYPE
              ],
            ) < 0
          ) {
            return false;
          }
          return true;
        },
      );

      return filteredEventsList;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all events',
        'listAllEvents',
        false,
        500,
      );
    }
  }

  async deleteEvent(tenantId: string, instanceId: number): Promise<any> {
    try {
      await this.workflowService.deleteWorkflowInstance(tenantId, instanceId);

      return instanceId;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all events',
        'listAllEvents',
        false,
        500,
      );
    }
  }
}
