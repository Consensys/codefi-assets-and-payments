import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response } from 'express'
import { ApmService } from './ApmService'
import { decodeToken } from './utils'

@Injectable()
export class TenantIdMiddleware implements NestMiddleware {
  constructor(private readonly apmService: ApmService) {}

  use(req: Request, res: Response, next) {
    ;(async () => {
      const decodedToken = decodeToken(req) ?? {}
      const tenantId =
        decodedToken[process.env.AUTH_ACCEPTED_AUDIENCE]?.tenantId ?? ''
      const entityId =
        decodedToken[process.env.AUTH_ACCEPTED_AUDIENCE]?.entityId ?? ''
      //inject data into req context
      req.headers['entityId'] = entityId
      req.headers['tenantId'] = tenantId
      try {
        const currentTransaction = this.apmService.getCurrentTransaction()

        if (currentTransaction) {
          currentTransaction.setLabel('tenantId', tenantId)
          currentTransaction.setLabel('entityId', entityId)
          req.headers['transactionId']
        } else {
          this.apmService.startTransaction(`Request: ${req.url}`)
          const currentTransaction = this.apmService.getCurrentTransaction()
          currentTransaction.setLabel('tenantId', tenantId)
          currentTransaction.setLabel('entityId', entityId)
        }
      } catch (err) {
        //allow silently fail.
      }
    })().catch(() => {
      // Allow silent fail
    })

    next()
  }
}
