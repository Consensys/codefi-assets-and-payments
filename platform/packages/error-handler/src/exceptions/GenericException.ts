import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class GenericException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.Application, errorName, message, payload)
  }
}
