import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Auth0Exception } from '../errors/Auth0Exception'

@Catch(Auth0Exception)
export class Auth0ExceptionsFilter implements ExceptionFilter {
  private logger: Logger
  constructor() {
    this.logger = new Logger('Auth0ExceptionsFilter')
  }
  catch(exception: any, host: ArgumentsHost) {
    try {
      const ctx = host.switchToHttp()
      const response = ctx.getResponse()
      let status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR
      const message = exception.response
      let customMessage

      if (message.message === 'Client not found') {
        status = HttpStatus.NOT_FOUND
        customMessage = 'The specified resource was not found'
      } else if (
        message.message &&
        message.message.includes('Payload validation error')
      ) {
        status = HttpStatus.UNPROCESSABLE_ENTITY
        customMessage = message.message
      } else {
        switch (message.statusCode || exception.status) {
          case 409:
            status = HttpStatus.CONFLICT
            customMessage = 'A resource with this identifier already exists'
            break
          case 400:
            status = HttpStatus.BAD_REQUEST
            customMessage = message.message
            break
          case 404:
            status = HttpStatus.NOT_FOUND
            customMessage = 'The specified resource was not found'
            break
          default:
            status = HttpStatus.INTERNAL_SERVER_ERROR
            customMessage = message.message
            break
        }
      }
      const customResponse = { statusCode: status, message: customMessage }
      this.logger.log(
        customResponse.message,
        customResponse.statusCode.toString(),
      )
      response.status(status).json(customResponse)
    } catch (error) {
      this.logger.error('Error filtering Auth0 exception', error)
    }
  }
}
