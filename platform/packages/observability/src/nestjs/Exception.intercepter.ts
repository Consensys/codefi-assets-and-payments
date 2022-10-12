import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { catchError } from 'rxjs/operators'
import { PinoLogger } from 'nestjs-pino'
import { Observable, throwError } from 'rxjs'
import { ApmService } from './ApmService'
import { Request } from 'express'

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: PinoLogger,
    private readonly apmService: ApmService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    const request: Request = ctx.getRequest()

    let currentTransaction
    let transactionIds
    
    (async () => {
      //may fail to get transaction
      currentTransaction = await this.apmService.getCurrentTransaction()
      transactionIds = currentTransaction?.ids
    })().catch(() => {
      // Allow silent fail
    })

    return next.handle().pipe(
      catchError((error) => {
        //log the request and its payload for log aggregation
        this.logger.debug(
          {},
          `[Exception] -  Method:${request.method} | Path:${
            request.url
          } | TransactionId: ${transactionIds?.['transaction.id']} | TraceId: ${
            transactionIds?.['trace.id']
          } | TenantId: ${request?.headers?.['tenantId']} | EntityId: ${
            request.headers?.['entityId']
          } | Payload: ${JSON.stringify(
            request?.body,
          )} | Error: ${JSON.stringify(error)}`,
        )
        return throwError(() => error)
      }),
    )
  }
}
