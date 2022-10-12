import { ErrorCode } from '../enums/ErrorCodeEnum'

export class BaseException extends Error {
  readonly errorCode: ErrorCode
  private readonly errorName: string
  private readonly payload: object
  /**
   * Extend BaseException to create a new Exception.
   *
   * @param errorCode ErrorCode general error which can apply to multiple microservice situations
   * @param errorName string unique name error specific to a microservice
   * @param message string message describing the error
   * @param payload object or any extra relevant information
   */
  constructor(
    errorCode: ErrorCode,
    errorName: string,
    message: string,
    payload: object,
  ) {
    super(message)
    this.errorCode = errorCode
    this.errorName = errorName
    this.payload = payload
  }
}
