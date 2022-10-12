import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  tenantId: string

  @Column()
  status: string

  @Column({ nullable: true })
  signerId: string

  @Column({ nullable: true })
  callerId: string

  @Column({ nullable: true })
  identifierOrchestrateId: string

  @Column()
  identifierTxHash: string

  @Column({ nullable: true })
  identifierCustom: string

  @Column('simple-json', { nullable: true })
  callbacks: object

  @Column('simple-json')
  context: object

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
