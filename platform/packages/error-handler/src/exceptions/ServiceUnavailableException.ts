import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class ServiceUnavailableException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.ApplicationRequest, errorName, message, payload)
  }
}
