import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  UseFilters,
} from '@nestjs/common';

import {
  RetrieveActionParamInput,
  RetrieveActionOutput,
  ListAllActionsOutput,
  ListAllActionsQueryInput,
  RetrieveHistoryOutput,
  MAX_ACTIONS_COUNT,
} from './action.dto';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

/**
 * USERS
 *
 * 5 kind of users can be distinguished:
 *  - SUPERADMINS (ConsenSys)
 *  - ADMINS (not available yet)
 *  - ISSUERS
 *  - NOTARIES
 *  - INVESTORS
 *  - VEHICLES
 */

import { UserType } from 'src/types/user';
import { keys as ActionKeys } from 'src/types/workflow/workflowInstances';
import { Action } from 'src/types/workflow/workflowInstances/action';
import { ApiWorkflowWorkflowInstanceService } from '../v2ApiCall/api.call.service/workflow';
import { ActionService } from './action.service';
import { setToLowerCase } from 'src/utils/case';
import { ApiMetadataCallService } from '../v2ApiCall/api.call.service/metadata';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';
import { validateSorting } from 'src/utils/checks/v2Sorts';
import { SortCriteria } from '../v2ApiCall/api.call.service/query';

@Controller('v2/essentials/action')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class ActionController {
  constructor(
    private readonly actionHelperService: ActionService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllActions(
    @UserContext() userContext: IUserContext,
    @Query() actionQuery: ListAllActionsQueryInput,
  ): Promise<ListAllActionsOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const offset = Number(actionQuery.offset || 0);
      const limit: number = Math.min(
        Number(actionQuery.limit || MAX_ACTIONS_COUNT),
        MAX_ACTIONS_COUNT,
      );

      // Extract tokenIds filter from query param
      let tokenIds: Array<string>;
      if (actionQuery.tokenIds) {
        tokenIds = JSON.parse(actionQuery.tokenIds);
        if (!(tokenIds && Array.isArray(tokenIds))) {
          ErrorService.throwError(
            'Invalid input for tokenIds. Shall be a stringified array.',
          );
        }
      }

      // Extract states filter from query param
      let states: Array<string>;
      if (actionQuery.states) {
        states = JSON.parse(actionQuery.states);
        if (!(states && Array.isArray(states))) {
          ErrorService.throwError(
            'Invalid input for states. Shall be a stringified array.',
          );
        }
      }

      // Extract functionNames filter from query param
      let functionNames: Array<string>;
      if (actionQuery.functionNames) {
        functionNames = JSON.parse(actionQuery.functionNames);
        if (!(functionNames && Array.isArray(functionNames))) {
          ErrorService.throwError(
            'Invalid input for functionNames. Shall be a stringified array.',
          );
        }
      }

      // Extract userIds filter from query param
      let userIds: Array<string>;
      if (actionQuery.userIds) {
        userIds = JSON.parse(actionQuery.userIds);
        if (!(userIds && Array.isArray(userIds))) {
          ErrorService.throwError(
            'Invalid input for userIds. Shall be a stringified array.',
          );
        }
      }

      // Extract dates filter from query param
      let stringDates: Array<string>;
      if (actionQuery.dates) {
        stringDates = JSON.parse(actionQuery.dates);
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
      if (actionQuery.sorts) {
        sorts = JSON.parse(actionQuery.sorts);
        validateSorting(sorts);
      }

      const actionsList: Array<Action> =
        await this.actionHelperService.listAllActions(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          actionQuery.tokenId,
          tokenIds,
          states,
          functionNames,
          userIds,
          dates,
          sorts,
        );

      const filteredActionsList: Array<Action> =
        actionQuery.tokenId && actionQuery.assetClass
          ? actionsList.filter((currentAction: Action) => {
              return (
                currentAction[ActionKeys.ASSET_CLASS] ===
                setToLowerCase(actionQuery.assetClass)
              );
            })
          : actionsList;

      const slicedActionsList: Array<Action> = filteredActionsList.slice(
        offset,
        Math.min(offset + limit, filteredActionsList.length),
      );

      const slicedActionsListWithMetadata: Array<Action> =
        await this.apiMetadataCallService.addMetadataToWorkflowInstances(
          userContext[UserContextKeys.TENANT_ID],
          slicedActionsList,
          true, // withAssetData
        );

      const response: ListAllActionsOutput = {
        actions: slicedActionsListWithMetadata,
        count: slicedActionsListWithMetadata.length,
        total: filteredActionsList.length,
        message: `${
          slicedActionsListWithMetadata.length
        } action(s) listed successfully for user ${
          userContext[UserContextKeys.USER_ID]
        }${
          actionQuery.tokenId
            ? `, filtered for ${
                actionQuery.assetClass
                  ? `asset class ${setToLowerCase(actionQuery.assetClass)} of`
                  : ''
              } token ${actionQuery.tokenId}`
            : ''
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing actions',
        'listAllActions',
        true,
        500,
      );
    }
  }

  @Get(':actionIndex')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveAction(
    @UserContext() userContext: IUserContext,
    @Param() actionParam: RetrieveActionParamInput,
  ): Promise<RetrieveActionOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const workflowInstance: Action =
        await this.actionHelperService.retrieveAction(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          actionParam.actionIndex,
        );

      const response: RetrieveActionOutput = {
        action: workflowInstance,
        message: `Action with index ${actionParam.actionIndex} retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving action',
        'retrieveAction',
        true,
        500,
      );
    }
  }

  @Get(':actionIndex/transition')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveHistory(
    @UserContext() userContext: IUserContext,
    @Param() actionParam: RetrieveActionParamInput,
  ): Promise<RetrieveHistoryOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const fetchedTransitionsInstances =
        await this.workflowService.listAllTransitionInstances(
          userContext[UserContextKeys.TENANT_ID],
          actionParam.actionIndex,
        );

      const response: RetrieveHistoryOutput = {
        transitions: fetchedTransitionsInstances,
        message: `Transition history of action with index ${actionParam.actionIndex} retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving transition history',
        'retrieveHistory',
        true,
        500,
      );
    }
  }
}
