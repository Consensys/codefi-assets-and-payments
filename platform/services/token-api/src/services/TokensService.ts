import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { FindManyOptions, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { v4 as uuidv4 } from 'uuid'
import { TokenEntity } from '../data/entities/TokenEntity'
import {
  EntityNotFoundException,
  ValidationException,
} from '@consensys/error-handler'
import { TokenType } from '@consensys/ts-types'

@Injectable()
export class TokensService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,
  ) {
    logger.setContext(TokensService.name)
  }

  getAll(filter?: FindManyOptions<TokenEntity>) {
    return this.tokenRepository.findAndCount(filter)
  }

  async findTokenBy(params: Partial<TokenEntity>): Promise<TokenEntity> {
    return await this.tokenRepository.findOne(params)
  }

  async findById(id: string): Promise<TokenEntity> {
    return await this.tokenRepository.findOne(id)
  }

  async findTokenByIdOrAddress({
    tokenEntityId,
    contractAddress,
    chainName,
  }: {
    tokenEntityId?: string
    contractAddress?: string
    chainName?: string
    type?: TokenType
  }) {
    if (!tokenEntityId && (!contractAddress || !chainName)) {
      throw new ValidationException(
        'FetchTokenParameters',
        'Either tokenEntityId or (contractAddress and chainName) are required',
        { tokenEntityId, contractAddress, chainName },
      )
    }

    const [token, errorMessage, errorPayload] = tokenEntityId
      ? [
          await this.findById(tokenEntityId),
          `Token entity not found id=${tokenEntityId}`,
          { tokenEntityId },
        ]
      : [
          await this.findTokenBy({ contractAddress, chainName }),
          `Token entity not found contractAddress=${contractAddress} chainName=${chainName}`,
          { contractAddress, chainName },
        ]

    if (!token) {
      throw new EntityNotFoundException(
        'TokenNotFound',
        errorMessage,
        errorPayload,
      )
    }

    return token
  }

  async update(
    tokenParams: Partial<TokenEntity>,
    token: Partial<TokenEntity>,
  ): Promise<number> {
    const result = await this.tokenRepository.update(tokenParams, token)
    return result.affected
  }

  async save(tokenToSave: TokenEntity): Promise<TokenEntity> {
    const id = tokenToSave.id || uuidv4()
    this.logger.info(
      {
        tokenType: tokenToSave.type,
        tokenId: id,
        tenantId: tokenToSave.tenantId,
        entityId: tokenToSave.entityId,
        operationId: tokenToSave.operationId,
      },
      `Saving token`,
    )
    return await this.tokenRepository.save({ ...tokenToSave, id })
  }
}
