import { ApiProperty } from '@nestjs/swagger';
import {
  ReviewStatus,
  ClientCategory,
  RiskProfile,
  ReviewScope,
  EntityType,
} from 'src/utils/constants/enum';

export class ReviewRequest {
  @ApiProperty()
  reviewId?: string;

  @ApiProperty()
  objectId: string;

  @ApiProperty()
  @ApiProperty({
    enum: [
      EntityType.TOKEN,
      EntityType.ASSET_CLASS,
      EntityType.ISSUER,
      EntityType.ADMIN,
      EntityType.PROJECT,
      EntityType.PLATFORM,
    ],
  })
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  entityClass: string;

  @ApiProperty()
  investorId?: string;

  @ApiProperty({
    enum: [
      ReviewStatus.SUBMITTED,
      ReviewStatus.VALIDATED,
      ReviewStatus.REJECTED,
      ReviewStatus.IN_REVIEW,
    ],
  })
  status: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  comment: string;

  @ApiProperty({ nullable: true })
  validityDate: Date;

  @ApiProperty({
    nullable: true,
    enum: [
      ClientCategory.ELIGIBLE_COUNTER_PARTIES,
      ClientCategory.PROFESSIONAL_CLIENTS,
      ClientCategory.RETAIL_CUSTOMERS,
    ],
  })
  category?: string;

  @ApiProperty({
    nullable: true,
    enum: [
      RiskProfile.CONSERVATIVE,
      RiskProfile.MODERATE,
      RiskProfile.BALANCED,
      RiskProfile.DYNAMIC,
      RiskProfile.AGGRESSIVE,
    ],
  })
  riskProfile?: string;

  @ApiProperty({
    enum: [
      ReviewScope.TEMPLATE,
      ReviewScope.SECTION,
      ReviewScope.ELEMENT_INSTANCE,
    ],
  })
  scope: string;
}
