import { ValidationException } from '@consensys/error-handler'
import { ITransactionConfig } from '@consensys/messaging-events'
import { IRawTransaction } from '@consensys/nestjs-orchestrate'
import {
  EntityStatus,
  ExecArgument,
  TokenType,
  TokensDeployRequest,
  TokensRegisterRequest,
  TokenOperationType,
  NewTokenResponse,
} from '@consensys/ts-types'
import { Injectable, NotFoundException } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { TokenEntity } from 'src/data/entities/TokenEntity'
import { ERC20Service } from './ERC20Service'
import { ERC721Service } from './ERC721Service'
import { TokensService } from './TokensService'
import { IHeaders, RawTransaction } from '@consensys/tokens'
import { TokenBaseService, TokenConstructorParams } from './TokenBaseService'
import { OperationEntity } from '../data/entities/OperationEntity'
import { OperationsService } from './OperationsService'
import { FindManyOptions } from 'typeorm'
import { transactionCounter } from '../utils/metrics'

@Injectable()
export class TokensManagerService {
  private readonly tokenServices: Map<TokenType, TokenBaseService>
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly erc20Service: ERC20Service,
    private readonly erc721Service: ERC721Service,
    private readonly tokensService: TokensService,
    private readonly operationsService: OperationsService,
  ) {
    logger.setContext(TokensManagerService.name)
    this.tokenServices = new Map()
    this.tokenServices.set(TokenType.ERC20, erc20Service)
    this.tokenServices.set(TokenType.ERC721, erc721Service)
  }

  async deploy(
    deployRequest: TokensDeployRequest,
    tenantId: string,
    entityId: string,
    subject: string,
    authToken: string,
    headers: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<NewTokenResponse> {
    const existingOperation = await this.getExistingOperation(
      deployRequest.operationId,
    )
    if (existingOperation) {
      const tokenEntity = await this.getExistingToken(existingOperation.id)
      return {
        token: tokenEntity,
        operation: existingOperation,
      }
    }

    if (deployRequest.confidential) {
      this.logger.error('Confidential token not implemented')
      throw new Error('Confidential token not implemented')
    }

    const tokenService = this.getTokenService(deployRequest.type)

    const txId = await tokenService.deploy(deployRequest, authToken, headers)

    const operationEntity = await this.createOperation({
      operationId: deployRequest.operationId,
      operationType: TokenOperationType.Deploy,
      transaction: txId,
      tenantId,
      entityId,
      chainName: deployRequest.config.chainName,
      createdBy: subject,
    })

    const tokenEntity = await this.saveToken(
      deployRequest,
      deployRequest.type,
      txId.toString(),
      operationEntity.id,
      deployRequest.config,
      tenantId,
      entityId,
      subject,
    )

    this.updateMetrics(operationEntity, tokenEntity)

    return {
      token: tokenEntity,
      operation: operationEntity,
    }
  }

  async register(
    registerRequest: TokensRegisterRequest,
    tenantId: string,
    entityId: string,
    subject: string,
    authToken: string,
    headers: IHeaders,
  ): Promise<NewTokenResponse> {
    const existingOperation = await this.getExistingOperation(
      registerRequest.operationId,
    )
    if (existingOperation) {
      const tokenEntity = await this.getExistingToken(existingOperation.id)
      return {
        token: tokenEntity,
        operation: existingOperation,
      }
    }

    const tokenService = this.getTokenService(registerRequest.type)

    let constructorParams: TokenConstructorParams
    try {
      constructorParams = await tokenService.contractConstructorParams(
        registerRequest.contractAddress,
        registerRequest.config,
        authToken,
        headers,
      )
    } catch (error) {
      this.logger.error(error)
      throw new Error(
        `Contract address ${registerRequest.contractAddress} does not match a ${registerRequest.type}`,
      )
    }

    const operationEntity = await this.createOperation({
      operationId: registerRequest.operationId,
      operationType: TokenOperationType.Register,
      status: EntityStatus.Confirmed,
      tenantId,
      entityId,
      chainName: registerRequest.config.chainName,
      createdBy: subject,
    })

    await this.saveToken(
      constructorParams,
      registerRequest.type,
      null,
      operationEntity.id,
      registerRequest.config,
      tenantId,
      entityId,
      subject,
      EntityStatus.Confirmed,
      registerRequest.contractAddress,
    )
  }

  async mint(
    type: TokenType,
    sender: string,
    value: string,
    tenantId: string,
    subject: string,
    txConfig: ITransactionConfig,
    operationId?: string,
    tokenEntityId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    entityId?: string,
  ): Promise<OperationEntity> {
    const existingOperation = await this.getExistingOperation(operationId)
    if (existingOperation) return existingOperation

    const token = await this.tokensService.findTokenByIdOrAddress({
      tokenEntityId,
      contractAddress: txConfig.to,
      chainName: txConfig.chainName,
    })

    const transactionConfig = { ...txConfig, to: token.contractAddress }

    const logger = this.logger.logger.child({
      tenantId,
      entityId,
      tokenType: type,
      operationId,
      contractAddress: transactionConfig.to,
      chainName: transactionConfig.chainName,
      recipient: sender,
      value,
    })

    let transaction: string | IRawTransaction

    switch (type) {
      case TokenType.ERC20:
        logger.info('Minting')
        const amount = value
        transaction = await this.erc20Service.mint(
          sender,
          amount,
          transactionConfig,
          tenantId,
          entityId,
          subject,
          operationId,
          idempotencyKey,
          authToken,
          headers,
        )
        break

      case TokenType.ERC721:
        logger.info('Minting')
        const tokenId = value
        transaction = await this.erc721Service.mint(
          sender,
          tokenId,
          transactionConfig,
          tenantId,
          entityId,
          subject,
          operationId,
          idempotencyKey,
          authToken,
          headers,
        )
        break

      default:
        const badTokenTypeError = 'Token type not recognized'
        logger.error(badTokenTypeError)
        throw new NotFoundException(badTokenTypeError)
    }

    const operation = await this.createOperation({
      operationId,
      operationType: TokenOperationType.Mint,
      transaction,
      tenantId,
      entityId,
      chainName: txConfig.chainName,
      createdBy: subject,
    })

    this.updateMetrics(operation, token)

    return operation
  }

  async burn(
    value: string,
    txConfig: ITransactionConfig,
    tenantId: string,
    subject: string,
    operationId: string,
    tokenEntityId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    entityId?: string,
  ): Promise<OperationEntity> {
    const existingOperation = await this.getExistingOperation(operationId)
    if (existingOperation) return existingOperation

    const token: TokenEntity = await this.tokensService.findTokenByIdOrAddress({
      tokenEntityId,
      contractAddress: txConfig.to,
      chainName: txConfig.chainName,
    })

    const transactionConfig = { ...txConfig, to: token.contractAddress }

    const logger = this.logger.logger.child({
      tenantId,
      entityId,
      operationId,
      contractAddress: transactionConfig.to,
      tokenType: token.type,
      value,
    })

    let transaction: string | RawTransaction

    switch (token.type) {
      case TokenType.ERC20:
        logger.info('Burning')
        const amount = value
        if (!amount) {
          throw new ValidationException(
            `Validation error`,
            '"amount" is required',
            {
              amount,
              token,
            },
          )
        }
        transaction = await this.erc20Service.burn(
          transactionConfig,
          tenantId,
          entityId,
          subject,
          amount,
          operationId,
          idempotencyKey,
          authToken,
          headers,
        )
        break

      case TokenType.ERC721:
        logger.info('Burning')
        const tokenId = value
        transaction = await this.erc721Service.burn(
          transactionConfig,
          tenantId,
          entityId,
          subject,
          tokenId,
          operationId,
          idempotencyKey,
          authToken,
          headers,
        )
        break

      default:
        const badTokenTypeError = 'Token type not recognized'
        logger.error(badTokenTypeError)
        throw new NotFoundException(badTokenTypeError)
    }

    const operation = await this.createOperation({
      operationId,
      operationType: TokenOperationType.Burn,
      transaction,
      tenantId,
      entityId,
      chainName: transactionConfig.chainName,
      createdBy: subject,
    })

    this.updateMetrics(operation, token)

    return operation
  }

  async transfer(
    type: TokenType,
    value: string,
    recipient: string,
    tenantId: string,
    subject: string,
    txConfig: ITransactionConfig,
    operationId?: string,
    tokenEntityId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    entityId?: string,
  ): Promise<OperationEntity> {
    const existingOperation = await this.getExistingOperation(operationId)
    if (existingOperation) return existingOperation

    const token: TokenEntity = await this.tokensService.findTokenByIdOrAddress({
      tokenEntityId,
      contractAddress: txConfig.to,
      chainName: txConfig.chainName,
    })

    const transactionConfig = { ...txConfig, to: token.contractAddress }

    let transaction: string | IRawTransaction

    const logger = this.logger.logger.child({
      tenantId,
      entityId,
      operationId,
      tokenType: type,
      contractAddress: transactionConfig.to,
      value,
    })

    switch (type) {
      case TokenType.ERC20:
        logger.info('Transferring')
        const amount = value
        transaction = await this.erc20Service.transfer(
          amount,
          recipient,
          tenantId,
          entityId,
          subject,
          transactionConfig,
          operationId,
          idempotencyKey,
          authToken,
          headers,
        )
        break

      case TokenType.ERC721:
        logger.info('Transferring')
        const tokenId = value
        transaction = await this.erc721Service.transfer(
          tokenId,
          recipient,
          tenantId,
          entityId,
          subject,
          transactionConfig,
          operationId,
          idempotencyKey,
          authToken,
          headers,
        )
        break

      default:
        const badTokenTypeError = 'Token type not recognized'
        logger.error(badTokenTypeError)
        throw new NotFoundException(badTokenTypeError)
    }

    const operation = await this.createOperation({
      operationId,
      operationType: TokenOperationType.Transfer,
      transaction,
      tenantId,
      entityId,
      chainName: transactionConfig.chainName,
      createdBy: subject,
    })

    this.updateMetrics(operation, token)

    return operation
  }

  async exec(
    functionName: string,
    params: ExecArgument[],
    txConfig: ITransactionConfig,
    tenantId: string,
    subject: string,
    tokenEntityId?: string,
    operationId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    entityId?: string,
  ): Promise<OperationEntity> {
    const existingOperation = await this.getExistingOperation(operationId)
    if (existingOperation) return existingOperation

    const token = await this.tokensService.findTokenByIdOrAddress({
      tokenEntityId,
      contractAddress: txConfig.to,
      chainName: txConfig.chainName,
    })

    const transactionConfig = { ...txConfig, to: token.contractAddress }
    const tokenService = this.getTokenService(token.type)

    const { transaction, operationType } = await tokenService.exec(
      functionName,
      params,
      transactionConfig,
      tenantId,
      entityId,
      subject,
      operationId,
      idempotencyKey,
      authToken,
      headers,
    )

    const operation = await this.createOperation({
      operationId,
      operationType,
      transaction,
      tenantId,
      entityId,
      chainName: transactionConfig.chainName,
      createdBy: subject,
    })

    this.updateMetrics(operation, token)

    return operation
  }

  async setTokenURI(
    tokenId: string,
    uri: string,
    txConfig: ITransactionConfig,
    tenantId: string,
    subject: string,
    tokenEntityId?: string,
    operationId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    entityId?: string,
  ): Promise<OperationEntity> {
    const existingOperation = await this.getExistingOperation(operationId)
    if (existingOperation) return existingOperation

    const token = await this.tokensService.findTokenByIdOrAddress({
      tokenEntityId,
      contractAddress: txConfig.to,
      chainName: txConfig.chainName,
    })

    const transactionConfig = { ...txConfig, to: token.contractAddress }

    const logger = this.logger.logger.child({
      tenantId,
      entityId,
      operationId,
      contractAddress: transactionConfig.to,
      tokenType: token.type,
      tokenId,
      uri,
    })

    if (token.type != TokenType.ERC721) {
      const notSupportedError = 'setTokenURI only supported on ERC721 tokens'
      logger.error(notSupportedError)
      throw new Error(notSupportedError)
    }

    logger.info({ tokenId, uri }, 'Setting Token URI')

    const transaction = await this.erc721Service.setTokenURI(
      tokenId,
      uri,
      transactionConfig,
      tenantId,
      entityId,
      subject,
      operationId,
      idempotencyKey,
      authToken,
      headers,
    )

    const operation = await this.createOperation({
      operationId,
      operationType: TokenOperationType.SetTokenURI,
      transaction,
      tenantId,
      entityId,
      chainName: transactionConfig.chainName,
      createdBy: subject,
    })

    this.updateMetrics(operation, token)

    return operation
  }

  private getTokenService(type: TokenType) {
    const tokenService = this.tokenServices.get(type)
    if (!tokenService) {
      throw new ValidationException(
        'TokenNotImplemented',
        `tokenType=${type} is not implemented`,
        { type: type },
      )
    }
    return tokenService
  }

  private async createOperation({
    operationId,
    operationType,
    transaction,
    tenantId,
    entityId,
    chainName,
    createdBy,
    status,
  }: {
    operationId?: string
    operationType: TokenOperationType
    transaction?: string | IRawTransaction
    tenantId: string
    entityId: string
    chainName: string
    createdBy: string
    status?: EntityStatus
  }): Promise<OperationEntity> {
    const transactionId = transaction?.toString()

    const existingOperationForTransaction =
      await this.operationsService.findOperationByTransactionId(transactionId)

    /* Avoid monitoring the same transaction in multiple operations so:
       1 - We don't have to check if a transaction is already complete when creating operations.
       2 - We don't have to update multiple operations when processing blockchain receipts from Orchestrate. */
    if (existingOperationForTransaction) {
      throw new Error(
        `Transaction already has an operation record - Transaction ID: ${transactionId} | Existing Operation ID: ${existingOperationForTransaction.id}`,
      )
    }

    return await this.operationsService.create({
      operationId,
      operationType,
      transactionId,
      tenantId,
      entityId,
      chainName,
      createdBy,
      status,
    })
  }

  private async saveToken(
    constructorParams: TokenConstructorParams,
    type: TokenType,
    transactionId: string,
    operationId: string,
    config: ITransactionConfig,
    tenantId: string,
    entityId: string,
    subject: string,
    status: EntityStatus = EntityStatus.Pending,
    contractAddress?: string,
  ): Promise<TokenEntity> {
    const tokenToSave: TokenEntity = {
      id: undefined,
      name: constructorParams.name,
      symbol: constructorParams.symbol,
      decimals: constructorParams.decimals,
      status,
      type,
      chainName: config.chainName,
      deployerAddress: config.from,
      contractAddress,
      operationId,
      transactionId,
      tenantId,
      entityId,
      createdBy: subject,
      createdAt: new Date(),
    }

    return await this.tokensService.save(tokenToSave)
  }

  private async getExistingOperation(
    operationId?: string,
  ): Promise<OperationEntity | undefined> {
    if (!operationId) return undefined

    const operations = (
      await this.operationsService.getAll({
        id: operationId,
      } as FindManyOptions<OperationEntity>)
    )[0]

    if (operations.length) {
      this.logger.info(
        { operationId },
        `Existing operation found with matching ID, skipping further processing`,
      )
    }

    /* Skip processing if an operation already exists with the same ID so:
     1 - We don't unintentionally duplicate transactions on the blockchain 
         if we receive duplicate requests or commands.
     2 - We don't have to try track multiple transactions with the
         same operation ID. */

    return operations.length ? operations[0] : undefined
  }

  private async getExistingToken(
    operationId: string,
  ): Promise<TokenEntity | undefined> {
    if (!operationId) return undefined

    const tokens = (
      await this.tokensService.getAll({
        operationId: operationId,
      } as FindManyOptions<TokenEntity>)
    )[0]

    return tokens.length ? tokens[0] : undefined
  }

  private updateMetrics(operation: OperationEntity, token: TokenEntity) {
    transactionCounter.inc({
      operationType: operation.operation,
      tokenType: token.type,
      status: EntityStatus.Pending,
    })
  }
}
