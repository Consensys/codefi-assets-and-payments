import 'reflect-metadata'

export enum CheckActionType {
  CheckStarted = 'check.started',
  CheckReopened = 'check.reopened',
  CheckWithdrawn = 'check.withdrawn',
  CheckCompleted = 'check.completed',
  CheckFormCompleted = 'check.form_completed',
}

export enum ReportActionType {
  ReportWithdrawn = 'report.withdrawn',
  ReportResumed = 'report.resumed',
  ReportCancelled = 'report.cancelled',
  ReportAwaitingApproval = 'report.awaiting_approval',
  ReportCompleted = 'report.completed',
}

export type KycActionType = CheckActionType | ReportActionType

export enum OnFidoKycStatus {
  Completed = 'completed',
}

export class OnFidoKycObject {
  id: string

  // No need to verify this as an enum
  // If OnFido starts sending a new enum type we should just ignore it
  // status: OnFidoKycStatus;

  completed_at_iso8601: string

  href: string
}

export class OnFidoKycPayload {
  resource_type: string

  action: KycActionType

  object: OnFidoKycObject
}

export default class OnFidoKycWebhookRequest {
  payload: OnFidoKycPayload
}
