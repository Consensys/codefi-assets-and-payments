import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import {
  keys as KycElementKeys,
  KycElementInstanceExample,
  KycElementInstance,
} from 'src/types/kyc/element';
import { keys as ProjectKeys, ProjectExample } from 'src/types/project';
import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { keys as UserKeys, UserExample } from 'src/types/user';
import {
  keys as KycReviewKeys,
  KycReview,
  KycReviewExample,
  ReviewStatus,
} from 'src/types/kyc/review';
import {
  KycData,
  KycDataExample,
  KycValidations,
  KycValidationsExample,
} from 'src/types/kyc/data';

export class SaveKycDataAsSubmitterBodyInput {
  @ApiProperty({
    description: 'List of KYC element instances to save',
    example: [
      {
        [KycElementKeys.ELEMENT_INSTANCE_ELEMENT_KEY]:
          KycElementInstanceExample[
            KycElementKeys.ELEMENT_INSTANCE_ELEMENT_KEY
          ],
        [KycElementKeys.ELEMENT_INSTANCE_VALUE]:
          KycElementInstanceExample[KycElementKeys.ELEMENT_INSTANCE_VALUE],
        [KycElementKeys.ELEMENT_INSTANCE_DATA]:
          KycElementInstanceExample[KycElementKeys.ELEMENT_INSTANCE_DATA],
      },
    ],
  })
  @ValidateNested()
  elements: Array<{
    [KycElementKeys.ELEMENT_INSTANCE_ELEMENT_KEY]: string;
    [KycElementKeys.ELEMENT_INSTANCE_VALUE]: Array<string>;
    [KycElementKeys.ELEMENT_INSTANCE_DATA]?: any;
  }>;
}

export class SaveKycDataAsSubmitterOutput {
  @ApiProperty({
    description: 'Created KYC element instances',
    example: [
      {
        elementInstance: KycElementInstanceExample,
        newElementInstance: true,
      },
    ],
  })
  @ValidateNested()
  elementInstances: Array<{
    elementInstance: KycElementInstance;
    newElementInstance: boolean;
  }>;

  @ApiProperty({
    description: 'Response message',
    example: '5 KYC element instance(s) created successfully',
  })
  message: string;
}

export class SaveKycDataAsReviewerBodyInput {
  @ApiProperty({
    description: 'List of KYC element reviews to save',
    example: [
      {
        [KycReviewKeys.DEPRECATED_REVIEW_ID]:
          KycReviewExample[KycReviewKeys.REVIEW_ID],
        [KycReviewKeys.REVIEW_STATUS]:
          KycReviewExample[KycReviewKeys.REVIEW_STATUS],
        [KycReviewKeys.REVIEW_VALIDITY_DATE]:
          KycReviewExample[KycReviewKeys.REVIEW_VALIDITY_DATE],
        [KycReviewKeys.REVIEW_COMMENT]:
          KycReviewExample[KycReviewKeys.REVIEW_COMMENT],
      },
    ],
  })
  @ValidateNested()
  reviews: Array<{
    [KycReviewKeys.DEPRECATED_REVIEW_ID]: string;
    [KycReviewKeys.REVIEW_STATUS]: ReviewStatus;
    [KycReviewKeys.REVIEW_VALIDITY_DATE]?: Date;
    [KycReviewKeys.REVIEW_COMMENT]?: string;
  }>;
}

export class SaveKycDataAsReviewerOutput {
  @ApiProperty({
    description: 'Created KYC element reviews',
    example: [
      {
        elementReview: KycReviewExample,
        newReview: true,
      },
    ],
  })
  @ValidateNested()
  reviews: Array<KycReview>;

  @ApiProperty({
    description: 'Response message',
    example: '5 KYC element review(s) created successfully',
  })
  message: string;
}

export class ListTokenRelatedKycDataForSubmitterQueryInput {
  @ApiProperty({
    description: 'ID of token, KYC data shall be retrieved for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description: 'Asset class of token, KYC shall be retrieved for',
    example: 'classa',
  })
  @IsOptional()
  assetClass: string;
}

export class ListTokenRelatedKycDataForSubmitterOutput {
  @ApiProperty({
    description: 'KYC data, including element reviews and template reviews',
    example: KycDataExample,
  })
  @ValidateNested()
  kycData: KycData;

  @ApiProperty({
    description: 'KYC validations, including element and template validations',
    example: KycValidationsExample,
  })
  @ValidateNested()
  kycValidations: KycValidations;

  @ApiProperty({
    description: 'Response message',
    example: `KYC data (token-related) listed successfully for user ${
      UserExample[UserKeys.USER_ID]
    }`,
  })
  message: string;
}

export class ListTokenRelatedKycDataForReviewerQueryInput {
  @ApiProperty({
    description: 'ID of user, KYC data shall be retrieved for',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description: 'ID of token, KYC data shall be retrieved for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description: 'Asset class of token, KYC shall be retrieved for',
    example: 'classa',
  })
  @IsOptional()
  assetClass: string;
}

export class ListTokenRelatedKycDataForReviewerOutput {
  @ApiProperty({
    description: 'KYC data, including element reviews and template reviews',
    example: KycDataExample,
  })
  @ValidateNested()
  kycData: KycData;

  @ApiProperty({
    description: 'KYC validations, including element and template validations',
    example: KycValidationsExample,
  })
  @ValidateNested()
  kycValidations: KycValidations;

  @ApiProperty({
    description: 'Response message',
    example: `KYC data (token-related) of user ${
      UserExample[UserKeys.USER_ID]
    } listed successfully for issuer ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class DeleteTokenRelatedKycDataQueryInput {
  @ApiProperty({
    description: 'ID of the user, KYC data shall be deleted from',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description: 'ID of the token, KYC data shall be deleted from',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description: 'Asset class of token, KYC shall be deleted for',
    example: 'classa',
  })
  @IsOptional()
  assetClass: string;
}

export class ListIssuerRelatedKycDataForSubmitterQueryInput {
  @ApiProperty({
    description: 'ID of issuer, KYC data shall be retrieved for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  issuerId: string;
}

export class ListIssuerRelatedKycDataForSubmitterOutput {
  @ApiProperty({
    description: 'KYC data, including element reviews and template reviews',
    example: KycDataExample,
  })
  @ValidateNested()
  kycData: KycData;

  @ApiProperty({
    description: 'KYC validations, including element and template validations',
    example: KycValidationsExample,
  })
  @ValidateNested()
  kycValidations: KycValidations;

  @ApiProperty({
    description: 'Response message',
    example: `KYC data (issuer-related) listed successfully for user ${
      UserExample[UserKeys.USER_ID]
    }`,
  })
  message: string;
}

export class ListIssuerRelatedKycDataForReviewerQueryInput {
  @ApiProperty({
    description: 'ID of user, KYC data shall be retrieved for',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;
}

export class ListIssuerRelatedKycDataForThirdPartyQueryInput extends ListIssuerRelatedKycDataForReviewerQueryInput {
  @ApiProperty({
    description: 'ID of issuer, KYC applies to',
    example: UserExample[UserKeys.USER_ID],
  })
  issuerId: string;
}

export class ListIssuerRelatedKycDataForReviewerOutput {
  @ApiProperty({
    description: 'KYC data, including element reviews and template reviews',
    example: KycDataExample,
  })
  @ValidateNested()
  kycData: KycData;

  @ApiProperty({
    description: 'KYC validations, including element and template validations',
    example: KycValidationsExample,
  })
  @ValidateNested()
  kycValidations: KycValidations;

  @ApiProperty({
    description: 'Response message',
    example: `KYC data (issuer-related) of user ${
      UserExample[UserKeys.USER_ID]
    } listed successfully for issuer ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class DeleteIssuerRelatedKycDataQueryInput {
  @ApiProperty({
    description: 'ID of the user, KYC data shall be deleted from',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description: 'ID of the issuer, KYC data shall be deleted from',
    example: UserExample[UserKeys.USER_ID],
  })
  issuerId: string;
}
export class ListProjectRelatedKycDataForSubmitterQueryInput {
  @ApiProperty({
    description: 'ID of project, KYC data shall be retrieved for',
    example: ProjectExample[ProjectKeys.PROJECT_ID],
  })
  projectId: string;
}

export class ListProjectRelatedKycDataForSubmitterOutput {
  @ApiProperty({
    description: 'KYC data, including element reviews and template reviews',
    example: KycDataExample,
  })
  @ValidateNested()
  kycData: KycData;

  @ApiProperty({
    description: 'KYC validations, including element and template validations',
    example: KycValidationsExample,
  })
  @ValidateNested()
  kycValidations: KycValidations;

  @ApiProperty({
    description: 'Response message',
    example: `KYC data (project-related) listed successfully for user ${
      UserExample[UserKeys.USER_ID]
    }`,
  })
  message: string;
}

export class ListProjectRelatedKycDataForReviewerQueryInput {
  @ApiProperty({
    description: 'ID of user, KYC data shall be retrieved for',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description: 'ID of project, KYC data shall be retrieved for',
    example: ProjectExample[ProjectKeys.PROJECT_ID],
  })
  projectId: string;
}

export class ListProjectRelatedKycDataForReviewerOutput {
  @ApiProperty({
    description: 'KYC data, including element reviews and template reviews',
    example: KycDataExample,
  })
  @ValidateNested()
  kycData: KycData;

  @ApiProperty({
    description: 'KYC validations, including element and template validations',
    example: KycValidationsExample,
  })
  @ValidateNested()
  kycValidations: KycValidations;

  @ApiProperty({
    description: 'Response message',
    example: `KYC data (project-related) of user ${
      UserExample[UserKeys.USER_ID]
    } listed successfully for issuer ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class DeleteProjectRelatedKycDataQueryInput {
  @ApiProperty({
    description: 'ID of the user, KYC data shall be deleted from',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description: 'ID of the project, KYC data shall be deleted from',
    example: ProjectExample[ProjectKeys.PROJECT_ID],
  })
  projectId: string;
}
export class ListPlatformRelatedKycDataForSubmitterOutput {
  @ApiProperty({
    description: 'KYC data, including element reviews and template reviews',
    example: KycDataExample,
  })
  @ValidateNested()
  kycData: KycData;

  @ApiProperty({
    description: 'KYC validations, including element and template validations',
    example: KycValidationsExample,
  })
  @ValidateNested()
  kycValidations: KycValidations;

  @ApiProperty({
    description: 'Response message',
    example: `KYC data (platform-related) listed successfully for submitter ${
      UserExample[UserKeys.USER_ID]
    }`,
  })
  message: string;
}

export class ListPlatformRelatedKycDataForAdminQueryInput {
  @ApiProperty({
    description: 'ID of user, KYC data shall be retrieved for',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;
}

export class ListPlatformRelatedKycDataForAdminOutput {
  @ApiProperty({
    description: 'KYC data, including element reviews and template reviews',
    example: KycDataExample,
  })
  @ValidateNested()
  kycData: KycData;

  @ApiProperty({
    description: 'KYC validations, including element and template validations',
    example: KycValidationsExample,
  })
  @ValidateNested()
  kycValidations: KycValidations;

  @ApiProperty({
    description: 'Response message',
    example: `KYC data (platform-related) of submitter with ID ${
      UserExample[UserKeys.USER_ID]
    } listed successfully for admin ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class DeletePlatformRelatedKycDataQueryInput {
  @ApiProperty({
    description: 'ID of user, KYC data shall be deleted from',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;
}

export class DeleteKycDataOutput {
  @ApiProperty({
    description: 'IDs of deleted element instances',
    example: [
      '2bc607b7-a46e-45e4-a74c-4a559bd89c81',
      '852a27de-5949-4de1-a782-1bce5a368135',
    ],
  })
  deletedElementInstances: Array<string>;

  @ApiProperty({
    description: 'IDs of deleted element reviews',
    example: [
      'd9558f63-4457-4393-9785-45bbda8e5c6c',
      '2fc73d9d-186d-496c-843c-3c7a13d3dc23',
    ],
  })
  deletedElementReviews: Array<string>;

  @ApiProperty({
    description: 'IDs of deleted template reviews',
    example: ['5056f94d-e080-4ef2-ac46-9ec5b450bce7'],
  })
  deletedTemplateReviews: Array<string>;

  @ApiProperty({
    description: 'Response message',
    example: `KYC data, related to platform, successfully deleted for user ${
      UserExample[UserKeys.USER_ID]
    }`,
  })
  message: string;
}
