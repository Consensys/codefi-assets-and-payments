import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class UnauthorizedException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.ApplicationPermission, errorName, message, payload)
  }
}
