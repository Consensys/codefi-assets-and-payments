import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TenantEntity } from '../data/entities/TenantEntity'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

@Injectable()
export class TenantService {
  constructor(
    private logger: NestJSPinoLogger,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {
    this.logger.setContext(TenantService.name)
  }

  async create(
    id: string,
    name: string,
    metadata: string,
    defaultNetworkKey: string,
  ): Promise<TenantEntity> {
    this.logger.info(
      `Creating tenant: id=${id}, name=${name}, metadata=${metadata}, defaultNetworkKey=${defaultNetworkKey}`,
    )
    const entityToSave: TenantEntity = {
      id,
      name,
      metadata,
      defaultNetworkKey,
      createdAt: new Date(),
    }

    // Insert rather than save so we throw an error if an operation already exists
    await this.tenantRepository.insert(entityToSave)
    return this.tenantRepository.findOneOrFail(id)
  }

  async findOne(params: Partial<TenantEntity>): Promise<TenantEntity> {
    this.logger.info(`Finding tenant by ${JSON.stringify(params)}`)
    const result = await this.tenantRepository.findOne(params)
    if (!result) {
      this.logger.warn(`Tenant not found`)
    }
    return result
  }

  async update(
    params: Partial<TenantEntity>,
    updated: Partial<TenantEntity>,
  ): Promise<number> {
    this.logger.info(
      `Updating tenant, params=${JSON.stringify(
        params,
      )}, updatedTo=${JSON.stringify(updated)}`,
    )
    const result = await this.tenantRepository.update(params, updated)
    return result.affected
  }

  async delete(id: string): Promise<number> {
    const result = await this.tenantRepository.delete({
      id,
    })
    return result.affected
  }
}
