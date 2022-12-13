/**
 * ASSET HELPER FUNCTIONS
 */

import { keys as TokenKeys, Token, TokenUnit } from 'src/types/token';
import ErrorService from 'src/utils/errorService';
import { NestJSPinoLogger } from '@consensys/observability';
import { Injectable } from '@nestjs/common';

import {
  ClassDataKeys,
  ClassData,
  AssetData,
  SubscriptionRules,
  AssetCreationFlow,
  AssetDataKeys,
} from 'src/types/asset';
import { AssetType, RawAssetTemplate } from 'src/types/asset/template';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { CycleService } from 'src/modules/v2Cycle/cycle.service';
import { AssetCycleTemplate, AssetCycleInstance } from 'src/types/asset/cycle';
import { User, UserType, keys as UserKeys } from 'src/types/user';
import { EntityType } from 'src/types/entity';
import { LinkService } from 'src/modules/v2Link/link.service';
import { getEnumValues } from 'src/utils/enumUtils';
import { TokenIdentifierEnum } from 'src/old/constants/enum';
import { AssetElementInstance } from 'src/types/asset/elementInstance';
import { TokenCategory } from 'src/types/smartContract';

@Injectable()
export class AssetDataService {
  constructor(
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly cycleService: CycleService,
    private readonly linkService: LinkService,
    private readonly logger: NestJSPinoLogger,
  ) {
    this.logger.setContext(AssetDataService.name);
  }

  /**
   * [Save asset data]
   */
  async saveAssetData(
    tenantId: string,
    user: User,
    templateId: string,
    tokenId: string,
    elementInstances: Array<AssetElementInstance>,
    data: object,
  ): Promise<{
    id: string;
    tenantId: string;
    tokenId: string;
    templateId: string;
    issuerId: string;
    elementInstances: Array<AssetElementInstance>;
  }> {
    try {
      const assetDataSaverId: string =
        await this.checkUserCanReadOrWriteAssetData(
          tenantId,
          user,
          tokenId,
          true, // writeRequired
        ); // Shall be the issuerId

      const assetDataResponse: {
        id: string;
        tenantId: string;
        tokenId: string;
        templateId: string;
        issuerId: string;
        elementInstances: Array<AssetElementInstance>;
      } = await this.apiMetadataCallService.saveAssetData(
        tenantId,
        assetDataSaverId, // shall be the issuerId
        templateId,
        tokenId,
        elementInstances,
        data,
      );
      return assetDataResponse;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'saving asset data',
        'saveAssetData',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve saved asset data]
   */
  async retrieveSavedAssetData(
    tenantId: string,
    user: User,
    templateId: string,
    tokenId: string,
  ) {
    try {
      const assetDataSaverId: string =
        await this.checkUserCanReadOrWriteAssetData(
          tenantId,
          user,
          tokenId,
          false, // writeRequired
        ); // Shall be the issuerId

      const assetDataResponse =
        await this.apiMetadataCallService.fetchAssetData(
          tenantId,
          assetDataSaverId,
          templateId,
          tokenId,
        );
      return assetDataResponse;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving saved asset data',
        'retrieveSavedAssetData',
        false,
        500,
      );
    }
  }

  /**
   * [Check user can read/write asset data]
   */
  async checkUserCanReadOrWriteAssetData(
    tenantId: string,
    user: User,
    tokenId: string,
    writeRequired: boolean,
  ): Promise<string> {
    try {
      // Retrieve token from off-chain DB
      const token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        tokenId,
        true,
        undefined,
        undefined,
        true,
      );

      const assetCreationFlow: AssetCreationFlow =
        token[TokenKeys.DATA][TokenKeys.DATA__ASSET_CREATION_FLOW];

      let assetDataSaverId: string; // Shall be the issuerId

      if (assetCreationFlow) {
        // NEW - START
        const {
          creatorId,
          reviewerId,
          issuerId,
        }: {
          assetCreationFlow: AssetCreationFlow;
          creatorId: string;
          reviewerId: string;
          issuerId: string;
        } = this.retrieveAssetCreationFlowData(
          token,
          token[TokenKeys.TOKEN_ID],
          false, // reviewerIdRequired
        );
        if (writeRequired) {
          if (
            user[UserKeys.USER_ID] !== creatorId &&
            user[UserKeys.USER_ID] !== issuerId
          ) {
            ErrorService.throwError(
              'only the asset creator or the asset issuer can save asset data',
            );
          }
        } else {
          if (
            user[UserKeys.USER_ID] !== creatorId &&
            user[UserKeys.USER_ID] !== reviewerId &&
            user[UserKeys.USER_ID] !== issuerId
          ) {
            ErrorService.throwError(
              'only the asset creator or the asset reviewer or the asset issuer can retrieve saved asset data',
            );
          }
        }

        assetDataSaverId = issuerId;
        // NEW - END
      } else {
        // DEPRECATED - START (we used to be based on the links to retrieve the first user linked to the token - this shall not be used anymore)
        await this.deprecatedcheckUserCanReadOrWriteAssetData(
          tenantId,
          user,
          token,
        );
        assetDataSaverId = token[TokenKeys.ISSUER_ID];
        // DEPRECATED - END
      }

      return assetDataSaverId;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking user can read or write asset data',
        'checkUserCanReadOrWriteAssetData',
        false,
        500,
      );
    }
  }

  /**
   * [Check user can read/write asset data]
   */
  async deprecatedcheckUserCanReadOrWriteAssetData(
    tenantId: string,
    user: User,
    token: Token,
  ): Promise<boolean> {
    try {
      const assetData: AssetData = this.retrieveAssetData(token);
      const assetType = assetData[AssetDataKeys.TYPE];

      let validUser = false;
      if (
        user[UserKeys.USER_TYPE] === UserType.ISSUER ||
        (assetType === AssetType.CARBON_CREDITS &&
          user[UserKeys.USER_TYPE] === UserType.INVESTOR)
      ) {
        const authorisedUser: User =
          await this.linkService.retrieveFirstUserLinkedToEntity(
            tenantId,
            token[TokenKeys.TOKEN_ID],
            EntityType.TOKEN,
            user[UserKeys.USER_TYPE],
          );
        if (user[UserKeys.USER_ID] === authorisedUser[UserKeys.USER_ID]) {
          validUser = true;
        }
      }

      if (!validUser) {
        ErrorService.throwError(
          `Unauthorized access: ${user[
            UserKeys.USER_TYPE
          ].toLowerCase()} with ID ${user[UserKeys.USER_ID]} is not the ${
            user[UserKeys.USER_TYPE] === UserType.ISSUER
              ? 'issuer'
              : 'unique investor'
          } of the asset with ID ${token[TokenKeys.TOKEN_ID]}`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking user can read or write asset data (deprecated)',
        'deprecatedcheckUserCanReadOrWriteAssetData',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve asset workflow instance]
   */
  retrieveAssetWorkflowInstance(token: Token): number {
    try {
      if (
        !(
          token &&
          token[TokenKeys.DATA] &&
          token[TokenKeys.DATA][TokenKeys.DATA__WORKFLOW_INSTANCE_ID]
        )
      ) {
        ErrorService.throwError(
          'invalid token (shall never happen): no workflowInstanceId stored in data',
        );
      }

      return Number(
        token[TokenKeys.DATA][TokenKeys.DATA__WORKFLOW_INSTANCE_ID],
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset workflow instance',
        'retrieveAssetWorkflowInstance',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve asset status]
   */
  async retrieveAssetTypeAndTokenCategoryFromTemplate(
    tenantId: string,
    assetTemplateId: string,
  ): Promise<{
    assetType: AssetType;
    tokenCategory: TokenCategory;
  }> {
    try {
      const assetTemplate: RawAssetTemplate =
        await this.apiMetadataCallService.fetchAssetTemplate(
          tenantId,
          assetTemplateId,
        );

      let assetType: AssetType;
      if (assetTemplate && assetTemplate.type) {
        assetType = assetTemplate.type;
      }

      if (
        assetType !== AssetType.PHYSICAL_ASSET &&
        assetType !== AssetType.CLOSED_END_FUND &&
        assetType !== AssetType.OPEN_END_FUND &&
        assetType !== AssetType.SYNDICATED_LOAN &&
        assetType !== AssetType.FIXED_RATE_BOND &&
        assetType !== AssetType.CARBON_CREDITS &&
        assetType !== AssetType.CURRENCY &&
        assetType !== AssetType.COLLECTIBLE
      ) {
        ErrorService.throwError(
          `asset template with ID ${assetTemplateId} has unknown asset type (${assetType}): it shall be equal to ${AssetType.PHYSICAL_ASSET}, ${AssetType.CLOSED_END_FUND}, ${AssetType.OPEN_END_FUND}, ${AssetType.SYNDICATED_LOAN}, ${AssetType.FIXED_RATE_BOND}, ${AssetType.CURRENCY}, ${AssetType.COLLECTIBLE} or ${AssetType.CARBON_CREDITS}`,
        );
      }

      const tokenCategory: TokenCategory = assetTemplate.category;

      if (
        tokenCategory !== TokenCategory.HYBRID &&
        tokenCategory !== TokenCategory.FUNGIBLE &&
        tokenCategory !== TokenCategory.NONFUNGIBLE
      ) {
        ErrorService.throwError(
          `asset template with ID ${assetTemplateId} has unknown token category (${tokenCategory}): it shall be equal to ${TokenCategory.HYBRID}, ${TokenCategory.FUNGIBLE} or ${TokenCategory.NONFUNGIBLE}`,
        );
      }

      return {
        assetType,
        tokenCategory,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset type and token category from template',
        'retrieveAssetTypeAndCategoryFromTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve asset data]
   */
  retrieveAssetData(token: Token): AssetData {
    try {
      if (!token[TokenKeys.ASSET_DATA]) {
        ErrorService.throwError(
          `token with id ${token[TokenKeys.TOKEN_ID]} has no asset data`,
        );
      }

      const assetData: AssetData = token[TokenKeys.ASSET_DATA];

      return assetData;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset data',
        'retrieveAssetData',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve asset type]
   */
  async retrieveAssetType(tenantId: string, token: Token): Promise<AssetType> {
    try {
      if (!token[TokenKeys.ASSET_DATA]) {
        ErrorService.throwError(
          `token with id ${token[TokenKeys.TOKEN_ID]} has no asset data`,
        );
      }
      if (!token[TokenKeys.ASSET_TEMPLATE_ID]) {
        ErrorService.throwError(
          `token with id ${
            token[TokenKeys.TOKEN_ID]
          } is not linked to an asset template`,
        );
      }

      const { assetType } =
        await this.retrieveAssetTypeAndTokenCategoryFromTemplate(
          tenantId,
          token[TokenKeys.ASSET_TEMPLATE_ID],
        );

      return assetType;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset type',
        'retrieveAssetType',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve asset class data]
   */
  retrieveAssetClassData(token: Token, assetClassKey: string): ClassData {
    try {
      if (!token[TokenKeys.ASSET_DATA]) {
        ErrorService.throwError(
          `token with id ${token[TokenKeys.TOKEN_ID]} has no asset data`,
        );
      }
      const assetData: AssetData = token[TokenKeys.ASSET_DATA];

      if (
        !(
          token[TokenKeys.ASSET_CLASSES] &&
          token[TokenKeys.ASSET_CLASSES].length > 0
        )
      ) {
        ErrorService.throwError('invalid token data: empty asset classes list');
      }
      if (
        !token[TokenKeys.ASSET_CLASSES].find(
          (assetClass: string) => assetClass === assetClassKey,
        )
      ) {
        ErrorService.throwError(
          `invalid token class: ${assetClassKey} was not found in list of token classes ${JSON.stringify(
            token[TokenKeys.ASSET_CLASSES],
          )}`,
        );
      }

      const classData = assetData[AssetDataKeys.CLASS];
      if (!(classData && classData.length > 0)) {
        ErrorService.throwError('invalid asset data: empty asset classes list');
      }

      const matchClassData: ClassData = classData.find(
        (assetClass: ClassData) =>
          assetClass[ClassDataKeys.KEY] === assetClassKey,
      );
      if (!matchClassData) {
        ErrorService.throwError(
          'invalid token class: was not found in list of asset classes',
        );
      }

      return matchClassData;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset class data',
        'retrieveAssetClassData',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve asset creation flow (single-party VS bi-party VS tri-party)]
   */
  retrieveAssetCreationFlowData(
    token: Token,
    assetId: string,
    reviewerIdRequired: boolean,
  ): {
    assetCreationFlow: AssetCreationFlow;
    creatorId: string;
    reviewerId: string;
    issuerId: string;
  } {
    try {
      const assetCreationFlow: AssetCreationFlow =
        token[TokenKeys.DATA][TokenKeys.DATA__ASSET_CREATION_FLOW];
      if (!assetCreationFlow) {
        ErrorService.throwError(
          `shall never happen: asset creation flow is not defined for asset ${assetId} [This can be the case for some deprecated assets created prior december 2021]`,
        );
      }

      const validAssetCreationFlows: Array<AssetCreationFlow> =
        getEnumValues(AssetCreationFlow);
      if (!validAssetCreationFlows.includes(assetCreationFlow)) {
        ErrorService.throwError(
          `invalid asset creation flow type (${assetCreationFlow}): shall be chosen amongst ${validAssetCreationFlows.join(
            ', ',
          )}`,
        );
      }

      const creatorId: string = token[TokenKeys.CREATOR_ID];
      if (!creatorId) {
        ErrorService.throwError(
          'shall never happen: no creator id defined in asset data',
        );
      }

      const issuerId: string = token[TokenKeys.ISSUER_ID];
      if (!issuerId) {
        ErrorService.throwError(
          'shall never happen: no issuer id defined in asset data',
        );
      }

      const reviewerId: string = token[TokenKeys.REVIEWER_ID];

      if (
        assetCreationFlow === AssetCreationFlow.TRI_PARTY &&
        reviewerIdRequired &&
        !reviewerId
      ) {
        ErrorService.throwError(
          `shall never happen: no reviewer id defined in asset data (although it's mandatory for an asset creation flow of type ${assetCreationFlow})`,
        );
      }

      return {
        assetCreationFlow,
        creatorId,
        reviewerId,
        issuerId,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset creation flow',
        'retrieveAssetCreationFlow',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve asset class rules]
   */
  retrieveAssetClassRules(
    classData: ClassData,
    assetClassKey: string,
  ): SubscriptionRules {
    try {
      if (!classData[ClassDataKeys.RULES]) {
        ErrorService.throwError(
          `shall never happen: rules are not set for asset class ${assetClassKey}`,
        );
      }

      return classData[ClassDataKeys.RULES];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset class rules',
        'retrieveAssetClassRules',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve asset/token Unit]
   */
  retrieveTokenUnit(token: Token, classDataKey: string): TokenUnit {
    try {
      const classData = token?.[TokenKeys.ASSET_DATA]?.[AssetDataKeys.CLASS];
      const matchClassData = classData?.find(
        (assetClass) => assetClass[ClassDataKeys.KEY] === classDataKey,
      );
      const tokenUnit: TokenUnit = matchClassData?.[ClassDataKeys.TOKEN_UNIT];

      return tokenUnit || TokenUnit.token;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset/token Unit',
        'retrieveTokenUnit',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve asset cycle template]
   */
  retrieveAssetCycleTemplate(
    assetType: AssetType,
    cycle: AssetCycleInstance,
    assetClassData: ClassData,
  ): [AssetCycleTemplate, string] {
    try {
      // Extract cycle template from asset class data
      let assetCycleTemplate: AssetCycleTemplate;
      let templateLabel: string;
      if (
        this.cycleService.isInitialSubscriptionCycle(
          assetType,
          cycle,
          assetClassData,
        )
      ) {
        assetCycleTemplate =
          this.cycleService.retrieveInitialSubscriptionCycleTemplate(
            assetType,
            assetClassData,
          );
        templateLabel = 'initial subscription cycle';
      } else if (
        assetType === AssetType.CLOSED_END_FUND ||
        assetType === AssetType.OPEN_END_FUND ||
        assetType === AssetType.FIXED_RATE_BOND
      ) {
        assetCycleTemplate =
          this.cycleService.retrieveSubsequentSubscriptionCycleTemplate(
            assetType,
            assetClassData,
          );
        templateLabel = 'subsequent subscription cycle';
      } else {
        ErrorService.throwError(
          "shall never happen: cycle is not the initial subscription cycle, while asset type doesn't support multiple cycles",
        );
      }

      return [assetCycleTemplate, templateLabel];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset class rules',
        'retrieveAssetClassRules',
        false,
        500,
      );
    }
  }
}
