import { HttpException, HttpStatus } from '@nestjs/common'

export class Auth0Exception extends HttpException {
  constructor(message?: string | object | any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR)
  }
}
