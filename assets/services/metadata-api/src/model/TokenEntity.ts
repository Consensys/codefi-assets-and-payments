import { Entity, Column } from 'typeorm';
import { DATABASE_TABLES } from 'src/utils/constants';
import { Deployment } from './dto/TokensDto';
import { BaseEntity } from './BaseEntity';

@Entity(DATABASE_TABLES.TOKENS)
export class Token extends BaseEntity {
  @Column({
    type: String,
    nullable: true,
  })
  issuerId: string | null;

  @Column({
    type: String,
    nullable: true,
  })
  name: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  creatorId: string | null;

  @Column({
    type: String,
    nullable: true,
  })
  reviewerId: string | null;

  @Column({
    type: String,
    nullable: true,
  })
  symbol: string | null;

  @Column({
    type: String,
    nullable: true,
  })
  standard: string | null;

  @Column({
    type: 'json',
    nullable: true,
  })
  workflowIds: object | null;

  @Column({
    nullable: true,
    type: String,
  })
  defaultDeployment: string | null;

  @Column({
    type: String,
    nullable: true,
  })
  defaultChainId: string | null;

  @Column({
    type: String,
    nullable: true,
  })
  defaultNetworkKey: string | null;

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  deployments: Array<Deployment> | null;

  @Column({
    type: String,
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'json',
    nullable: true,
  })
  picture: Array<string> | null;

  @Column({
    type: 'json',
    nullable: true,
  })
  bankAccount: object | null;

  @Column({
    type: 'varchar',
    array: true,
    nullable: true,
  })
  assetClasses: Array<string> | null;

  @Column({
    type: 'varchar',
    nullable: true,
    array: true,
  })
  behaviours: Array<string> | null;

  @Column({
    nullable: true,
  })
  assetTemplateId: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  data: object;
}
