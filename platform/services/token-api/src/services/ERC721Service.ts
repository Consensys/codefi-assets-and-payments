import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { ERC721Token, IHeaders, RawTransaction } from '@consensys/tokens'
import { TokensDeployRequest, TokenType } from '@consensys/ts-types'
import { IRawTransaction } from '@consensys/nestjs-orchestrate/dist/transactions/IRawTransaction'
import { ITransactionConfig } from '@consensys/messaging-events'
import { TokenBaseService, TokenConstructorParams } from './TokenBaseService'

@Injectable()
export class ERC721Service extends TokenBaseService {
  constructor(logger: NestJSPinoLogger, private readonly erc721Token: ERC721Token) {
    super(logger, erc721Token, TokenType.ERC721)
    logger.setContext(ERC721Token.name)
  }

  async burn(
    config: ITransactionConfig,
    tenantId: string,
    entityId: string,
    subject: string,
    tokenId: string,
    operationId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    const logger = this.logger.logger.child({
      operationId,
      tenantId,
      entityId,
      chainName: config.chainName,
      contractAddress: config.to,
      tokenType: TokenType.ERC721,
      tokenId,
    })

    logger.info('Started ERC721 burn')

    const result = await this.erc721Token.burn(
      tokenId,
      config,
      this.safeIdempotencyKey(operationId, idempotencyKey),
      authToken,
      headers,
      { operationId },
    )

    logger.info({ transactionId: result }, 'Completed ERC721 burn')

    return result
  }

  async deploy(
    deployRequest: TokensDeployRequest,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | IRawTransaction> {
    const logger = this.logger.logger.child({
      operationid: deployRequest.operationId,
      chainName: deployRequest.config.chainName,
      tokenType: TokenType.ERC721,
      name: deployRequest.name,
      symbol: deployRequest.symbol,
    })

    logger.info('Started ERC721 deploy')

    const result = await this.erc721Token.create(
      deployRequest.name,
      deployRequest.symbol,
      deployRequest.config,
      deployRequest.idempotencyKey,
      authToken,
      headers,
      { operationId: deployRequest.operationId },
    )

    logger.info({ transactionId: result }, 'Completed ERC721 burn')

    return result
  }

  async contractConstructorParams(
    contractAddress: string,
    config: ITransactionConfig,
    authToken: string,
    headers: IHeaders,
  ): Promise<TokenConstructorParams> {
    // Retrieve token information on-chain
    const name = await this.erc721Token.name(
      contractAddress,
      config,
      authToken,
      headers,
    )
    const symbol = await this.erc721Token.symbol(
      contractAddress,
      config,
      authToken,
      headers,
    )

    return { name, symbol }
  }

  async mint(
    sender: string,
    tokenId: string,
    txConfig: ITransactionConfig,
    tenantId: string,
    entityId: string,
    subject: string,
    operationId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    const logger = this.logger.logger.child({
      tenantId,
      entityId,
      operationId,
      chainName: txConfig.chainName,
      contractAddress: txConfig.to,
      tokenType: TokenType.ERC721,
      tokenId,
      recipient: sender,
    })

    logger.info(`Started ERC721 mint`)

    const result = await this.erc721Token.mint(
      sender,
      tokenId,
      txConfig,
      this.safeIdempotencyKey(operationId, idempotencyKey),
      authToken,
      headers,
      { operationId },
    )

    logger.info({ transactionId: result }, 'Completed ERC721 mint')

    return result
  }

  async transfer(
    tokenId: string,
    recipient: string,
    tenantId: string,
    entityId: string,
    subject: string,
    txConfig: ITransactionConfig,
    operationId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    const logger = this.logger.logger.child({
      tenantId,
      entityId,
      operationId,
      chainName: txConfig.chainName,
      contractAddress: txConfig.to,
      tokenType: TokenType.ERC721,
      tokenId,
      sender: txConfig.from,
      recipient,
    })

    logger.info('Started ERC721 transfer')

    const result = await this.erc721Token.transferFrom(
      txConfig.from,
      recipient,
      tokenId,
      txConfig,
      this.safeIdempotencyKey(operationId, idempotencyKey),
      authToken,
      headers,
      { operationId },
    )

    logger.info({ transactionId: result }, 'Completed ERC721 transfer')

    return result
  }

  async transferOwnership(
    newOwnerAddress: string,
    txConfig: ITransactionConfig,
    tenantId: string,
    entityId: string,
    subject: string,
    operationId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    const logger = this.logger.logger.child({
      tenantId,
      entityId,
      operationId,
      chainName: txConfig.chainName,
      contractAddress: txConfig.to,
      tokenType: TokenType.ERC721,
      newOwnerAddress,
    })

    logger.info(`Started ERC721 transfer ownership`)

    const result = await this.erc721Token.transferOwnership(
      newOwnerAddress,
      txConfig,
      this.safeIdempotencyKey(operationId, idempotencyKey),
      authToken,
      headers,
      { operationId },
    )

    logger.info(
      { transactionId: result },
      'Completed ERC721 transfer ownership',
    )

    return result
  }

  async setTokenURI(
    tokenId: string,
    uri: string,
    txConfig: ITransactionConfig,
    tenantId: string,
    entityId: string,
    subject: string,
    operationId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | IRawTransaction> {
    const logger = this.logger.logger.child({
      tenantId,
      entityId,
      operationId,
      chainName: txConfig.chainName,
      contractAddress: txConfig.to,
      tokenType: TokenType.ERC721,
      tokenId,
      uri,
    })

    logger.info(`Started ERC721 set token URI`)

    const result = await this.erc721Token.setTokenURI(
      tokenId,
      uri,
      txConfig,
      this.safeIdempotencyKey(operationId, idempotencyKey),
      authToken,
      headers,
      { operationId },
    )

    logger.info({ transactionId: result }, 'Completed ERC721 set token URI')

    return result
  }
}
