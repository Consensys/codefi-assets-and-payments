import {
  EntityStatus,
  OperationType,
} from '@codefi-assets-and-payments/ts-types'
import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class OperationEntity {
  @PrimaryColumn()
  id: string

  @Column('enum', { nullable: false, enum: EntityStatus })
  status: EntityStatus

  @Column('enum', { nullable: false, enum: OperationType })
  operationType: OperationType

  @Column({ nullable: true })
  digitalCurrencyAddress?: string

  @Column()
  chainName: string

  @Column({ type: 'numeric', width: 78 })
  operationAmount: string

  @Column({ nullable: true })
  tenantId?: string

  @Column({ nullable: true })
  entityId?: string

  @Column({ nullable: true })
  createdBy?: string

  // tx sender
  @Column()
  operationTriggeredByAddress: string

  @Column({ nullable: true })
  operationTargetAddress?: string

  @Column({ nullable: true })
  operationSourceAddress?: string

  @Column({ nullable: true })
  createdAt?: Date

  @Column({ nullable: true })
  transactionHash?: string
}
