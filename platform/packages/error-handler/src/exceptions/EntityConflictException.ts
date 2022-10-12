import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class EntityConflictException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.ApplicationConflict, errorName, message, payload)
  }
}
