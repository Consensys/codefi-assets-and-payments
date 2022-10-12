import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity()
export class TransitionInstance {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  tenantId: string

  @Column({ nullable: true })
  name: string

  @Column({ nullable: true })
  userId: string

  @Column()
  workflowInstanceId: number

  @Column()
  fromState: string

  @Column()
  toState: string

  @Column()
  role: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
