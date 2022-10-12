import { IEntityWallet } from '@codefi-assets-and-payments/messaging-events'
import { EntityStatus, WalletType } from '@codefi-assets-and-payments/ts-types'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Repository } from 'typeorm'
import { LegalEntityEntity } from '../data/entities/LegalEntityEntity'

@Injectable()
export class LegalEntityService {
  constructor(
    private logger: NestJSPinoLogger,
    @InjectRepository(LegalEntityEntity)
    private readonly legalEntityRepository: Repository<LegalEntityEntity>,
  ) {
    this.logger.setContext(LegalEntityService.name)
  }
  async create(
    legalEntityId: string,
    legalEntityName: string,
    ethereumAddress: string,
    orchestrateChainName: string,
    tenantId: string,
    issuer: boolean,
    createdBy?: string,
    createdAt?: Date,
    metadata?: any,
  ): Promise<LegalEntityEntity> {
    this.logger.info(
      `creating legal entity, legalEntityId=${legalEntityId}, legalEntityName=${legalEntityName}, ethereumAddress=${ethereumAddress}, orchestrateChainName=${orchestrateChainName}`,
    )
    const result = await this.legalEntityRepository.save({
      id: legalEntityId,
      legalEntityName,
      ethereumAddress,
      orchestrateChainName,
      status: EntityStatus.Confirmed,
      tenantId,
      issuer,
      createdBy,
      createdAt,
      metadata,
    })

    return result
  }

  async existsLegalEntityWith(
    params: Partial<LegalEntityEntity>,
  ): Promise<boolean> {
    return !!(await this.legalEntityRepository.findOne(params))
  }

  async findOne(
    params: Partial<LegalEntityEntity>,
  ): Promise<LegalEntityEntity> {
    this.logger.info(
      `find legal entity, legalEntityId=${params.id}, tenantId=${params.tenantId}`,
    )
    const result = await this.legalEntityRepository.findOne(params)
    if (!result) {
      this.logger.warn(
        `Entity id=${params.id} not registered for params=${JSON.stringify(
          params,
        )}`,
      )
    }
    return result
  }

  async findAll(
    query: Partial<LegalEntityEntity>,
  ): Promise<LegalEntityEntity[]> {
    this.logger.info(`find all legal entities for tenantId=${query.tenantId}`)
    const result = await this.legalEntityRepository.find(query)
    return result
  }

  async delete(params: Partial<LegalEntityEntity>) {
    this.logger.info(
      `Deleting legal entity, id=${params.id}, name=${params.legalEntityName}`,
    )
    await this.legalEntityRepository.delete(params)
  }

  async update(
    params: Partial<LegalEntityEntity>,
    update: Partial<LegalEntityEntity>,
  ): Promise<number> {
    this.logger.info(
      `Updating legal entity, id=${update.id}, name=${update.legalEntityName}`,
    )
    const result = await this.legalEntityRepository.update(params, update)
    this.logger.info(`${result.affected} Legal entity updated, id=${update.id}`)
    return result.affected
  }
}
