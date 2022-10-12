import { KYCResult } from '@codefi-assets-and-payments/messaging-events'
import { OnfidoApplicantId } from '../../data/entities/types'

export default interface CheckResult {
  applicantId: OnfidoApplicantId
  result: KYCResult
}
