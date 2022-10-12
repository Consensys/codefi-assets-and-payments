import { Entity, Column, Unique, PrimaryColumn } from 'typeorm'
import { BaseEntity } from './BaseEntity'
import { OnfidoCheckId, OnfidoReportId, UserId } from './types'

@Entity({
  name: 'ReportResults',
})
@Unique(['reportId'])
export class ReportResultEntity extends BaseEntity {
  @PrimaryColumn({ type: 'uuid', nullable: false })
  reportId: OnfidoReportId

  @Column({ type: 'uuid', nullable: false })
  userId: UserId

  @Column({ type: 'uuid', nullable: false })
  checkId: OnfidoCheckId

  @Column()
  name: string

  @Column()
  href: string

  @Column()
  completedAt: Date

  @Column()
  result: string

  @Column()
  scope: string
}
