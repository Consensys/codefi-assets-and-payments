import { Entity, ManyToOne, PrimaryColumn, RelationId } from 'typeorm'
import { EntityEntity } from './EntityEntity'
import { StoreMappingFields } from './StoreMappingFields'
import { TenantEntity } from './TenantEntity'

@Entity('entity_stores')
export class EntityStoreEntity extends StoreMappingFields {
  @PrimaryColumn()
  @RelationId((entity: EntityStoreEntity) => entity.tenant)
  tenantId: string

  @PrimaryColumn()
  @RelationId((entity: EntityStoreEntity) => entity.entity)
  entityId: string

  @ManyToOne(() => TenantEntity, (tenant) => tenant.stores)
  tenant?: TenantEntity

  @ManyToOne(() => EntityEntity, (entity) => entity.stores)
  entity?: EntityEntity
}
