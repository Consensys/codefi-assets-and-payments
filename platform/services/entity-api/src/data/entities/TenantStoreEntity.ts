import { Entity, ManyToOne, PrimaryColumn, RelationId } from 'typeorm'
import { StoreMappingFields } from './StoreMappingFields'
import { TenantEntity } from './TenantEntity'

@Entity('tenant_stores')
export class TenantStoreEntity extends StoreMappingFields {
  @PrimaryColumn()
  @RelationId((entity: TenantStoreEntity) => entity.tenant)
  tenantId: string

  @ManyToOne(() => TenantEntity, (tenant) => tenant.stores)
  tenant?: TenantEntity
}
