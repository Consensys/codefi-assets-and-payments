import { Inject, Injectable, Optional } from '@nestjs/common'
import { createLogger } from '../logging'
import { apm } from '../apm'
import { APM_CLIENT_PROVIDER } from './ApmClientModule'
import { ApmTransactionStarted } from './ApmTransactionStarted'

@Injectable()
export class ApmService {
  private readonly logger = createLogger(ApmService.name)
  private readonly enabled: boolean

  constructor(@Optional() @Inject(APM_CLIENT_PROVIDER) private apm: apm.Agent) {
    this.enabled = !!this.apm
    this.logger.info(`APM Service ${this.apm ? 'Enabled' : 'Disabled'}`)
  }

  getApm() {
    if (!this.enabled) return

    return this.apm
  }

  getCurrentTransaction() {
    if (!this.enabled) return

    return this.apm.currentTransaction
  }

  getCurrentTraceparent() {
    if (!this.enabled) return

    return this.apm.currentTraceparent
  }

  startTransaction(
    transactionName: string,
    options?: apm.TransactionOptions,
  ): ApmTransactionStarted {
    if (!this.enabled) return

    this.logger.debug(
      { transactionName, options },
      'Manually start APM transaction',
    )
    const trans = this.apm.startTransaction(transactionName, 'async', options)
    return { traceParent: this.apm.currentTraceparent, trans }
  }
}
