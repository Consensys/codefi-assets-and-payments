import { Entity, Column } from 'typeorm';
import {
  DATABASE_TABLES,
  CycleStatus,
  PrimaryTradeType,
} from 'src/utils/constants';
import { BaseEntity } from './BaseEntity';

@Entity(DATABASE_TABLES.ASSET_CYCLE_INSTANCES)
export class AssetCycleInstance extends BaseEntity {
  @Column({ nullable: false })
  assetInstanceId: string;

  @Column({ nullable: true })
  assetInstanceClassKey: string;

  @Column({ type: 'timestamptz', nullable: false })
  startDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  valuationDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  settlementDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  unpaidFlagDate: Date;

  @Column({ type: 'numeric', nullable: true })
  nav: number;

  @Column({
    type: 'enum',
    enum: CycleStatus,
    enumName: 'enum_cycle_status',
    nullable: false,
  })
  status: CycleStatus;

  @Column({
    type: 'enum',
    enum: PrimaryTradeType,
    enumName: 'enum_cycle_type',
    default: PrimaryTradeType.SUBSCRIPTION,
    nullable: false,
  })
  type: PrimaryTradeType;

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  data: object;
}
