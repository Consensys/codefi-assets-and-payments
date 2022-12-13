import { EntityStatus } from '@consensys/ts-types'
import { Column, Entity, PrimaryColumn } from 'typeorm'
@Entity()
export class DigitalCurrencyEntity {
  @PrimaryColumn()
  id: string

  @Column()
  name: string

  @Column()
  symbol: string

  @Column()
  decimals: number

  @Column()
  deployerAddress: string

  @Column()
  chainName: string

  @Column()
  totalMinted: string

  @Column()
  totalBurnt: string

  @Column({ nullable: true })
  currencyEthereumAddress?: string

  @Column({ nullable: true })
  operationId?: string

  // this property will be empty in other nodes than the creator node
  @Column({ nullable: true })
  createdBy?: string

  // this property will be empty in other nodes than the creator node
  @Column({ nullable: true })
  tenantId?: string

  // this property will be empty in other nodes than the creator node
  @Column({ nullable: true })
  entityId?: string

  @Column({ nullable: true })
  createdAt?: Date

  @Column('enum', { nullable: false, enum: EntityStatus })
  status: EntityStatus
}
