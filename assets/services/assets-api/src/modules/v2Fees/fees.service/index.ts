import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';
import { CreateFeesOutput, RetrieveFeesOutput } from '../fees.dto';
import { EntityType } from 'src/types/entity';
import { keys as TokenKeys, Token } from 'src/types/token';
import { Config } from 'src/types/config';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { Project } from 'src/types/project';
import {
  AssetData,
  AssetDataKeys,
  ClassData,
  ClassDataKeys,
} from 'src/types/asset';
import { Fees, FeesScope } from 'src/types/fees';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { LinkService } from 'src/modules/v2Link/link.service';
import { TokenRetrievalService } from 'src/modules/v2Token/token.service/retrieveToken';
import { keys as LinkKeys } from 'src/types/workflow/workflowInstances';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { TokenCategory } from 'src/types/smartContract';
import { setToLowerCase } from 'src/utils/case';
import { AssetElementInstance } from 'src/types/asset/elementInstance';

@Injectable()
export class FeesService {
  constructor(
    private readonly entityService: EntityService,
    private readonly linkService: LinkService,
    private readonly assetDataService: AssetDataService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly tokenRetrievalService: TokenRetrievalService,
  ) {}

  /**
   * Create/update list of orders
   */
  async createOrUpdateTokenFeesAsIssuer(
    tenantId: string,
    issuerId: string,
    tokenId: string,
    assetClassKey: string,
    investorId: string,
    fees: Fees,
    elementInstances: Array<AssetElementInstance>,
  ): Promise<CreateFeesOutput> {
    try {
      let response: CreateFeesOutput;

      const [, issuer, token]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntityAsIssuer(
          tenantId,
          issuerId,
          'create/update token fees',
          tokenId,
          EntityType.TOKEN,
        );

      const assetData: AssetData =
        this.assetDataService.retrieveAssetData(token);

      if (investorId) {
        // Check if investor is already linked to entity (e.g. investor is invited for entity)
        const investorTokenLinks: Array<Link> =
          await this.linkService.strictListAllUserEntityLinks(
            tenantId,
            investorId,
            UserType.INVESTOR,
            tokenId,
            EntityType.TOKEN,
            assetClassKey,
          );

        if (investorTokenLinks.length === 0) {
          ErrorService.throwError(
            `no link was found between investor ${investorId} and${
              assetClassKey ? ` asset class ${assetClassKey} of` : ''
            } token ${tokenId}: investor needs to be invited first`,
          );
        } else if (investorTokenLinks.length > 1) {
          ErrorService.throwError(
            `shall never happen: no unique investor link was found between investor ${investorId} and${
              assetClassKey ? ` asset class ${assetClassKey} of` : ''
            } token ${tokenId} (${investorTokenLinks.length} were found)`,
          );
        }

        const currentLink: Link = investorTokenLinks[0];
        const currentFees: Fees =
          currentLink[LinkKeys.DATA][LinkKeys.DATA__FEES];

        const updatedLink: Link =
          await this.workflowService.updateWorkflowInstance(
            tenantId,
            currentLink[LinkKeys.ID],
            undefined, // No state transition shall be triggered
            undefined, // No state transition shall be triggered
            undefined, // No state transition shall be triggered
            {
              ...currentLink,
              [LinkKeys.DATA]: {
                ...currentLink[LinkKeys.DATA],
                [LinkKeys.DATA__FEES]: fees,
              },
            },
          );

        response = {
          fees: updatedLink[LinkKeys.DATA][LinkKeys.DATA__FEES],
          scope: updatedLink[LinkKeys.ASSET_CLASS]
            ? FeesScope.ASSETCLASS_INVESTOR
            : FeesScope.TOKEN_INVESTOR,
          message: `Custom investor fees ${
            currentFees ? 'updated' : 'created'
          } successfully for ${
            updatedLink[LinkKeys.ASSET_CLASS]
              ? `asset class ${updatedLink[LinkKeys.ASSET_CLASS]} of`
              : ''
          }token with ID ${tokenId}`,
        };
      } else {
        // class fees
        if (assetClassKey) {
          const classData = assetData[AssetDataKeys.CLASS];

          const matchClassData = classData.find(
            (c) => c[ClassDataKeys.KEY] === assetClassKey,
          );

          if (!matchClassData) {
            ErrorService.throwError(
              `invalid token class: ${assetClassKey} was not found in list of asset classes`,
            );
          }
          await this.assetDataService.saveAssetData(
            tenantId,
            issuer,
            token[TokenKeys.ASSET_TEMPLATE_ID],
            token[TokenKeys.TOKEN_ID],
            elementInstances,
            {},
          );
          response = {
            elementInstances: elementInstances,
            scope: FeesScope.ASSETCLASS,
            message: `asset class fees 'updated' successfully for token with ID ${tokenId}`,
          };
        } else {
          await this.assetDataService.saveAssetData(
            tenantId,
            issuer,
            token[TokenKeys.ASSET_TEMPLATE_ID],
            token[TokenKeys.TOKEN_ID],
            elementInstances,
            {},
          );
          response = {
            elementInstances: elementInstances,
            scope: FeesScope.TOKEN,
            message: `asset class fees 'updated' successfully for token with ID ${tokenId}`,
          };
        }
      }

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating/updating token fees as issuer',
        'createOrUpdateTokenFees',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve fees for a given token
   */
  async retrieveTokenFees(
    tenantId: string,
    callerId: string,
    user: User,
    tokenId: string,
    assetClassKey: string,
    investorId: string,
  ): Promise<RetrieveFeesOutput> {
    try {
      const userType: UserType = user[UserKeys.USER_TYPE];

      let response: RetrieveFeesOutput;
      let token: Token;

      if (userType === UserType.ISSUER) {
        [, , token] = await this.entityService.retrieveEntityAsIssuer(
          tenantId,
          user[UserKeys.USER_ID],
          'retrieve token fees',
          tokenId,
          EntityType.TOKEN,
        );
      } else if (userType === UserType.INVESTOR) {
        token = await this.tokenRetrievalService.retrieveTokenIfLinkedToUser(
          tenantId,
          TokenCategory.HYBRID,
          callerId,
          user,
          tokenId,
          setToLowerCase(assetClassKey),
          false,
          false,
          false,
          false,
        );
      } else {
        ErrorService.throwError('invalid user type');
      }

      const assetData: AssetData =
        this.assetDataService.retrieveAssetData(token);

      if (investorId) {
        // Check if investor is already linked to entity (e.g. investor is invited for entity)
        let investorTokenLink: Link;
        try {
          investorTokenLink =
            await this.linkService.retrieveStrictUserEntityLink(
              tenantId,
              investorId,
              UserType.INVESTOR,
              tokenId,
              EntityType.TOKEN,
              assetClassKey,
            );
        } catch (error) {
          // In case no specific fees have been specified for this investor, it can be that there we won't find any link
          // between the investor and the asset class.
        }

        if (
          investorTokenLink &&
          investorTokenLink[LinkKeys.DATA] &&
          investorTokenLink[LinkKeys.DATA][LinkKeys.DATA__FEES]
        ) {
          response = {
            fees: investorTokenLink[LinkKeys.DATA][LinkKeys.DATA__FEES],
            scope: investorTokenLink[LinkKeys.ASSET_CLASS]
              ? FeesScope.ASSETCLASS_INVESTOR
              : FeesScope.TOKEN_INVESTOR,
            message: `Custom investor fees retrieved successfully for ${
              investorTokenLink[LinkKeys.ASSET_CLASS]
                ? `asset class ${investorTokenLink[LinkKeys.ASSET_CLASS]} of`
                : ''
            }token with ID ${tokenId}`,
          };
        }
      }

      if (!response) {
        if (assetClassKey) {
          const assetClassData: ClassData =
            this.assetDataService.retrieveAssetClassData(token, assetClassKey);
          if (assetClassData[ClassDataKeys.FEES]) {
            response = {
              fees: assetClassData[ClassDataKeys.FEES],
              scope: FeesScope.ASSETCLASS,
              message: `Fees retrieved successfully for asset class ${assetClassKey} of token with ID ${tokenId}`,
            };
          }
        } else {
          if (assetData[ClassDataKeys.FEES]) {
            response = {
              fees: assetData[ClassDataKeys.FEES],
              scope: FeesScope.TOKEN,
              message: `Fees retrieved successfully for token with ID ${tokenId}`,
            };
          }
        }
      }

      if (response) {
        return response;
      } else {
        return {
          fees: undefined,
          scope: undefined,
          message: `No fees are defined for token with ID ${tokenId}`,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token fees',
        'retrieveTokenFees',
        false,
        500,
      );
    }
  }
}
