import { KYCResult, KYCScope } from '@consensys/messaging-events'
import { OnfidoCheckId, OnfidoReportId } from '../../data/entities/types'

export default interface ReportResult {
  reportId: OnfidoReportId
  checkId: OnfidoCheckId
  scope: KYCScope
  name: string
  href: string
  result: KYCResult
}
