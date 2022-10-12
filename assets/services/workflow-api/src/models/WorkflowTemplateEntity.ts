import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

import { TransitionTemplateDto } from './dto/TransitionTemplateDto'
import { WorkflowType } from './WorkflowType'

@Entity()
export class WorkflowTemplate {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  tenantId: string

  @Column()
  name: string

  @Column({ type: 'enum', enum: WorkflowType })
  workflowType: WorkflowType

  @Column('simple-array')
  roles: string[]

  @Column('simple-array')
  states: string[]

  @Column('simple-json')
  transitionTemplates: TransitionTemplateDto[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
