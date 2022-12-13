import { ValidationException } from '@consensys/error-handler'
import { ITransactionConfig } from '@consensys/messaging-events'
import { IHeaders } from '@consensys/nestjs-orchestrate'
import { IRawTransaction } from '@consensys/nestjs-orchestrate/dist/transactions/IRawTransaction'
import {
  ExecArgument,
  TokensDeployRequest,
  TokenType,
  TokenOperationType,
} from '@consensys/ts-types'
import { NestJSPinoLogger } from '@consensys/observability'

export type TokenConstructorParams = {
  name: string
  symbol: string
  decimals?: number
}

export abstract class TokenBaseService {
  constructor(
    protected readonly logger: NestJSPinoLogger,
    private readonly token: any,
    private readonly tokenType: TokenType,
  ) {}

  abstract deploy(
    deployRequest: TokensDeployRequest,
    authToken?: string,
    headers?: IHeaders,
  ): Promise<string | IRawTransaction>

  abstract contractConstructorParams(
    contractAddress: string,
    config: ITransactionConfig,
    authToken: string,
    headers: IHeaders,
  ): Promise<TokenConstructorParams>

  async exec(
    functionName: string,
    functionParams: ExecArgument[],
    txConfig: ITransactionConfig,
    tenantId: string,
    entityId: string,
    subject: string,
    operationId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<{
    transaction: string | IRawTransaction
    operationType: TokenOperationType
  }> {
    this.logger.info(
      { tenantId, entityId, operationId, functionName, functionParams },
      `Calling custom function`,
    )

    if (typeof this.token[functionName] !== 'function') {
      throw new ValidationException(
        'TokenFunctionNotImplemented',
        `tokenType=${this.tokenType} functionName=${functionName} is not a function`,
        { tokenType: this.tokenType, functionName },
      )
    }

    const operationType = this.extractOperation(functionName)
    if (!operationType) {
      throw new ValidationException(
        'OperationTypeNotAllowed',
        `tokenType=${this.tokenType} functionName=${functionName} does not have a TokenOperationType assigned`,
        { tokenType: this.tokenType, functionName },
      )
    }

    // "Write functions" include an optional 'idempotencyKey' in their parameters;
    // "Read functions" don't include an 'idempotencyKey' in their parameters;
    const parameters = [
      ...functionParams,
      txConfig,
      idempotencyKey,
      authToken,
      headers,
    ]

    const transaction = await this.token[functionName](...parameters)

    return { transaction, operationType }
  }

  protected safeIdempotencyKey(operationId: string, idempotencyKey: string) {
    return operationId && !idempotencyKey ? operationId : idempotencyKey
  }

  private extractOperation(functionName: string): TokenOperationType {
    const enumKey = Object.keys(TokenOperationType).find(
      (key) => TokenOperationType[key] == functionName,
    )

    return enumKey ? TokenOperationType[enumKey] : undefined
  }
}
