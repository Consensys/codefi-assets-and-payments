import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class ProcessingMessageException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.ProcessingMessage, errorName, message, payload)
  }
}
