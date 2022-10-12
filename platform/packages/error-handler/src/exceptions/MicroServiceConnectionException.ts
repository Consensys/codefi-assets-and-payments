import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class MicroServiceConnectionException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.MicroserviceConnection, errorName, message, payload)
  }
}
