import { ApiProperty } from '@nestjs/swagger';
import {
  ValidateNested,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';

import { keys as UserKeys, UserExample } from 'src/types/user';

import {
  keys as KycElementKeys,
  KycElementInstanceExample,
} from 'src/types/kyc/element';
import {
  keys as KycReviewKeys,
  KycReviewExample,
  ReviewStatus,
  RiskProfile,
  ClientCategory,
} from 'src/types/kyc/review';
import { Link, LinkExample } from 'src/types/workflow/workflowInstances/link';

export class InviteForPlatformBodyInput {
  @ApiProperty({
    description: 'ID of submitter, who shall be invited',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;
}

export class InviteForPlatformOutput {
  @ApiProperty({
    description: 'Created link between user and platform',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description:
      "'true' if a new link has been created, 'false' if link already existed and has been retrieved",
    example: true,
  })
  newLink: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `User ${
      UserExample[UserKeys.USER_ID]
    } succesfully invited to provide KYC elements for platform`,
  })
  message: string;
}

export class SubmitForPlatformBodyInput {
  @ApiProperty({
    description: 'Array of KYC element instances to submit',
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
  elements: Array<{
    [KycElementKeys.ELEMENT_INSTANCE_ELEMENT_KEY]: string;
    [KycElementKeys.ELEMENT_INSTANCE_VALUE]: Array<string>;
    [KycElementKeys.ELEMENT_INSTANCE_DATA]?: any;
  }>;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class SubmitForPlatformOutput {
  @ApiProperty({
    description: 'Retrieved/updated link between user and platform',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description: 'Response message',
    example: `Platform-related KYC succesfully submitted by issuer ${
      UserExample[UserKeys.USER_ID]
    } for issuer ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class ValidateForPlatformBodyInput {
  @ApiProperty({
    description: 'ID of submitter, KYC shall be validated for',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description: 'Array of KYC element instances to submit',
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
  validations: Array<{
    [KycReviewKeys.DEPRECATED_REVIEW_ID]: string;
    [KycReviewKeys.REVIEW_STATUS]: ReviewStatus;
    [KycReviewKeys.REVIEW_VALIDITY_DATE]?: Date;
    [KycReviewKeys.REVIEW_COMMENT]?: string;
  }>;

  @ApiProperty({
    description: 'Client category (assessed by reviewer)',
    example: ClientCategory.PROFESSIONAL_CLIENTS,
  })
  @IsEnum(ClientCategory)
  @IsOptional()
  clientCategory: ClientCategory;

  @ApiProperty({
    description: 'Client risk profile (assessed by reviewer)',
    example: RiskProfile.MODERATE,
  })
  @IsEnum(RiskProfile)
  @IsOptional()
  riskProfile: RiskProfile;

  @ApiProperty({
    description: 'Validity date',
    example: KycReviewExample[KycReviewKeys.REVIEW_VALIDITY_DATE],
  })
  @IsDateString()
  @IsOptional()
  validityDate: Date;

  @ApiProperty({
    description:
      'Comment provided by the reviewer, to indicate why the submitter has been validated/rejected',
    example: KycReviewExample[KycReviewKeys.REVIEW_COMMENT],
  })
  @IsOptional()
  comment: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class ValidateForPlatformOutput {
  @ApiProperty({
    description: 'Retrieved/updated link between user and platform',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description: 'Response message',
    example: `Platform-related KYC succesfully validated by admin ${
      UserExample[UserKeys.USER_ID]
    } for issuer ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class ValidateForVerifierBodyInput {
  @ApiProperty({
    description: 'ID of submitter, KYC shall be validated for',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description: 'Array of KYC element instances to submit',
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
  validations: Array<{
    [KycReviewKeys.DEPRECATED_REVIEW_ID]: string;
    [KycReviewKeys.REVIEW_STATUS]: ReviewStatus;
    [KycReviewKeys.REVIEW_VALIDITY_DATE]?: Date;
    [KycReviewKeys.REVIEW_COMMENT]?: string;
  }>;

  @ApiProperty({
    description: 'Client category (assessed by reviewer)',
    example: ClientCategory.PROFESSIONAL_CLIENTS,
  })
  @IsEnum(ClientCategory)
  @IsOptional()
  clientCategory: ClientCategory;

  @ApiProperty({
    description: 'Client risk profile (assessed by reviewer)',
    example: RiskProfile.MODERATE,
  })
  @IsEnum(RiskProfile)
  @IsOptional()
  riskProfile: RiskProfile;

  @ApiProperty({
    description: 'Validity date',
    example: KycReviewExample[KycReviewKeys.REVIEW_VALIDITY_DATE],
  })
  @IsDateString()
  @IsOptional()
  validityDate: Date;

  @ApiProperty({
    description:
      'Comment provided by the reviewer, to indicate why the submitter has been validated/rejected',
    example: KycReviewExample[KycReviewKeys.REVIEW_COMMENT],
  })
  @IsOptional()
  comment: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class ValidateForVerifierOutput {
  @ApiProperty({
    description: 'Retrieved/updated link between user and platform',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description: 'Response message',
    example: `Platform-related KYC succesfully validated by user ${
      UserExample[UserKeys.USER_ID]
    } for verifier ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class AllowListForPlatformBodyInput {
  @ApiProperty({
    description: 'ID of submitter, who shall be allowListed',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description: 'Client category (assessed by issuer)',
    example: ClientCategory.PROFESSIONAL_CLIENTS,
  })
  @IsEnum(ClientCategory)
  @IsOptional()
  clientCategory: ClientCategory;

  @ApiProperty({
    description: 'Client risk profile (assessed by issuer)',
    example: RiskProfile.MODERATE,
  })
  @IsEnum(RiskProfile)
  @IsOptional()
  riskProfile: RiskProfile;

  @ApiProperty({
    description: 'Validity date',
    example: KycReviewExample[KycReviewKeys.REVIEW_VALIDITY_DATE],
  })
  @IsDateString()
  @IsOptional()
  validityDate: Date;

  @ApiProperty({
    description:
      'Comment provided by the reviewer, to indicate why the submitter has been validated/rejected',
    example: KycReviewExample[KycReviewKeys.REVIEW_COMMENT],
  })
  @IsOptional()
  comment: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class AllowListForPlatformOutput {
  @ApiProperty({
    description: 'Retrieved/updated link between user and platform',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description:
      "'true' if a new link has been created, 'false' if link already existed and has been retrieved",
    example: true,
  })
  newLink: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `User ${
      UserExample[UserKeys.USER_ID]
    } successfully allowListed globally for issuer ${
      UserExample[UserKeys.USER_ID]
    }`,
  })
  message: string;
}

export class RetrievePlatformLinkQueryInput {
  @ApiProperty({
    description: 'ID of submitter',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;
}
export class RetrievePlatformLinkOutput {
  @ApiProperty({
    description: 'Retrieved link between user and platform',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description: 'Response message',
    example: `Link between user ${
      UserExample[UserKeys.USER_ID]
    } and platform retrieved successfully`,
  })
  message: string;
}

export class UnvalidateOrRejectPlatformLinkBodyInput {
  @ApiProperty({
    description: 'ID of submitter',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class UnvalidateOrRejectPlatformLinkOutput {
  @ApiProperty({
    description: 'Unvalidated link between user and platform',
    example: LinkExample,
  })
  @ValidateNested()
  links: Array<Link>;

  @ApiProperty({
    description: 'Response message',
    example: `User ${
      UserExample[UserKeys.USER_ID]
    } unvalidated successfully for platform`,
  })
  message: string;
}

export class DeletePlatformLinkBodyInput {
  @ApiProperty({
    description: 'ID of submitter, who shall be removed from platform',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;
}

export class DeletePlatformLinkOutput {
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
    example: `User ${
      UserExample[UserKeys.USER_ID]
    } unlinked successfully from platform`,
  })
  message: string;
}
