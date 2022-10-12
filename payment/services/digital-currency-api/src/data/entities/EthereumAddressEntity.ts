import { WalletType } from '@codefi-assets-and-payments/ts-types'
import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm'

@Entity()
@Index(['address', 'entityId'], { unique: true })
@Unique('UQ_entityId_address_type', ['entityId', 'address', 'type'])
export class EthereumAddressEntity {
  @PrimaryColumn()
  id: string

  @Column()
  entityId: string

  @Column()
  address: string

  @Column('enum', { nullable: false, enum: WalletType })
  type: WalletType

  @Column()
  metadata: string

  @Column()
  createdAt: Date
}
