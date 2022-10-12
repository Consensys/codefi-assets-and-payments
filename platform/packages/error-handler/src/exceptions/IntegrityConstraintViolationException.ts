import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class IntegrityConstraintViolationException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.Database, errorName, message, payload)
  }
}
