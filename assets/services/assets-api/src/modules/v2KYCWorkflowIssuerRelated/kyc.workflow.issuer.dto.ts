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

export class InviteForIssuerBodyInput {
  @ApiProperty({
    description:
      'ID of submitter (investor, underwriter, etc.), who shall be invited',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;
}

export class InviteForIssuerAsThirdPartyBodyInput extends InviteForIssuerBodyInput {
  @ApiProperty({
    description: 'ID of issuer, KYC shall be submitted for',
    example: UserExample[UserKeys.USER_ID],
  })
  issuerId: string;
}

export class InviteForIssuerOutput {
  @ApiProperty({
    description: 'Created link between submitter and issuer',
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
    } succesfully invited to provide KYC elements for issuer ${
      UserExample[UserKeys.USER_ID]
    }`,
  })
  message: string;
}

export class SubmitForIssuerBodyInput {
  @ApiProperty({
    description: 'ID of issuer, KYC shall be submitted for',
    example: UserExample[UserKeys.USER_ID],
  })
  issuerId: string;

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

export class SubmitForIssuerOutput {
  @ApiProperty({
    description: 'Retrieved/updated link between submitter and issuer',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description: 'Response message',
    example: `Issuer-related KYC succesfully submitted by user ${
      UserExample[UserKeys.USER_ID]
    } for issuer ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class ReviewForIssuerBodyInput {
  @ApiProperty({
    description:
      'ID of submitter (investor, underwriter, etc.), whom KYC shall be reviewed',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description: 'Array of KYC element reviews to submit',
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

export class ReviewForIssuerOutput {
  @ApiProperty({
    description: 'Retrieved/updated link between submitter and issuer',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description: 'Response message',
    example: `Issuer-related succesfully validated by user ${
      UserExample[UserKeys.USER_ID]
    } for issuer ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class ReviewForIssuerAsThirdPartyBodyInput extends ReviewForIssuerBodyInput {
  @ApiProperty({
    description: 'ID of issuer, KYC shall be reviewed for',
    example: UserExample[UserKeys.USER_ID],
  })
  issuerId: string;
}

export class AllowListForIssuerBodyInput {
  @ApiProperty({
    description:
      'ID of submitter(investor, underwriter, etc.), who shall be allowListed',
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
      'Comment provided by the issuer, to indicate why the submitter has been validated/rejected',
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

export class AllowListForIssuerAsVerifierBodyInput extends AllowListForIssuerBodyInput {
  @ApiProperty({
    description: 'ID of issuer, KYC shall be validated for',
    example: UserExample[UserKeys.USER_ID],
  })
  issuerId: string;
}

export class AllowListForIssuerOutput {
  @ApiProperty({
    description: 'Retrieved/updated link between submitter and entity',
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
    } successfully allowListed for issuer ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class RetrieveIssuerLinkQueryInput {
  @ApiProperty({
    description: 'ID of submitter(investor, underwriter, etc.)',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;

  @ApiProperty({
    description: 'ID of issuer',
    example: UserExample[UserKeys.USER_ID],
  })
  issuerId: string;
}
export class RetrieveIssuerLinkOutput {
  @ApiProperty({
    description: 'Retrieved link between user and entity',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description: 'Response message',
    example: `Link between user ${UserExample[UserKeys.USER_ID]} and issuer ${
      UserExample[UserKeys.USER_ID]
    } retrieved successfully`,
  })
  message: string;
}

export class UnvalidateOrRejectIssuerLinkBodyInput {
  @ApiProperty({
    description: 'ID of submitter(investor, underwriter, etc.)',
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

export class UnvalidateOrRejectIssuerLinkAsThirdPartyBodyInput extends UnvalidateOrRejectIssuerLinkBodyInput {
  @ApiProperty({
    description: 'ID of issuer, KYC shall be unvalidated for',
    example: UserExample[UserKeys.USER_ID],
  })
  issuerId: string;
}

export class UnvalidateOrRejectIssuerLinkOutput {
  @ApiProperty({
    description: 'Unvalidated link between user and issuer',
    example: LinkExample,
  })
  @ValidateNested()
  links: Array<Link>;

  @ApiProperty({
    description: 'Response message',
    example: `User ${
      UserExample[UserKeys.USER_ID]
    } unvalidated successfully for issuer ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class DeleteIssuerLinkBodyInput {
  @ApiProperty({
    description:
      'ID of submitter(investor, underwriter, etc.), who shall be deleted from issuer',
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;
}

export class DeleteTokenLinkAsThirdPartyBodyInput extends DeleteIssuerLinkBodyInput {
  @ApiProperty({
    description: 'ID of issuer, KYC is submitted for',
    example: UserExample[UserKeys.USER_ID],
  })
  issuerId: string;
}

export class DeleteIssuerLinkOutput {
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
    } unlinked successfully from issuer ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}
