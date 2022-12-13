import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Error } from '../types/error'
import { createLogger } from '@consensys/observability'
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = createLogger('HttpExceptionFilter')
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const statusCode = exception.getStatus()
    const request = ctx.getRequest<Request>()
    const exceptionMessage = exception.message

    const error: Error = {
      statusCode: statusCode,
      message: exceptionMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    this.logger.error(
      `errorCode: ${statusCode}, message: ${exceptionMessage}, path: ${error.path}`,
    )

    response.status(statusCode).json(error)
  }
}
