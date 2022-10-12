import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class ContractDeploymentException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.BlockchainContractDeployment, errorName, message, payload)
  }
}
