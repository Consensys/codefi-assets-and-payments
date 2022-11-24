import { KYCResult } from '@consensys/messaging-events'
import { OnfidoApplicantId } from '../../data/entities/types'

export default interface CheckResult {
  applicantId: OnfidoApplicantId
  result: KYCResult
}
