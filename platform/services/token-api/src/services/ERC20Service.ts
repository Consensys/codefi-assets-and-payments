import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { ERC20Token, IHeaders, RawTransaction } from '@codefi-assets-and-payments/tokens'
import { TokensDeployRequest, TokenType } from '@codefi-assets-and-payments/ts-types'
import { IRawTransaction } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { ITransactionConfig } from '@codefi-assets-and-payments/messaging-events'
import { unpadHex } from '../utils/bignumberUtils'
import { TokenBaseService, TokenConstructorParams } from './TokenBaseService'

@Injectable()
export class ERC20Service extends TokenBaseService {
  constructor(logger: NestJSPinoLogger, private readonly erc20Token: ERC20Token) {
    super(logger, erc20Token, TokenType.ERC20)
    logger.setContext(ERC20Service.name)
  }

  async burn(
    config: ITransactionConfig,
    tenantId: string,
    entityId: string,
    subject: string,
    amount: string,
    operationId?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    const logger = this.logger.logger.child({
      tenantId,
      entityId,
      chainName: config.chainName,
      operationId,
      contractAddress: config.to,
      tokenType: TokenType.ERC20,
      amount,
    })

    logger.info(`Started ERC20 burn`)

    const result = await this.erc20Token.burn(
      unpadHex(amount),
      config,
      this.safeIdempotencyKey(operationId, idempotencyKey),
      authToken,
      headers,
      { operationId },
    )

    logger.info({ transactionId: result }, 'Completed ERC20 burn')

    return result
  }

  async deploy(
    deployRequest: TokensDeployRequest,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | IRawTransaction> {
    const logger = this.logger.logger.child({
      operationId: deployRequest.operationId,
      chainName: deployRequest.config.chainName,
      tokenType: TokenType.ERC20,
      name: deployRequest.name,
      symbol: deployRequest.symbol,
      decimals: deployRequest.decimals,
    })

    logger.info('Started ERC20 deploy')

    const result = await this.erc20Token.create(
      deployRequest.name,
      deployRequest.symbol,
      deployRequest.decimals,
      deployRequest.config,
      this.safeIdempotencyKey(
        deployRequest.operationId,
        deployRequest.idempotencyKey,
      ),
      authToken,
      headers,
      { operationId: deployRequest.operationId },
    )

    logger.info({ transactionId: result }, 'Completed ERC20 deploy')

    return result
  }

  async contractConstructorParams(
    contractAddress: string,
    config: ITransactionConfig,
    authToken: string,
    headers: IHeaders,
  ): Promise<TokenConstructorParams> {
    // Retrieve token information on-chain
    const name = await this.erc20Token.name(
      contractAddress,
      config,
      authToken,
      headers,
    )
    const symbol = await this.erc20Token.symbol(
      contractAddress,
      config,
      authToken,
      headers,
    )
    const decimals = await this.erc20Token.decimals(
      contractAddress,
      config,
      authToken,
      headers,
    )

    return { name, symbol, decimals: parseInt(decimals) }
  }

  async mint(
    sender: string,
    amount: string,
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
      tokenType: TokenType.ERC20,
      amount,
      recipient: sender,
    })

    logger.info('Started ERC20 mint')

    const result = await this.erc20Token.mint(
      sender,
      unpadHex(amount),
      txConfig,
      this.safeIdempotencyKey(operationId, idempotencyKey),
      authToken,
      headers,
      { operationId },
    )

    logger.info({ transactionId: result }, 'Completed ERC20 mint')

    return result
  }

  async transfer(
    amount: string,
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
      tokenType: TokenType.ERC20,
      amount,
      sender: txConfig.from,
      recipient,
    })

    logger.info('Started ERC20 transfer')

    idempotencyKey = this.safeIdempotencyKey(operationId, idempotencyKey)

    const result = await this.erc20Token.transfer(
      recipient,
      unpadHex(amount),
      txConfig,
      idempotencyKey,
      authToken,
      headers,
      { operationId },
    )

    logger.info({ transactionId: result }, 'Completed ERC20 transfer')

    return result
  }
}
