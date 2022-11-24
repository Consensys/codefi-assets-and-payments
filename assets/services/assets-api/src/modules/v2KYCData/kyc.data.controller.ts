import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  HttpCode,
  Put,
  UseFilters,
} from '@nestjs/common';

import { KYCDataService } from './kyc.data.service';

import ErrorService from 'src/utils/errorService';

import {
  SaveKycDataAsSubmitterBodyInput,
  SaveKycDataAsSubmitterOutput,
  ListTokenRelatedKycDataForSubmitterOutput,
  ListTokenRelatedKycDataForSubmitterQueryInput,
  ListTokenRelatedKycDataForReviewerOutput,
  ListTokenRelatedKycDataForReviewerQueryInput,
  ListIssuerRelatedKycDataForSubmitterQueryInput,
  ListIssuerRelatedKycDataForSubmitterOutput,
  ListIssuerRelatedKycDataForReviewerQueryInput,
  ListIssuerRelatedKycDataForReviewerOutput,
  DeleteTokenRelatedKycDataQueryInput,
  DeleteKycDataOutput,
  DeleteIssuerRelatedKycDataQueryInput,
  ListIssuerRelatedKycDataForThirdPartyQueryInput,
  ListProjectRelatedKycDataForSubmitterQueryInput,
  ListProjectRelatedKycDataForSubmitterOutput,
  ListProjectRelatedKycDataForReviewerQueryInput,
  ListProjectRelatedKycDataForReviewerOutput,
  DeleteProjectRelatedKycDataQueryInput,
  ListPlatformRelatedKycDataForSubmitterOutput,
  ListPlatformRelatedKycDataForAdminQueryInput,
  ListPlatformRelatedKycDataForAdminOutput,
  DeletePlatformRelatedKycDataQueryInput,
  SaveKycDataAsReviewerBodyInput,
  SaveKycDataAsReviewerOutput,
} from './kyc.data.dto';
import {
  extractUsertypeFromContext,
  IUserContext,
  keys as UserContextKeys,
} from 'src/types/userContext';
import { EntityType } from 'src/types/entity';
import { KycReview } from 'src/types/kyc/review';
import { UserType } from 'src/types/user';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { KycDataResponse } from 'src/types/kyc/data';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/essentials/kyc/data')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class KYCEssentialDataController {
  constructor(private readonly kycDataService: KYCDataService) {}

  /**
   * Save kyc data as submitter
   * This function is used to create KYC element instances in the KYC DB.
   */
  @Post()
  @HttpCode(201)
  @Protected(true, [])
  async saveKycDataAsSubmitter(
    @UserContext() userContext: IUserContext,
    @Body() dataBody: SaveKycDataAsSubmitterBodyInput,
  ): Promise<SaveKycDataAsSubmitterOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: SaveKycDataAsSubmitterOutput =
        await this.kycDataService.createKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          userContext[UserContextKeys.EMAIL],
          dataBody.elements,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'saving KYC data as submitter',
        'saveKycDataAsSubmitter',
        true,
        500,
      );
    }
  }

  /**
   * Save kyc data as reviewer
   * This function is used to create KYC element reviews in the KYC DB.
   */
  @Put()
  @HttpCode(200)
  @Protected(true, [])
  async saveKycDataAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() dataBody: SaveKycDataAsReviewerBodyInput,
  ): Promise<SaveKycDataAsReviewerOutput> {
    try {
      const typeFunctionUser: UserType =
        extractUsertypeFromContext(userContext);

      if (
        !(
          typeFunctionUser === UserType.ISSUER ||
          typeFunctionUser === UserType.VERIFIER ||
          typeFunctionUser === UserType.UNDERWRITER ||
          typeFunctionUser === UserType.BROKER
        )
      ) {
        ErrorService.throwError(
          `KYC data can only be updated by users of type ${UserType.ISSUER}, ${UserType.VERIFIER}, ${UserType.UNDERWRITER} or ${UserType.BROKER}`,
        );
      }

      if (!(dataBody.reviews && dataBody.reviews.length > 0)) {
        ErrorService.throwError(
          'invalid input, array of reviews shall not be empty',
        );
      }

      // FIXME: check that the reviewer performing those reviews is allowed to modify those specific reviews
      const updatedReviews: Array<KycReview> =
        await this.kycDataService.updateKycReviews(
          userContext[UserContextKeys.TENANT_ID],
          dataBody.reviews,
        );

      return {
        reviews: updatedReviews,
        message: `${updatedReviews.length} KYC element reviews(s) saved successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'saving KYC data as reviewer',
        'saveKycDataAsReviewer',
        true,
        500,
      );
    }
  }

  @Get('/token-related/submitter')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveTokenRelatedKycDataForSubmitter(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListTokenRelatedKycDataForSubmitterQueryInput,
  ): Promise<ListTokenRelatedKycDataForSubmitterOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForSubmitter(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // submitterId
          dataQuery.tokenId, // entityId
          EntityType.TOKEN,
          dataQuery.assetClass,
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token-related KYC data for submitter',
        'retrieveTokenRelatedKycDataForSubmitter',
        true,
        500,
      );
    }
  }

  @Get('/token-related/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveTokenRelatedKycDataForReviewer(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListTokenRelatedKycDataForReviewerQueryInput,
  ): Promise<ListTokenRelatedKycDataForReviewerOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          dataQuery.tokenId, // entityId
          EntityType.TOKEN,
          dataQuery.assetClass,
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token-related KYC data for reviewer',
        'retrieveTokenRelatedKycDataForReviewer',
        true,
        500,
      );
    }
  }

  @Get('/token-related/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveTokenRelatedKycDataForVerifier(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListTokenRelatedKycDataForReviewerQueryInput,
  ): Promise<ListTokenRelatedKycDataForReviewerOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          dataQuery.tokenId, // entityId
          EntityType.TOKEN,
          dataQuery.assetClass,
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token-related KYC data for verifier',
        'retrieveTokenRelatedKycDataForVerifier',
        true,
        500,
      );
    }
  }

  @Get('/token-related/underwriter')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveTokenRelatedKycDataForUnderwriter(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListTokenRelatedKycDataForReviewerQueryInput,
  ): Promise<ListTokenRelatedKycDataForReviewerOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          dataQuery.tokenId, // entityId
          EntityType.TOKEN,
          dataQuery.assetClass,
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token-related KYC data for underwriter',
        'retrieveTokenRelatedKycDataForUnderwriter',
        true,
        500,
      );
    }
  }

  @Get('/token-related/broker')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveTokenRelatedKycDataForBroker(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListTokenRelatedKycDataForReviewerQueryInput,
  ): Promise<ListTokenRelatedKycDataForReviewerOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          dataQuery.tokenId, // entityId
          EntityType.TOKEN,
          dataQuery.assetClass,
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token-related KYC data for broker',
        'retrieveTokenRelatedKycDataForBroker',
        true,
        500,
      );
    }
  }

  @Delete('/token-related')
  @HttpCode(200)
  @Protected(true, [])
  async deleteTokenRelatedKycDataForSubmitter(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: DeleteTokenRelatedKycDataQueryInput,
  ): Promise<DeleteKycDataOutput> {
    try {
      checkUserType(
        dataQuery.submitterId !== userContext[UserContextKeys.USER_ID]
          ? UserType.ADMIN
          : UserType.INVESTOR,
        userContext[UserContextKeys.USER],
      );

      const response: DeleteKycDataOutput =
        await this.kycDataService.deleteSubmitterKycDataForEntity(
          userContext[UserContextKeys.TENANT_ID],
          dataQuery.submitterId,
          dataQuery.tokenId,
          EntityType.TOKEN,
          dataQuery.assetClass,
          true, // deleteElementInstances
          true, // deleteReviews
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting token-related KYC data for submitter',
        'deleteTokenRelatedKycDataForSubmitter',
        true,
        500,
      );
    }
  }

  @Get('/issuer-related/submitter')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveIssuerRelatedKycDataForSubmitter(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListIssuerRelatedKycDataForSubmitterQueryInput,
  ): Promise<ListIssuerRelatedKycDataForSubmitterOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForSubmitter(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // submitterId
          dataQuery.issuerId, // entityId
          EntityType.ISSUER,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving issuer-related KYC data for submitter',
        'retrieveIssuerRelatedKycDataForSubmitter',
        true,
        500,
      );
    }
  }

  @Get('/issuer-related/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveIssuerRelatedKycDataForReviewer(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListIssuerRelatedKycDataForReviewerQueryInput,
  ): Promise<ListIssuerRelatedKycDataForReviewerOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          userContext[UserContextKeys.USER_ID], // entityId
          EntityType.ISSUER,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving issuer-related KYC data for reviewer',
        'retrieveIssuerRelatedKycDataForReviewer',
        true,
        500,
      );
    }
  }

  @Get('/issuer-related/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveIssuerRelatedKycDataForVerifier(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListIssuerRelatedKycDataForThirdPartyQueryInput,
  ): Promise<ListIssuerRelatedKycDataForReviewerOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          dataQuery.issuerId, // entityId
          EntityType.ISSUER,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving issuer-related KYC data for verifier',
        'retrieveIssuerRelatedKycDataForVerifier',
        true,
        500,
      );
    }
  }

  @Get('/issuer-related/underwriter')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveIssuerRelatedKycDataForUnderwriter(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListIssuerRelatedKycDataForThirdPartyQueryInput,
  ): Promise<ListIssuerRelatedKycDataForReviewerOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          dataQuery.issuerId, // entityId
          EntityType.ISSUER,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving issuer-related KYC data for underwriter',
        'retrieveIssuerRelatedKycDataForUnderwriter',
        true,
        500,
      );
    }
  }

  @Get('/issuer-related/broker')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveIssuerRelatedKycDataForBroker(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListIssuerRelatedKycDataForThirdPartyQueryInput,
  ): Promise<ListIssuerRelatedKycDataForReviewerOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          dataQuery.issuerId, // entityId
          EntityType.ISSUER,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving issuer-related KYC data for broker',
        'retrieveIssuerRelatedKycDataForBroker',
        true,
        500,
      );
    }
  }

  @Delete('/issuer-related')
  @HttpCode(200)
  @Protected(true, [])
  async deleteIssuerRelatedKycDataForSubmitter(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: DeleteIssuerRelatedKycDataQueryInput,
  ) {
    try {
      checkUserType(
        dataQuery.submitterId !== userContext[UserContextKeys.USER_ID]
          ? UserType.ADMIN
          : UserType.INVESTOR,
        userContext[UserContextKeys.USER],
      );

      const response: DeleteKycDataOutput =
        await this.kycDataService.deleteSubmitterKycDataForEntity(
          userContext[UserContextKeys.TENANT_ID],
          dataQuery.submitterId,
          dataQuery.issuerId,
          EntityType.ISSUER,
          undefined, // assetClassKey
          true, // deleteElementInstances
          true, // deleteReviews
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting issuer-related KYC data for submitter',
        'deleteIssuerRelatedKycDataForSubmitter',
        true,
        500,
      );
    }
  }

  @Get('/project-related/submitter')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveProjectRelatedKycDataForSubmitter(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListProjectRelatedKycDataForSubmitterQueryInput,
  ): Promise<ListProjectRelatedKycDataForSubmitterOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForSubmitter(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // submitterId
          dataQuery.projectId, // entityId
          EntityType.PROJECT,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving project-related KYC data for submitter',
        'retrieveProjectRelatedKycDataForSubmitter',
        true,
        500,
      );
    }
  }

  @Get('/project-related/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveProjectRelatedKycDataForReviewer(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListProjectRelatedKycDataForReviewerQueryInput,
  ): Promise<ListProjectRelatedKycDataForReviewerOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          dataQuery.projectId, // entityId
          EntityType.PROJECT,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving project-related KYC data for reviewer',
        'retrieveProjectRelatedKycDataForReviewer',
        true,
        500,
      );
    }
  }

  @Get('/project-related/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveProjectRelatedKycDataForVerifier(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListProjectRelatedKycDataForReviewerQueryInput,
  ): Promise<ListProjectRelatedKycDataForReviewerOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          dataQuery.projectId, // entityId
          EntityType.PROJECT,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving project-related KYC data for verifier',
        'retrieveProjectRelatedKycDataForVerifier',
        true,
        500,
      );
    }
  }

  @Delete('/project-related')
  @HttpCode(200)
  @Protected(true, [])
  async deleteProjectRelatedKycDataForSubmitter(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: DeleteProjectRelatedKycDataQueryInput,
  ): Promise<DeleteKycDataOutput> {
    try {
      checkUserType(
        dataQuery.submitterId !== userContext[UserContextKeys.USER_ID]
          ? UserType.ADMIN
          : UserType.INVESTOR,
        userContext[UserContextKeys.USER],
      );

      const response: DeleteKycDataOutput =
        await this.kycDataService.deleteSubmitterKycDataForEntity(
          userContext[UserContextKeys.TENANT_ID],
          dataQuery.submitterId,
          dataQuery.projectId,
          EntityType.PROJECT,
          undefined, // assetClassKey
          true, // deleteElementInstances
          true, // deleteReviews
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting project-related KYC data for submitter',
        'deletePlatformRelatedKycDataForSubmitter',
        true,
        500,
      );
    }
  }

  @Get('/platform-related/submitter')
  @HttpCode(200)
  @Protected(true, [])
  async retrievePlatformRelatedKycDataForSubmitter(
    @UserContext() userContext: IUserContext,
  ): Promise<ListPlatformRelatedKycDataForSubmitterOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForSubmitter(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // submitterId
          undefined, // entityId
          EntityType.PLATFORM,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving platform-related KYC data for submitter',
        'retrievePlatformRelatedKycDataForSubmitter',
        true,
        500,
      );
    }
  }

  @Get('/platform-related/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async retrievePlatformRelatedKycDataForReviewer(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListPlatformRelatedKycDataForAdminQueryInput,
  ): Promise<ListPlatformRelatedKycDataForAdminOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          undefined, // entityId
          EntityType.PLATFORM,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving platform-related KYC data for reviewer',
        'retrievePlatformRelatedKycDataForReviewer',
        true,
        500,
      );
    }
  }

  @Get('/platform-related/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async retrievePlatformRelatedKycDataForVerifier(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: ListPlatformRelatedKycDataForAdminQueryInput,
  ): Promise<ListPlatformRelatedKycDataForAdminOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: KycDataResponse =
        await this.kycDataService.retrieveKycDataForReviewer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID], // reviewerId
          dataQuery.submitterId, // submitterId
          undefined, // entityId
          EntityType.PLATFORM,
          undefined, // assetClassKey
          true, // withValidations
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving platform-related KYC data for verifier',
        'retrievePlatformRelatedKycDataForVerifier',
        true,
        500,
      );
    }
  }

  @Delete('/platform-related')
  @HttpCode(200)
  @Protected(true, [])
  async deletePlatformRelatedKycDataForSubmitter(
    @UserContext() userContext: IUserContext,
    @Query() dataQuery: DeletePlatformRelatedKycDataQueryInput,
  ): Promise<DeleteKycDataOutput> {
    try {
      checkUserType(
        dataQuery.submitterId !== userContext[UserContextKeys.USER_ID]
          ? UserType.ADMIN
          : UserType.INVESTOR,
        userContext[UserContextKeys.USER],
      );

      const response: DeleteKycDataOutput =
        await this.kycDataService.deleteSubmitterKycDataForEntity(
          userContext[UserContextKeys.TENANT_ID],
          dataQuery.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
          undefined, // assetClassKey
          true, // deleteElementInstances
          true, // deleteReviews
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting platform-related KYC data for submitter',
        'deletePlatformRelatedKycDataForSubmitter',
        true,
        500,
      );
    }
  }
}
