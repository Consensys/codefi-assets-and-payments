import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class TransactionRevertedException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.BlockchainTransaction, errorName, message, payload)
  }
}
