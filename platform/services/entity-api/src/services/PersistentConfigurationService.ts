import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import config from '../config'
import { sleep } from '../utils/utils'
import { QueryFailedError, Repository } from 'typeorm'
import { TenantService } from './TenantService'
import { InjectRepository } from '@nestjs/typeorm'
import { WalletEntity } from '../data/entities/WalletEntity'
import { TenantEntity } from '../data/entities/TenantEntity'
import { EntityEntity } from '../data/entities/EntityEntity'
import { EntityService } from './EntityService'
import { WalletService } from './WalletService'
import {
  TenantCreateRequest,
  EntityCreateRequest,
  WalletCreateRequest,
} from '@consensys/ts-types'

@Injectable()
export class PersistentConfigurationService {
  private readonly DB_MIGRATIONS_MAX_RETRY = 10
  private readonly DB_MIGRATIONS_RETRY_SLEEP_IN_MS = 1000

  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly tenantService: TenantService,
    private readonly entityService: EntityService,
    private readonly walletService: WalletService,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(EntityEntity)
    private readonly entityRepository: Repository<EntityEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
  ) {
    this.logger.setContext(PersistentConfigurationService.name)
  }

  async performConfiguration() {
    if (!config().performInitialConfiguration) {
      this.logger.info(`Initial configuration will not be performed`)
      return
    }
    const initialTenantsToCreate: TenantCreateRequest[] = JSON.parse(
      config().initialTenantsToCreate,
    )
    const initialEntitiesToCreate: (EntityCreateRequest & {
      tenantId: string
    })[] = JSON.parse(config().initialEntitiesToCreate)
    const initialWalletsToCreate: (WalletCreateRequest & {
      tenantId: string
      entityId: string
    })[] = JSON.parse(config().initialWalletsToCreate)

    let migrationsCompleted = false
    let counter = 0
    while (!migrationsCompleted) {
      try {
        await this.tenantRepository.findOne({})
        await this.entityRepository.findOne({})
        await this.walletRepository.findOne({})
        migrationsCompleted = true
      } catch (error) {
        if (error instanceof QueryFailedError) {
          this.logger.warn(
            `DB tables do not exist. Sleep and retry to wait for DB migrations to finish - ${counter}/${this.DB_MIGRATIONS_MAX_RETRY}`,
          )
          counter++
          await sleep(this.DB_MIGRATIONS_RETRY_SLEEP_IN_MS)
          if (counter >= this.DB_MIGRATIONS_MAX_RETRY) {
            this.logger.error(`DB migrations was not completed. Throwing`)
            throw error
          }
        } else {
          this.logger.error(`DB error: ${error.message}`)
          throw error
        }
      }
    }

    for (const tenant of initialTenantsToCreate) {
      this.logger.info(`Creating tenant: ${tenant.id}`)

      const existingTenant = await this.tenantRepository.findOne({
        id: tenant.id,
      })
      if (existingTenant) {
        this.logger.info(`Tenant ${tenant.id} already exists. Skipping...`)
        continue
      }

      await this.tenantService.create(tenant, '')

      this.logger.info('Tenant saved in DB')
    }

    for (const entity of initialEntitiesToCreate) {
      this.logger.info(
        `Creating entity: ${entity.id || 'undefined'} for tenant: ${
          entity.tenantId
        }`,
      )

      if (!entity.tenantId || !entity.id) {
        this.logger.info(
          `Entity needs to include 'id' and 'tenantId' fields. Skipping...`,
        )
        continue
      }

      const existingEntity = await this.entityRepository.findOne({
        id: entity.id,
      })
      if (existingEntity) {
        this.logger.info(`Entity ${entity.id} already exists. Skipping...`)
        continue
      }

      await this.entityService.create(entity, '')

      this.logger.info('Entity saved in DB')
    }

    for (const wallet of initialWalletsToCreate) {
      this.logger.info(
        `Creating wallet: ${wallet.address || 'undefined'} for entity: ${
          wallet.entityId
        } and tenant: ${wallet.tenantId}`,
      )

      if (!wallet.tenantId || !wallet.entityId || !wallet.address) {
        this.logger.info(
          `Wallet needs to include 'address', 'entityId' and 'tenantId' fields. Skipping...`,
        )
        continue
      }

      const existingWallet = await this.walletRepository.findOne({
        address: wallet.address,
      })
      if (existingWallet) {
        this.logger.info(`Wallet ${wallet.address} already exists. Skipping...`)
        continue
      }

      await this.walletService.create(wallet.tenantId, {
        ...wallet,
        createdBy: '',
      })

      this.logger.info('Wallet saved in DB')
    }
  }
}
