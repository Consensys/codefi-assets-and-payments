import {
  TokenIdentifierEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';

import ErrorService from 'src/utils/errorService';

import { Injectable } from '@nestjs/common';

import { keys as TokenKeys, Token } from 'src/types/token';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import {
  ClassDataKeys,
  SubscriptionRules,
  ClassData,
  AssetDataKeys,
  assetClassRules,
  AssetClassRule,
} from 'src/types/asset';

import { keys as CycleKeys, AssetCycleInstance } from 'src/types/asset/cycle';
import { NavStatus, NAV } from 'src/types/workflow/workflowInstances/nav';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  keys as NavKeys,
  PrimaryTradeType,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import {
  keys as WorkflowTemplateKeys,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import { CycleService } from 'src/modules/v2Cycle/cycle.service';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { LinkService } from 'src/modules/v2Link/link.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { FunctionName } from 'src/types/smartContract';
import { EntityType } from 'src/types/entity';
import { CreateNavOutput, MAX_NAV_COUNT } from '../nav.dto';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { AssetType } from 'src/types/asset/template';
import { Project } from 'src/types/project';
import { Config } from 'src/types/config';
import { NestJSPinoLogger } from '@consensys/observability';
import {
  Field,
  FieldComparator,
  Paginate,
} from 'src/modules/v2ApiCall/api.call.service/query';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

export interface FindNavOptions {
  tenantId: string;
  assetId: string;
  assetClassKey: string;
  skip: number;
  limit: number;
  maxDate: Date;
  filterValidatedNavs: boolean;
}

@Injectable()
export class NavService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly entityService: EntityService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly cycleService: CycleService,
    private readonly assetDataService: AssetDataService,
    private readonly linkService: LinkService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
  ) {}

  /**
   * [Create new value for the NAV of an asset]
   *
   * This function can only be called by the issuer of the token.
   * It starts (and finalizes at the same time) a nav-workflow (nav).
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: NAV_VALIDATED
   */
  async createNav(
    tenantId: string,
    idempotencyKey: string,
    typeFunctionUser: UserType,
    issuerId: string,
    tokenId: string,
    newNavValue: number,
    newNavDate: Date,
    assetClassKey?: string,
    data?: any,
  ): Promise<CreateNavOutput> {
    try {
      const functionName: FunctionName = FunctionName.CREATE_NAV;

      // Preliminary step: Fetch all required data in databases

      const issuer: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        issuerId,
        true,
      );

      // Check if user is manager for the token (if yes, retrieve token)
      const [, , token]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntityIfAuthorized(
          tenantId,
          issuerId,
          'create NAV',
          tokenId,
          EntityType.TOKEN,
        );

      // Check if asset class data is correctly formatted
      const assetClassData: ClassData = assetClassKey
        ? this.assetDataService.retrieveAssetClassData(token, assetClassKey)
        : undefined;

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        WorkflowName.NAV,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // createNav
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
        issuer[UserKeys.USER_ID],
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
        assetClassData ? assetClassData[ClassDataKeys.KEY] : undefined, // assetClass (or 'undefined' for global token NAV)
        newNavDate ? new Date(newNavDate) : new Date(),
        nextState, // NavWorkflow.NAV_VALIDATED,
        undefined, //offerId
        undefined, //orderSide
        data,
      );

      return {
        nav: navData,
        message: `Nav value ${navData[NavKeys.QUANTITY]} created successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating NAV',
        'createNav',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve list of all NAVs for a given token, as an investor]
   */
  async listAllNavsAsInvestor({
    tenantId,
    assetId,
    assetClassKey,
    skip,
    limit,
  }: FindNavOptions): Promise<Paginate<NAV>> {
    try {
      const token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        assetId,
        true,
        undefined,
        undefined,
        true,
      );

      return this.listAllSortedNavsForAssetClass({
        tenantId,
        assetId,
        assetClassKey,
        skip,
        limit,
        token,
        maxDate: undefined,
        filterValidatedNavs: true,
      });
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving list of NAVs as an investor',
        'listAllNavsAsInvestor',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve list of all NAVs for a given token, as an issuer]
   */
  async listAllNavsAsIssuer({
    tenantId,
    assetId,
    assetClassKey,
    skip,
    limit,
    filterValidatedNavs,
    issuerId,
  }: FindNavOptions & { issuerId: string }): Promise<Paginate<NAV>> {
    try {
      // FIXME we need to paginate this endpoint too
      const [issuer]: [User, Token] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          assetId,
          EntityType.TOKEN,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          assetId,
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

      return this.listAllNavs({
        tenantId,
        assetId,
        assetClassKey,
        skip,
        limit,
        maxDate: undefined,
        filterValidatedNavs,
      });
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving list of NAVs as an issuer',
        'listAllNavsAsIssuer',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve list of all NAVs for a given token]
   */
  async listAllNavs({
    tenantId,
    assetId,
    assetClassKey, // set to 'undefined', to retrieve global token NAV (when relevant)
    maxDate = new Date(),
    skip = 0,
    limit = MAX_NAV_COUNT,
    filterValidatedNavs,
  }: FindNavOptions): Promise<Paginate<NAV>> {
    try {
      const filters: Array<Field> = [
        {
          name: NavKeys.ENTITY_ID,
          comparator: FieldComparator.EQUALS,
          value: assetId,
        },
        {
          name: NavKeys.TYPE,
          comparator: FieldComparator.EQUALS,
          value: WorkflowType.NAV,
        },
        {
          name: NavKeys.DATE,
          comparator: FieldComparator.LESS_THAN,
          value: maxDate.toISOString(),
        },
      ];

      if (assetClassKey) {
        filters.push({
          name: NavKeys.ASSET_CLASS,
          comparator: FieldComparator.EQUALS,
          value: assetClassKey,
        });
      } else {
        filters.push({
          name: NavKeys.ASSET_CLASS,
          comparator: FieldComparator.NULL,
          value: '',
        }); // keeps nav objects with "nav.assetClass === null"
      }

      if (filterValidatedNavs) {
        filters.push({
          name: NavKeys.STATE,
          comparator: FieldComparator.EQUALS,
          value: NavStatus.NAV_VALIDATED,
        });
      }

      const { items: navs, total } = await this.workflowService.findAll<NAV>({
        tenantId,
        filters,
        skip,
        limit,
        order: [{ date: 'DESC' }], // This sorts nav array: [newest nav, ..., oldest nav]
      });

      return { items: navs, total };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving list of NAVs',
        'listAllNavs',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve list of all NAVs for a given cycle]
   */
  async listAllNavsForCycle(
    tenantId: string,
    assetId: string,
    assetClassKey: string,
    cycle: AssetCycleInstance,
  ): Promise<Paginate<NAV>> {
    try {
      let maxDate: Date = this.cycleService.retrieveCycleDate(
        cycle,
        CycleKeys.VALUATION_DATE,
      );

      if (!maxDate) {
        // shall never happen as valuation date is always defiened at cycle creation
        maxDate = new Date(); // now
      }

      return this.listAllNavs({
        tenantId,
        assetId,
        assetClassKey,
        skip: undefined,
        limit: undefined,
        maxDate,
        filterValidatedNavs: true,
      });
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving list of NAVs for a given cycle',
        'listAllNavsForCycle',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve list of all NAVs for a given asset class, sorted from newest to oldest]
   */
  async listAllSortedNavsForAssetClass({
    tenantId,
    assetId,
    assetClassKey, // set to 'undefined', to retrieve global token NAV (when relevant)
    skip,
    limit,
    token,
  }: FindNavOptions & { token: Token }): Promise<Paginate<NAV>> {
    try {
      let navDatas: Paginate<NAV>;

      if (!assetClassKey) {
        navDatas = await this.listAllNavs({
          tenantId,
          assetId,
          assetClassKey: undefined,
          skip,
          limit,
          maxDate: undefined,
          filterValidatedNavs: true,
        });
      } else if (!token[TokenKeys.ASSET_DATA]) {
        navDatas = await this.listAllNavs({
          tenantId,
          assetId,
          assetClassKey,
          skip,
          limit,
          maxDate: undefined,
          filterValidatedNavs: true,
        });
      } else {
        const assetType: AssetType =
          await this.assetDataService.retrieveAssetType(tenantId, token);
        const assetClassData: ClassData =
          this.assetDataService.retrieveAssetClassData(token, assetClassKey);
        let subscriptionRules: SubscriptionRules;
        if (
          assetClassRules[assetType][AssetClassRule.KEYS_TO_CHECK].indexOf([
            ClassDataKeys.RULES,
          ]) > -1
        ) {
          subscriptionRules = this.assetDataService.retrieveAssetClassRules(
            assetClassData,
            assetClassKey,
          );
        }

        const tokenIsDeployed: boolean = token[TokenKeys.DEFAULT_DEPLOYMENT]
          ? true
          : false;

        let subscriptionAssetCycle: AssetCycleInstance;
        // Check if cycle exists. If not, create one
        if (tokenIsDeployed) {
          [subscriptionAssetCycle] = await Promise.all([
            this.cycleService.retrieveOrCreateCurrentCycle(
              tenantId,
              token[TokenKeys.TOKEN_ID],
              assetType,
              assetClassData,
              PrimaryTradeType.SUBSCRIPTION,
            ),
            this.cycleService.retrieveOrCreateCurrentCycle(
              tenantId,
              token[TokenKeys.TOKEN_ID],
              assetType,
              assetClassData,
              PrimaryTradeType.REDEMPTION,
            ),
          ]);
        }

        navDatas = subscriptionAssetCycle
          ? await this.listAllNavsForCycle(
              tenantId,
              token[TokenKeys.TOKEN_ID],
              assetClassKey,
              subscriptionAssetCycle,
            )
          : await this.listAllNavs({
              tenantId,
              assetId: token[TokenKeys.TOKEN_ID],
              assetClassKey,
              skip: undefined,
              limit: undefined,
              maxDate: undefined,
              filterValidatedNavs: true,
            });
      }

      return navDatas;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving list of sorted NAVs for a given asset class',
        'listAllSortedNavsForAssetClass',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve appropriate NAV for a given cycle]
   */
  async retrieveAppropriateNAVForCycle(
    tenantId: string,
    assetId: string,
    assetClassKey: string,
    cycle: AssetCycleInstance,
  ): Promise<NAV> {
    try {
      const { items: allNAVData } = await this.listAllNavsForCycle(
        tenantId,
        assetId,
        assetClassKey,
        cycle,
      );

      // NAVs are sorted from newest to oldest NAV, we select the newest one [newest NAV, ..., oldest NAV]
      return allNAVData.length > 0 ? allNAVData[0] : undefined;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving appropriate NAV for a given cycle',
        'retrieveAppropriateNAVForCycle',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve appropriate NAV for a given asset class]
   */
  async retrieveAppropriateNAVForAssetClass(
    tenantId: string,
    token: Token,
    assetClassKey: string, // set to 'undefined', to retrieve global token NAV (when relevant)
  ): Promise<NAV> {
    const tokenId: string = token[TokenKeys.TOKEN_ID];
    try {
      const { items: filteredNAVData } =
        await this.listAllSortedNavsForAssetClass({
          tenantId,
          assetId: tokenId,
          assetClassKey,
          skip: undefined,
          limit: undefined,
          maxDate: undefined,
          filterValidatedNavs: true,
          token,
        });

      // NAVs are sorted from newest to oldest NAV, we select the newest one [newest NAV, ..., oldest NAV]
      return filteredNAVData.length > 0 ? filteredNAVData[0] : undefined;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving appropriate NAV for a given asset class',
        'retrieveAppropriateNAVForAssetClass',
        false,
        500,
      );
    }
  }

  /**
   * [Append appropriate NAV to token if existing]
   */
  async appendAppropriateNAVToTokenIfExisting(
    tenantId: string,
    token: Token,
  ): Promise<Token> {
    try {
      const globalTokenNav: NAV =
        await this.retrieveAppropriateNAVForAssetClass(
          tenantId,
          token,
          undefined,
        );

      if (globalTokenNav) {
        const tokenData: any = token[TokenKeys.DATA]
          ? token[TokenKeys.DATA]
          : {};
        token[TokenKeys.DATA] = tokenData;

        token[TokenKeys.DATA][TokenKeys.DATA__GLOBAL_NAV] = globalTokenNav
          ? globalTokenNav[NavKeys.QUANTITY]
          : undefined;
      }

      return token;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'appending appropriate NAV to token if existing',
        'appendAppropriateNAVToTokenIfExisting',
        false,
        500,
      );
    }
  }

  /**
   * [Append appropriate NAV to token if existing]
   */
  async appendAppropriateNAVToAssetClassesIfExisting(
    tenantId: string,
    token: Token,
  ): Promise<Token> {
    try {
      const classData = token[TokenKeys.ASSET_DATA]?.[AssetDataKeys.CLASS];
      if (classData && classData.length > 0) {
        const assetClassesDataWithNav: Array<ClassData> = await Promise.all(
          classData.map((assetClassData: ClassData) => {
            const classKey = assetClassData[ClassDataKeys.KEY];

            if (!classKey) {
              ErrorService.throwError(
                `missing asset class key for class ${
                  assetClassData[ClassDataKeys.NAME]
                } of token ${token[TokenKeys.TOKEN_ID]}`,
              );
            }

            return this.retrieveAppropriateNAVForAssetClass(
              tenantId,
              token,
              classKey,
            ).then((assetClassNav: NAV) => {
              return {
                ...assetClassData,
                [ClassDataKeys.NAV]: {
                  ...assetClassData[ClassDataKeys.NAV],
                  [ClassDataKeys.NAV__VALUE]: assetClassNav
                    ? assetClassNav[NavKeys.QUANTITY]
                    : undefined,
                },
              };
            });
          }),
        );

        token[TokenKeys.ASSET_DATA][AssetDataKeys.CLASS] =
          assetClassesDataWithNav;
      }

      return token;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'appending appropriate NAV to asset class if existing',
        'appendAppropriateNAVToAssetClassesIfExisting',
        false,
        500,
      );
    }
  }
}
