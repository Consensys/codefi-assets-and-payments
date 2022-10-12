import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  RelationId,
} from 'typeorm'
import { Admin } from '../dto/Admin'
import { EntityAutoFields } from './EntityAutoFields'
import { ClientEntity } from './ClientEntity'
import { EntityStoreEntity } from './EntityStoreEntity'
import { TenantEntity } from './TenantEntity'
import { WalletEntity } from './WalletEntity'

@Entity('entities')
export class EntityEntity extends EntityAutoFields {
  @PrimaryColumn()
  id: string

  @Column()
  @RelationId((entity: EntityEntity) => entity.tenant)
  tenantId: string

  @Column()
  name: string

  @Column('jsonb')
  metadata: object

  @Column('jsonb')
  initialAdmins: Admin[]

  @Column()
  defaultWallet: string

  @Column()
  createdBy: string

  @ManyToOne(() => TenantEntity, (tenant) => tenant.entities)
  tenant?: TenantEntity

  @OneToMany(() => WalletEntity, (wallet) => wallet.entity)
  wallets?: WalletEntity[]

  @OneToMany(() => EntityStoreEntity, (entityStore) => entityStore.entity)
  stores?: EntityStoreEntity[]

  @OneToMany(() => ClientEntity, (client) => client.entity)
  clients?: ClientEntity[]
}
