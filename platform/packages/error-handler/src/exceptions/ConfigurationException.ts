import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class ConfigurationException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.Configuration, errorName, message, payload)
  }
}
