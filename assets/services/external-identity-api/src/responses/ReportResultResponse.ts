import { OnfidoCheckId, OnfidoReportId, UserId } from '../data/entities/types'

export default class ReportResultResponse {
  userId: UserId
  reportId: OnfidoReportId
  checkId: OnfidoCheckId
  name: string
  href: string
  completedAt: Date
  result: string
  scope: string
}
