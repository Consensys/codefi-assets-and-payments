import {
  Column,
  DataType,
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  ReviewScope,
  ReviewStatus,
  ClientCategory,
  RiskProfile,
  EntityType,
} from 'src/utils/constants/enum';

@Table({
  tableName: 'reviews',
})
export class ReviewModel extends Model<ReviewModel> {
  @Column({
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
  })
  id: string;

  @Column({
    type: DataType.STRING,
  })
  tenantId: string;

  @Column({
    type: DataType.ENUM(
      ReviewScope.TEMPLATE,
      ReviewScope.SECTION,
      ReviewScope.ELEMENT_INSTANCE,
    ),
  })
  scope: string;

  @Column({
    type: DataType.STRING,
  })
  objectId: string;

  @Column({
    type: DataType.STRING,
  })
  sectionKey: string;

  @Column({
    type: DataType.STRING,
  })
  investorId: string;

  @Column({
    type: DataType.ENUM(
      EntityType.TOKEN,
      EntityType.ASSET_CLASS,
      EntityType.ISSUER,
      EntityType.ADMIN,
      EntityType.PROJECT,
      EntityType.PLATFORM,
    ),
  })
  entityType: string;

  @Column({
    type: DataType.STRING,
  })
  entityId: string;

  @Column({
    type: DataType.STRING,
  })
  entityClass: string;

  @Column({
    type: DataType.ENUM(
      ReviewStatus.SUBMITTED,
      ReviewStatus.VALIDATED,
      ReviewStatus.REJECTED,
    ),
  })
  status: string;

  @Column({
    type: DataType.ENUM(
      ClientCategory.ELIGIBLE_COUNTER_PARTIES,
      ClientCategory.PROFESSIONAL_CLIENTS,
      ClientCategory.RETAIL_CUSTOMERS,
    ),
  })
  category: string;

  @Column({
    type: DataType.ENUM(
      RiskProfile.CONSERVATIVE,
      RiskProfile.MODERATE,
      RiskProfile.BALANCED,
      RiskProfile.DYNAMIC,
      RiskProfile.AGGRESSIVE,
    ),
  })
  riskProfile: string;

  @Column({
    type: DataType.STRING,
  })
  comment: string;

  @Column({
    type: DataType.DATE,
  })
  validityDate: Date;

  @Column({
    type: DataType.JSON,
  })
  data: object;

  @CreatedAt
  @Column({ type: DataType.DATE })
  public createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  public updatedAt: Date;
}
