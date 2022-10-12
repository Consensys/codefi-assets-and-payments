import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

import { TransitionTemplateDto } from './dto/TransitionTemplateDto'
import { WorkflowType } from './WorkflowType'
import { EntityType, OrderSide } from '../constants/enums'

@Entity()
export class WorkflowInstance {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  tenantId: string

  @Column({ nullable: true })
  brokerId?: string

  @Column({ nullable: true })
  agentId?: string

  @Column({ nullable: true })
  idempotencyKey: string

  @Column({ nullable: true })
  name: string

  @Column({ type: 'enum', enum: WorkflowType })
  workflowType: WorkflowType

  @Column({ nullable: true })
  objectId: string

  @Column()
  state: string

  @Column()
  role: string

  @Column()
  workflowTemplateId: number

  @Column('simple-json')
  transitionTemplates: TransitionTemplateDto[]

  @Column()
  userId: string

  @Column({ nullable: true })
  recipientId: string

  @Column({ nullable: true })
  entityId: string

  @Column({
    type: 'enum',
    enum: EntityType,
    enumName: 'entitytype_enum',
  })
  entityType: EntityType

  @Column({ nullable: true })
  wallet: string

  @Column({ nullable: true })
  date: Date

  @Column({ nullable: true })
  assetClassKey: string

  // FIXME add the type in the entity definition. This will require a migration
  @Column({ nullable: true })
  quantity: number

  // FIXME add the type in the entity definition. This will require a migration
  @Column({ nullable: true })
  price: number

  @Column({ nullable: true })
  documentId: string

  @Column({ nullable: true })
  paymentId: string

  @Column({ nullable: true })
  offerId?: number

  @Column({ nullable: true })
  orderSide?: OrderSide

  @Column('simple-json')
  data: object

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
