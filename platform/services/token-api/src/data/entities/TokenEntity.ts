import { Entity, PrimaryColumn, Column } from 'typeorm'
import { EntityStatus, TokenType } from '@consensys/ts-types'

@Entity()
export class TokenEntity {
  @PrimaryColumn()
  id: string

  @Column('enum', {
    nullable: false,
    enum: EntityStatus,
    default: EntityStatus.Pending,
  })
  status: EntityStatus

  @Column('enum', { nullable: false, enum: TokenType })
  type: TokenType

  @Column()
  name: string

  @Column()
  symbol: string

  @Column()
  chainName: string

  @Column({ nullable: true })
  decimals?: number

  @Column()
  deployerAddress: string

  @Column({ nullable: true })
  contractAddress?: string

  @Column({ nullable: true })
  operationId?: string

  @Column({ nullable: true })
  transactionId?: string

  @Column({ nullable: true })
  tenantId?: string

  @Column({ nullable: true })
  entityId?: string

  @Column({ nullable: true })
  createdBy?: string

  @Column('timestamp')
  createdAt: Date
}
