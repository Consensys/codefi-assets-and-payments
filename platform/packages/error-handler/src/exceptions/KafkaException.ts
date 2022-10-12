import { BaseException } from './BaseException'
import { ErrorCode } from '../enums/ErrorCodeEnum'

export class KafkaException extends BaseException {
  constructor(errorName: string, message: string, payload: object) {
    super(ErrorCode.Kafka, errorName, message, payload)
  }
}
