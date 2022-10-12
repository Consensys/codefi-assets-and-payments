import { ApmClientModule } from './ApmClientModule'
import { ApmModule } from './ApmModule'
import { ApmService } from './ApmService'
import { ApmTransactionStarted } from './ApmTransactionStarted'
import { TenantIdMiddleware } from './TenantId.middleware'
import { ExceptionInterceptor } from './Exception.intercepter'
import { CodefiLoggerModule } from './CodefiLoggerModule'
import { Logger, LoggerModule, PinoLogger } from 'nestjs-pino'

export {
  ApmClientModule,
  ApmModule,
  ApmService,
  ApmTransactionStarted,
  TenantIdMiddleware,
  ExceptionInterceptor,
  CodefiLoggerModule,
  Logger,
  LoggerModule,
  PinoLogger as NestJSPinoLogger
}
