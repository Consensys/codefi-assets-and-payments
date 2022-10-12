import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class ValidationException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.ApplicationValidation, errorName, message, payload)
  }
}
