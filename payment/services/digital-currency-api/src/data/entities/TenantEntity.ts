import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class TenantEntity {
  @PrimaryColumn()
  id: string

  @Column('jsonb', { nullable: true })
  metadata: any

  @Column()
  name: string

  @Column()
  defaultNetworkKey: string

  @Column()
  createdAt: Date
}
