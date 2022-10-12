import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class BlockchainConnectionException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.BlockchainConnection, errorName, message, payload)
  }
}
