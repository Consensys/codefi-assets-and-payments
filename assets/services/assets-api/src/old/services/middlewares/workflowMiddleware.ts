import { BasicWorkflow } from 'src/old/constants/workflows/basic';
import { UserType } from 'src/types/user';
import { WorkflowInstance } from 'src/types/workflow/workflowInstances';

import ErrorService from 'src/utils/errorService';

import { ApiCallHelperService } from 'src/modules/v2ApiCall/api.call.service/';
import {
  ApiWorkflowWorkflowTemplateService,
  ApiWorkflowWorkflowInstanceService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import { keys as WorkflowInstanceKeys } from 'src/types/workflow/workflowInstances';
import { WorkflowInstanceEnum } from 'src/old/constants/enum';
import { nestjsLogger } from '@codefi-assets-and-payments/observability'; // Codefi logger

const workflowTemplateService = new ApiWorkflowWorkflowTemplateService(
  new ApiCallHelperService(),
  nestjsLogger().logger,
);
const workflowInstanceService = new ApiWorkflowWorkflowInstanceService(
  nestjsLogger().logger,
  new ApiCallHelperService(),
);

// FIXME: refactor this whole middleware
class WorkflowMiddleWare {
  async checkStateTransitionBatch(
    tenantId: string,
    workflowName: string,
    workflowInstanceIds: Array<number>, // Array of workflow instances (or null if no workflow is not started yet)
    userType: UserType,
    functionName: string,
  ): Promise<Array<string>> {
    try {
      const fetchedWorkflowInstances: Array<WorkflowInstance> =
        await workflowInstanceService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.ids,
          workflowInstanceIds.filter(
            (workflowInstanceId: number) => workflowInstanceId !== null,
          ), // We remove all occurences of 'null' from the array as there are no workflow instances to fetch for those
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          undefined, // WorkflowType
          undefined, // otherWorkflowType
          false,
        );

      const workflowInstancesMap = fetchedWorkflowInstances.reduce(
        (map, workflowInstance: WorkflowInstance) => ({
          ...map,
          [workflowInstance[WorkflowInstanceKeys.ID]]: workflowInstance,
        }),
        {},
      );

      const currentStatuses: Array<string> = workflowInstanceIds.map(
        (workflowInstanceId: number) => {
          if (workflowInstanceId === null) {
            return BasicWorkflow.NOT_STARTED;
          } else if (
            workflowInstancesMap[workflowInstanceId] &&
            workflowInstancesMap[workflowInstanceId][WorkflowInstanceKeys.STATE]
          ) {
            return workflowInstancesMap[workflowInstanceId][
              WorkflowInstanceKeys.STATE
            ];
          } else {
            ErrorService.throwError(
              `shall never happen: no valid fromState was found for workflow instance with ID ${workflowInstanceId}`,
            );
          }
        },
      );

      const nextStates: Array<string> =
        await workflowTemplateService.getNextStateBatch(
          tenantId,
          workflowName,
          functionName,
          currentStatuses,
          UserType[userType],
        );

      return nextStates;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking batch of state transitions',
        'checkStateTransitionBatch',
        false,
        500,
      );
    }
  }

  /**
   * [Check state transition]
   * This middleware is a state machine. It checks the validity of the
   * status/state of the on-going workflowInstance, e.g.
   * whether or not it is valid workflowInstance according to the workflowTemplate the
   * entity is associated with.
   * Furthermore, it provides the next status/state according to the workflowTemplate.
   *  - _workflowName: Determines what type of workflow it is (e.g.
   *     kyc|issuance|otcTransfer|withdrawal) --> A
   *    'ActionWorkflowEnum' shall be passed as parameter
   *  - _workflowInstanceId: ID of the workflowInstance containing the current state
   *     within the workflow
   *  - _userType: Determines the workflow is triggerred on behalf of an ADMIN (1),
   *     a USER (2), or a VEHICLE (3) --> A 'UserTypeEnum' shall be passed as parameter
   *  - _functionName: Name of the function the user wants to call
   */
  async checkStateTransition(
    tenantId: string,
    workflowName: string,
    workflowInstanceId: number,
    userType: UserType,
    functionName: string,
  ): Promise<string> {
    try {
      let currentStatus: string;
      if (workflowInstanceId) {
        const fetchedWorkflowInstance: WorkflowInstance =
          await workflowInstanceService.retrieveWorkflowInstances(
            tenantId,
            WorkflowInstanceEnum.id,
            Number(workflowInstanceId),
            undefined, // idempotencyKey
            undefined,
            undefined,
            undefined,
            undefined, // entityType
            undefined, // WorkflowType
            undefined, // otherWorkflowType
            true,
          );
        currentStatus = fetchedWorkflowInstance[WorkflowInstanceKeys.STATE];
      } else {
        currentStatus = BasicWorkflow.NOT_STARTED;
      }

      const nextState: string = await workflowTemplateService.getNextState(
        tenantId,
        workflowName,
        functionName,
        currentStatus,
        UserType[userType],
      );

      return nextState;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking state transition',
        'checkStateTransition',
        false,
        500,
      );
    }
  }
}

const myWorkflowMiddleWare = new WorkflowMiddleWare();

export default myWorkflowMiddleWare;
