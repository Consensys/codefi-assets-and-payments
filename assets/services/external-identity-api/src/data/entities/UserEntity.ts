import { Entity, Column, PrimaryColumn } from 'typeorm'
import { BaseEntity } from './BaseEntity'
import { OnfidoApplicantId, UserId } from './types'

@Entity({
  name: 'Users',
})
export class UserEntity extends BaseEntity {
  @PrimaryColumn({ type: 'uuid', nullable: false })
  userId: UserId

  @Column({ type: 'uuid', nullable: false })
  onfidoApplicationId: OnfidoApplicantId
}
