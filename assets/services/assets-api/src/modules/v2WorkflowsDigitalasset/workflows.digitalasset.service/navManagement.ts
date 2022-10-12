/**
 * NAV WORKFLOW
 *
 * -- Off-chain action-workflow --
 *
 * The NAV workflow allows a NAV manager to update the NAV of a token:
 *  1) Submit a new NAV
 *  2) Validate NAV
 *
 *      submitNav     _______________    validateNav   _______________
 *         -->       | NAV_SUBMITTED |      -->       | NAV_VALIDATED |
 *    [nav manager]   ---------------     [issuer]     ---------------
 */
import {
  WorkflowInstanceEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';

import { keys as TokenKeys, Token } from 'src/types/token';
import ErrorService from 'src/utils/errorService';
import { keys as UserKeys, User, UserType } from 'src/types/user';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import { Injectable } from '@nestjs/common';

import { FunctionName, TokenCategory } from 'src/types/smartContract';
import { ClassDataKeys, ClassData } from 'src/types/asset';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';

import { EntityType } from 'src/types/entity';

import {
  keys as NavKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';

import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import {
  SubmitNavOutput,
  ValidateNavOutput,
  RejectNavOutput,
} from '../workflows.digitalasset.dto';
import {
  keys as WorkflowTemplateKeys,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';
import { NAV } from 'src/types/workflow/workflowInstances/nav';
import { Project } from 'src/types/project';
import { Config } from 'src/types/config';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.NAV;

@Injectable()
export class WorkFlowsNavManagementService {
  constructor(
    private readonly entityService: EntityService,
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly assetDataService: AssetDataService,
  ) {}

  /**
   * [Submit new value for the NAV of an asset]
   *
   * This function can only be called by an NAV manager.
   * It starts a new nav-workflow (nav).
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: NAV_SUBMITTED
   */
  async submitNav(
    tenantId: string,
    idempotencyKey: string,
    typeFunctionUser: UserType,
    navManagerId: string,
    tokenId: string,
    assetClassKey: string,
    newNavValue: number,
    newNavDate: Date,
    data?: any,
  ): Promise<SubmitNavOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.SUBMIT_NAV;

      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Idempotency
      const navWithSameKey: NAV =
        await this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.NAV,
          idempotencyKey,
        );
      if (navWithSameKey) {
        // NAV was already created (idempotency)
        return {
          nav: navWithSameKey,
          created: false,
          message: `Nav value ${
            navWithSameKey[NavKeys.QUANTITY]
          } submission was already done (idempotencyKey)`,
        };
      }

      // Preliminary step: Fetch all required data in databases

      const navManager: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        navManagerId,
        true,
      );

      // Check if user is manager for the token (if yes, retrieve token)
      const [, , token]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntityIfAuthorized(
          tenantId,
          navManagerId,
          'submit NAV',
          tokenId,
          EntityType.TOKEN,
        );

      // Check if asset class data is correctly formatted
      const assetClassData: ClassData =
        this.assetDataService.retrieveAssetClassData(token, assetClassKey);

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // submitNav
      );

      // Create workflow instance in Workflow-API
      const navWorkflowId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          WorkflowName.NAV,
        )
      )[WorkflowTemplateKeys.ID];
      // FIXME: store NAV value in object ID
      const navData: NAV = await this.workflowService.createWorkflowInstance(
        tenantId,
        idempotencyKey,
        WorkflowType.NAV,
        functionName,
        typeFunctionUser,
        navManager[UserKeys.USER_ID],
        token[TokenKeys.TOKEN_ID],
        EntityType.TOKEN,
        undefined, // objectId
        undefined, // recipientId
        undefined, // brokerId
        undefined, // agentId
        navWorkflowId,
        newNavValue, // quantity
        undefined, // price
        undefined, // documentId
        undefined, // wallet - not relevant for NAV
        assetClassData[ClassDataKeys.KEY], // assetClass
        newNavDate ? new Date(newNavDate) : new Date(),
        nextState, // NavWorkflow.NAV_SUBMITTED,
        undefined, //offerId
        undefined, //orderSide
        data,
      );

      return {
        nav: navData,
        created: true,
        message: `Nav value ${
          navData[NavKeys.QUANTITY]
        } submitted successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting NAV',
        'submitNav',
        false,
        500,
      );
    }
  }

  /**
   * [Validate NAV of an asset]
   *
   * This function can only be called by the issuer of the token.
   * It can only be called for a nav-workflow (nav) in state NAV_SUBMITTED.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NAV_SUBMITTED
   *  - Destination state: NAV_VALIDATED
   */
  async validateNav(
    tenantId: string,
    typeFunctionUser: UserType,
    issuerId: string,
    navId: string,
  ): Promise<ValidateNavOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.VALIDATE_NAV;

      const navData: NAV = await this.workflowService.retrieveWorkflowInstances(
        tenantId,
        WorkflowInstanceEnum.id,
        Number(navId),
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        WorkflowType.NAV,
        undefined, // otherWorkflowType
        true,
      );

      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      // Retrieve entity
      const [, , token]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntityIfAuthorized(
          tenantId,
          issuerId,
          'validate NAV',
          navData[NavKeys.ENTITY_ID],
          EntityType.TOKEN,
        );

      // Verify asset class data is formatted successfully
      this.assetDataService.retrieveAssetClassData(
        token,
        navData[NavKeys.ASSET_CLASS],
      );

      // Idempotency
      if (navData[NavKeys.STATE] === 'navValidated') {
        // NAV has already been validated, return NAV without updating it (idempotency)
        return {
          nav: navData,
          updated: false,
          message: 'NAV validation was already done',
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        navData[NavKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // validateNav
      );

      const updatedNavData: NAV =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          navData[NavKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          navData,
        );

      return {
        nav: updatedNavData,
        updated: true,
        message: `Nav value ${
          updatedNavData[NavKeys.QUANTITY]
        } validated successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'validating NAV',
        'validateNav',
        false,
        500,
      );
    }
  }

  /**
   * [Reject NAV of an asset]
   *
   * This function can only be called by the issuer of the token.
   * It can only be called for a nav-workflow (nav) in state NAV_SUBMITTED.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NAV_SUBMITTED
   *  - Destination state: NAV_REJECTED
   */
  async rejectNav(
    tenantId: string,
    typeFunctionUser: UserType,
    issuerId: string,
    navId: string,
    comment: string,
  ): Promise<RejectNavOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.REJECT_NAV;

      const navData: NAV = await this.workflowService.retrieveWorkflowInstances(
        tenantId,
        WorkflowInstanceEnum.id,
        Number(navId),
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        WorkflowType.NAV,
        undefined, // otherWorkflowType
        true,
      );

      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      // Retrieve entity
      const [, , token]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntityIfAuthorized(
          tenantId,
          issuerId,
          'reject NAV',
          navData[NavKeys.ENTITY_ID],
          EntityType.TOKEN,
        );

      // Verify asset class data is formatted successfully
      this.assetDataService.retrieveAssetClassData(
        token,
        navData[NavKeys.ASSET_CLASS],
      );

      // Idempotency
      if (navData[NavKeys.STATE] === 'navRejected') {
        // NAV has already been rejected, return NAV without updating it (idempotency)
        return {
          nav: navData,
          updated: false,
          message: 'NAV rejection was already done',
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        navData[NavKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // rejectNav
      );

      const updatedNavData: NAV =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          navData[NavKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          {
            ...navData,
            [NavKeys.DATA]: {
              ...navData[NavKeys.DATA],
              [NavKeys.COMMENT]: comment,
            },
          },
        );

      return {
        nav: updatedNavData,
        updated: true,
        message: `Nav value ${
          updatedNavData[NavKeys.QUANTITY]
        } rejected successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting NAV',
        'rejectNav',
        false,
        500,
      );
    }
  }
}
