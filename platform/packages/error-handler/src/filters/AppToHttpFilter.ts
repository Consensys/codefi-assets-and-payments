import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common'
import { Request, Response } from 'express'
import { ErrorCode } from '../enums/ErrorCodeEnum'
import { createLogger } from '@consensys/observability'

/**
 * This filter is meant to transform application errors or exceptions
 * into HTTP responses.
 * Application exceptions are thrown from non HTTP-specific components (e.g. services)
 * and are mapped in the controllers. We don't want to throw HTTP-specific exceptions
 * from components that can be used with different entry points (e.g. Kafka)
 */
// Used to be @Catch(BaseException) instead of @Catch(Error) but the problem is the type BaseException is not
// recognized by NestJs, when Exception was thrown within a package.
@Catch(Error)
export class AppToHttpFilter implements ExceptionFilter {
  private logger = createLogger('AppToHttpFilter')

  catch(exception: any, host: ArgumentsHost) {
    // exception is a BaseException
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const exceptionMessage = exception.message

    let status = 500
    if (exception.errorCode) {
      // This switches between custom error code strings
      switch (exception.errorCode) {
        case ErrorCode.ApplicationValidation: //Validation
          status = 422
          break
        case ErrorCode.ApplicationNotFound: //EntityNotFound
          status = 404
          break
        case ErrorCode.ApplicationConflict: //EntityConflict
          status = 409
          break
        case ErrorCode.Database: //DatabaseConnection
          status = 503
          break
        case ErrorCode.MessageConnection: //MessagingConnection
          status = 503
          break
        case ErrorCode.ProcessingMessage: // Something needs yet to happen
          status = 503
          break
        case ErrorCode.Configuration: //Configuration
        case ErrorCode.Application: //Application generic
        case ErrorCode.ExternalDependencyError: //ExternalDependencyError
          status = 500
          break
        case ErrorCode.ApplicationPermission: // UnauthorizedException
          status = 403
          break
        case ErrorCode.ApplicationRequest: // BadRequest
          status = 400
          break
      }
      // This is to catch all "non custom" NestJs framework number error codes
    } else if (exception.status && typeof exception.status === 'number') {
      status = exception.status
    }

    let error: any = {
      statusCode: status,
      message: exceptionMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    }
    if (exception.errorName) {
      error = {
        ...error,
        errorCode: exception.errorName,
      }
    }
    this.logger.error(
      { errorPayload: exception.payload },
      `errorCode: ${exception.errorCode}, errorName: ${exception.errorName}, message: ${exceptionMessage}}`,
    )
    response.status(status).json(error)
  }
}
