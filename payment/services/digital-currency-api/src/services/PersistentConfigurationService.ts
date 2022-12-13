import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import config from '../config'
import { LegalEntityToOnboard } from './types'
import { LegalEntityService } from './LegalEntityService'
import {
  ChainRegistry,
  OrchestrateAccountsService,
  OrchestrateUtils,
} from '@consensys/nestjs-orchestrate'
import { sleep } from '../utils/utils'
import Web3 from 'web3'
import { QueryFailedError } from 'typeorm'
import { M2mTokenService } from '@consensys/auth'

@Injectable()
export class PersistentConfigurationService {
  private readonly DB_MIGRATIONS_MAX_RETRY = 10
  private readonly DB_MIGRATIONS_RETRY_SLEEP_IN_MS = 1000

  constructor(
    private logger: NestJSPinoLogger,
    private orchestrateAccountsService: OrchestrateAccountsService,
    private legalEntityService: LegalEntityService,
    private orchestrateChainRegistry: ChainRegistry,
    private m2mService: M2mTokenService,
  ) {}

  async performConfiguration() {
    if (!config().performInitialConfiguration) {
      this.logger.info(`Initial configuration will not be performed`)
      return
    }
    const legalEntitiesToOnboard: LegalEntityToOnboard[] = JSON.parse(
      config().legalEntitiesToOnboard,
    )

    let migrationsCompleted = false
    let counter = 0
    while (!migrationsCompleted) {
      try {
        await this.legalEntityService.findOne({})
        migrationsCompleted = true
      } catch (error) {
        if (error instanceof QueryFailedError) {
          this.logger.warn(
            `DB legal entity table do not exist. Sleep and retry to wait for DB migrations to finish - ${counter}/${this.DB_MIGRATIONS_MAX_RETRY}`,
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

    if (config().resetInitialConfiguration) {
      this.logger.info(`Resetting initial configuration`)
      await this.legalEntityService.delete({})
    }

    this.logger.info(
      `Performing initial configuration for ${legalEntitiesToOnboard.length}`,
    )
    for (const entity of legalEntitiesToOnboard) {
      this.logger.info(
        `Onboarding entity: ${entity.legalEntityName} with blockchainUrlEndpoint: ${entity.blockchainRpcEndpoint}, ethereumAccount=${entity.ethereumAccount}`,
      )
      const existingEntity = await this.legalEntityService.findOne({
        id: entity.legalEntityId,
      })
      if (existingEntity) {
        this.logger.info(
          `Legal entity with name=${entity.legalEntityName} already exists. Skipping...`,
        )
        continue
      }

      const chainName = await this.configureOrchestrateChain(entity)

      this.logger.info(`Configured ethereum address=${entity.ethereumAccount}`)
      const ethereumAddress = entity.ethereumAccount
      this.logger.info(`ethereum address to be saved: ${ethereumAddress}`)
      this.logger.info(
        `All configuration for entity was done, saving it in DB...`,
      )
      await this.legalEntityService.create(
        entity.legalEntityId,
        entity.legalEntityName,
        Web3.utils.toChecksumAddress(ethereumAddress),
        chainName,
        entity.tenantId,
        entity.issuer,
        'digital-currency',
        new Date(),
        entity.wallets,
      )
      this.logger.info(`Entity saved in DB`)
    }
  }

  async configureOrchestrateChain(
    entity: LegalEntityToOnboard,
  ): Promise<string> {
    const authToken = await this.m2mService.createM2mToken(
      config().m2mToken.client.id,
      config().m2mToken.client.secret,
      config().m2mToken.audience,
    )
    const blockchainRpcUrl = entity.blockchainRpcEndpoint
    this.logger.info(`configureOrchestrateChain for ${blockchainRpcUrl}`)
    const registeredChains: any[] =
      await this.orchestrateChainRegistry.getAllChains(authToken)

    const existingChain = registeredChains.find((chain) =>
      chain.urls.includes(blockchainRpcUrl),
    )

    if (existingChain) {
      this.logger.info(
        `A chain was already registered for provided blockchain RPC URL, name=${existingChain.name}, uuid=${existingChain.uuid}`,
      )
      return existingChain.name
    }
    const chainName = `codefi_payments_tenant_${entity.legalEntityId}`
    this.logger.info(
      `No chain was registered for provided RPC URL. Registering with name=${chainName}`,
    )
    const publicTenantHeaders =
      OrchestrateUtils.buildOrchestrateHeadersForPublicTenant()
    const response = await this.orchestrateChainRegistry.registerChain(
      chainName,
      [blockchainRpcUrl],
      {
        backOffDuration: config().orchestrate.chainBackoffDuration,
        externalTxEnabled: true,
      },
      undefined,
      authToken,
      publicTenantHeaders,
    )

    this.logger.info(`Chain registered, uuid=${response.uuid}`)
    return chainName
  }
}
