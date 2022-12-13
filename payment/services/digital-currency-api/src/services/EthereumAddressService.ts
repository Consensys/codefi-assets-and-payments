import { WalletType } from '@consensys/ts-types'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { NestJSPinoLogger } from '@consensys/observability'
import { Repository, UpdateResult } from 'typeorm'
import { EthereumAddressEntity } from '../data/entities/EthereumAddressEntity'
import { v4 as uuidv4 } from 'uuid'
import { ParamValidationPipe } from '../validation/ParamValidationPipe'

@Injectable()
export class EthereumAddressService {
  constructor(
    private logger: NestJSPinoLogger,
    @InjectRepository(EthereumAddressEntity)
    private readonly ethereumAddressRepository: Repository<EthereumAddressEntity>,
  ) {
    this.logger.setContext(EthereumAddressService.name)
  }

  async create(
    entityId: string,
    address: string,
    type: WalletType,
    metadata: string,
  ): Promise<EthereumAddressEntity> {
    // TODO: once entity-api send idempotencyKey/uuid we need to use it as Id and potentially use insert instead of save to throw an error in case of duplicate events
    this.logger.info(
      `Creating Ethereum Address for entityId=${entityId}, address=${address}, type=${type}, metadata=${metadata}`,
    )
    const entityToSave: EthereumAddressEntity = {
      id: uuidv4(),
      entityId,
      address,
      type,
      metadata,
      createdAt: new Date(),
    }
    return this.ethereumAddressRepository.save(entityToSave)
  }

  async findOne(
    params: Partial<EthereumAddressEntity>,
  ): Promise<EthereumAddressEntity> {
    this.logger.info(
      `findOne ethereum address with params=${JSON.stringify(params)}`,
    )
    const result = this.ethereumAddressRepository.findOne(params)
    if (!result) {
      this.logger.warn(
        `Ethereum address with params=${JSON.stringify(params)} not found`,
      )
    }
    return result
  }

  async findAndUpdate(
    params: Partial<EthereumAddressEntity>,
    metadata: string,
  ): Promise<number> {
    this.logger.info(
      `findAndUpdate, params=${JSON.stringify(
        params,
      )}, metadata=${JSON.stringify(metadata)}`,
    )
    return (
      await this.ethereumAddressRepository.update(params, {
        metadata,
      })
    ).affected
  }

  async delete(params: Partial<EthereumAddressEntity>): Promise<number> {
    this.logger.info(`delete, params=${JSON.stringify(params)}`)
    const result = await this.ethereumAddressRepository.delete(params)
    return result.affected
  }
}
