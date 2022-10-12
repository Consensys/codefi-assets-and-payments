import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class MessagingConnectionException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.MessageConnection, errorName, message, payload)
  }
}
