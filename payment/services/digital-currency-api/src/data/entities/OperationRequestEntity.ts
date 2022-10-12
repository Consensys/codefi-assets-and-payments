import {
  OperationRequestState,
  OperationRequestType,
} from '@codefi-assets-and-payments/ts-types'
import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class OperationRequestEntity {
  @PrimaryColumn()
  id: string

  @Column({
    type: 'enum',
    enum: OperationRequestType,
  })
  type: OperationRequestType

  @Column()
  requester: string

  @Column()
  issuer: string

  @Column()
  amount: string

  @Column()
  tokenAddress: string

  @Column()
  symbol: string

  @Column()
  chainName: string

  @Column({
    type: 'enum',
    enum: OperationRequestState,
  })
  state: OperationRequestState

  @Column({ nullable: true })
  preRequirementOperationId?: string

  @Column({ nullable: true })
  resolutionOperationId?: string

  @Column()
  tenantId: string

  @Column()
  subject: string
}
