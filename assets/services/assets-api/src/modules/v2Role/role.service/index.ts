import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { keys as UserKeys, UserType, User } from 'src/types/user';
import { Token } from 'src/types/token';
import { CreateLinkOutput } from 'src/types/workflow/workflowInstances/link';

import { EntityType } from 'src/types/entity';
import { LinkService } from 'src/modules/v2Link/link.service';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { AddVerifierOutput } from '../role.dto';

import { setToLowerCaseExceptFirstLetter } from 'src/utils/case';
import { FunctionName } from 'src/types/smartContract';
import { Project } from 'src/types/project';
import { Config } from 'src/types/config';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class RoleService {
  constructor(
    private readonly entityService: EntityService,
    private readonly linkService: LinkService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  /**
   * [Adding third party to entity]
   */
  async addThirdPartyToEntityAsIssuer(
    tenantId: string,
    typeFunctionUser: UserType,
    functionName: FunctionName,
    thirdPartyId: string,
    thirdPartyType: UserType,
    issuerId: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<AddVerifierOutput> {
    try {
      // Retrieve entity
      const [project, issuer, token]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntityAsIssuer(
          tenantId,
          issuerId,
          `add ${thirdPartyType.toLowerCase()} to entity ${entityType}`,
          entityId,
          entityType,
        );

      // Retrieve verifier
      const thirdParty: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        thirdPartyId,
        true,
      );

      if (thirdParty[UserKeys.USER_TYPE] !== thirdPartyType) {
        ErrorService.throwError(
          `user is not a ${thirdPartyType.toLowerCase()} (${
            thirdParty[UserKeys.USER_TYPE]
          } instead)`,
        );
      }

      if (functionName === FunctionName.KYC_ADD_NOTARY) {
        if (thirdPartyType !== UserType.NOTARY) {
          ErrorService.throwError(
            `invalid userType, third party type has to be a ${UserType.NOTARY}, but is a ${thirdPartyType} instead`,
          );
        }
      } else if (functionName === FunctionName.KYC_ADD_VERIFIER) {
        if (thirdPartyType !== UserType.VERIFIER) {
          ErrorService.throwError(
            `invalid userType, third party type has to be a ${UserType.VERIFIER}, but is a ${thirdPartyType} instead`,
          );
        }
      } else if (functionName === FunctionName.KYC_ADD_NAV_MANAGER) {
        if (thirdPartyType !== UserType.NAV_MANAGER) {
          ErrorService.throwError(
            `invalid userType, third party type has to be a ${UserType.NAV_MANAGER}, but is a ${thirdPartyType} instead`,
          );
        }
      } else {
        ErrorService.throwError(
          `invalid userType, third party type has to be a ${UserType.NOTARY}, a ${UserType.VERIFIER} or a ${UserType.NAV_MANAGER}, but is a ${thirdPartyType} instead`,
        );
      }

      // Create third party link
      const linkCreationResponse: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          typeFunctionUser,
          undefined, // idFunctionUser
          thirdParty,
          functionName, // FunctionName.KYC_ADD_NOTARY, FunctionName.KYC_ADD_VERIFIER, or FunctionName.KYC_ADD_NAV_MANAGER
          entityType,
          project, // entityProject
          issuer, // entityIssuer
          token, // entityToken
          undefined, // assetClassKey - not possible to add a third party for a specific asset class
          undefined, // wallet
        );

      return {
        link: linkCreationResponse.link,
        newLink: linkCreationResponse.newLink,
        message: `${setToLowerCaseExceptFirstLetter(thirdPartyType)} ${
          thirdParty[UserKeys.USER_ID]
        } ${
          linkCreationResponse.newLink ? 'succesfully' : 'was already'
        } added to ${entityType.toLowerCase()} ${entityId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding third party to entity',
        'addThirdPartyToEntityAsIssuer',
        false,
        500,
      );
    }
  }
}
