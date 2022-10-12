import { Entity, PrimaryColumn, Column } from 'typeorm'
import { EntityStatus, TokenOperationType } from '@codefi-assets-and-payments/ts-types'
import { IReceipt } from '@codefi-assets-and-payments/nestjs-orchestrate'

@Entity()
export class OperationEntity {
  @PrimaryColumn()
  id: string

  @Column('enum', {
    nullable: false,
    enum: EntityStatus,
    default: EntityStatus.Pending,
  })
  status: EntityStatus

  @Column('enum', { nullable: false, enum: TokenOperationType })
  operation: TokenOperationType

  @Column()
  transactionId: string

  @Column()
  chainName: string

  @Column({ nullable: true })
  tenantId?: string

  @Column({ nullable: true })
  entityId?: string

  @Column({ nullable: true })
  createdBy?: string

  @Column('timestamp')
  createdAt: Date

  @Column({ nullable: true })
  blockNumber?: number

  @Column({ nullable: true })
  transactionHash?: string

  @Column({ nullable: true, type: 'json' })
  decodedEvent?: any

  @Column({ nullable: true, type: 'json' })
  receipt?: IReceipt
}
