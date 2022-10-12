import { WalletType } from '@codefi-assets-and-payments/ts-types'
import { Column, Entity, ManyToOne, PrimaryColumn, RelationId } from 'typeorm'
import { EntityAutoFields } from './EntityAutoFields'
import { EntityEntity } from './EntityEntity'
import { TenantEntity } from './TenantEntity'

@Entity('wallets')
export class WalletEntity extends EntityAutoFields {
  @PrimaryColumn()
  address: string

  @PrimaryColumn()
  @RelationId((wallet: WalletEntity) => wallet.entity)
  entityId: string

  @Column()
  @RelationId((wallet: WalletEntity) => wallet.tenant)
  tenantId: string

  @Column('enum', { nullable: false, enum: WalletType })
  type: WalletType

  @Column('jsonb')
  metadata: object

  @Column()
  storeId: string

  @Column()
  createdBy: string

  @ManyToOne(() => EntityEntity, (entity) => entity.wallets)
  entity?: EntityEntity

  @ManyToOne(() => TenantEntity)
  tenant?: TenantEntity
}
