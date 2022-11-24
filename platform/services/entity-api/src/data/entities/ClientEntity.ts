import { ClientType, EntityStatus } from '@consensys/ts-types'
import { Column, Entity, ManyToOne, PrimaryColumn, RelationId } from 'typeorm'
import { EntityAutoFields } from './EntityAutoFields'
import { EntityEntity } from './EntityEntity'
import { TenantEntity } from './TenantEntity'

@Entity('clients')
export class ClientEntity extends EntityAutoFields {
  @PrimaryColumn()
  id: string

  @Column()
  @RelationId((entity: ClientEntity) => entity.tenant)
  tenantId: string

  @Column()
  @RelationId((entity: ClientEntity) => entity.entity)
  entityId: string

  @Column()
  name: string

  @Column()
  type: ClientType

  @Column()
  status: EntityStatus

  @Column()
  clientId?: string

  @ManyToOne(() => TenantEntity, (tenant) => tenant.clients)
  tenant?: TenantEntity

  @ManyToOne(() => EntityEntity, (entity) => entity.clients)
  entity?: EntityEntity
}
