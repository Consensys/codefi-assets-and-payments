import { apm } from '../apm'

export class ApmTransactionStarted {
  traceParent: string
  trans: apm.Transaction
}
