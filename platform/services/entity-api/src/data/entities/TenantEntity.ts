import { ProductType } from '@codefi-assets-and-payments/ts-types'
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm'
import { Admin } from '../dto/Admin'
import { ClientEntity } from './ClientEntity'
import { EntityAutoFields } from './EntityAutoFields'
import { EntityEntity } from './EntityEntity'
import { TenantStoreEntity } from './TenantStoreEntity'

@Entity('tenants')
export class TenantEntity extends EntityAutoFields {
  @PrimaryColumn()
  id: string

  @Column()
  name: string

  @Column('jsonb')
  products: { [key in ProductType]?: boolean }

  @Column()
  defaultNetworkKey: string

  @Column('jsonb')
  metadata: object

  @Column('jsonb')
  initialAdmins: Admin[]

  @Column()
  createdBy: string

  @OneToMany(() => EntityEntity, (entity) => entity.tenant)
  entities?: EntityEntity[]

  @OneToMany(() => TenantStoreEntity, (entityStore) => entityStore.tenant)
  stores?: TenantStoreEntity[]

  @OneToMany(() => ClientEntity, (client) => client.tenant)
  clients?: ClientEntity[]
}
