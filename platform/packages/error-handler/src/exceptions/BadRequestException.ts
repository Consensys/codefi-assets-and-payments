import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class BadRequestException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.ApplicationRequest, errorName, message, payload)
  }
}
