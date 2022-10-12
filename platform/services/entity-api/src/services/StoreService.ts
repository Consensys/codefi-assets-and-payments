import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindConditions, Repository } from 'typeorm'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { TenantStoreEntity } from '../data/entities/TenantStoreEntity'
import { EntityStoreEntity } from '../data/entities/EntityStoreEntity'
import { StoreMappingRequest, WalletType } from '@codefi-assets-and-payments/ts-types'
import { ValidationException } from '@codefi-assets-and-payments/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'
import { StoreConfigService } from './StoreConfigService'

const EXTERNAL_WALLET_TYPES = [
  WalletType.EXTERNAL_CLIENT_METAMASK,
  WalletType.EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL,
  WalletType.EXTERNAL_OTHER,
]

@Injectable()
export class StoreService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(TenantStoreEntity)
    private readonly tenantStoreRepository: Repository<TenantStoreEntity>,
    @InjectRepository(EntityStoreEntity)
    private readonly entityStoreRepository: Repository<EntityStoreEntity>,
    private readonly storeConfigService: StoreConfigService,
  ) {
    logger.setContext(StoreService.name)
  }

  async getStore(
    tenantId: string,
    entityId: string,
    walletType: WalletType,
  ): Promise<string | undefined> {
    this.logger.info(
      `Searching for store mapping - Tenant ID: ${tenantId} | Entity ID: ${entityId} |  Wallet Type: ${walletType}`,
    )

    const entityMapping = await this.entityStoreRepository.findOne({
      tenantId,
      entityId,
      walletType,
    })

    if (entityMapping) {
      this.logger.info(
        `Found store mapping for entity - Store ID: ${entityMapping.storeId} | Tenant ID: ${tenantId} | Entity ID: ${entityId} |  Wallet Type: ${walletType}`,
      )
      return entityMapping.storeId
    }

    const tenantMapping = await this.tenantStoreRepository.findOne({
      tenantId,
      walletType,
    })

    if (tenantMapping) {
      this.logger.info(
        `Found store mapping for tenant - Store ID: ${tenantMapping.storeId} | Tenant ID: ${tenantId} |  Wallet Type: ${walletType}`,
      )
    } else {
      this.logger.info(
        `Could not find store mapping - Tenant ID: ${tenantId} | Entity ID: ${entityId} | Wallet Type: ${walletType}`,
      )
    }

    return tenantMapping?.storeId
  }

  async setTenantMappings(
    mappings: StoreMappingRequest[],
    tenantId: string,
    { removeExisting = false }: { removeExisting?: boolean } = {},
  ): Promise<TenantStoreEntity[]> {
    this.logger.info(
      `Setting tenant store mappings - Tenant ID: ${tenantId} | Mappings: ${JSON.stringify(
        mappings,
      )}`,
    )

    return await this.setMappings<TenantStoreEntity>(
      mappings,
      removeExisting,
      this.tenantStoreRepository,
      { tenantId },
      (mapping) => ({ ...mapping, tenantId }),
    )
  }

  async setEntityMappings(
    mappings: StoreMappingRequest[],
    tenantId: string,
    entityId: string,
    { removeExisting = false }: { removeExisting?: boolean } = {},
  ): Promise<EntityStoreEntity[]> {
    this.logger.info(
      `Setting entity store mappings - Tenant ID: ${tenantId} | Entity ID: ${entityId} | Mappings: ${JSON.stringify(
        mappings,
      )}`,
    )

    return await this.setMappings<EntityStoreEntity>(
      mappings,
      removeExisting,
      this.entityStoreRepository,
      { tenantId, entityId },
      (mapping) => ({ ...mapping, tenantId, entityId }),
    )
  }

  private async setMappings<T>(
    mappings: StoreMappingRequest[],
    removeExisting: boolean,
    repo: Repository<T>,
    query: FindConditions<T>,
    entityCreator: (mapping: StoreMappingRequest) => any,
  ) {
    if (removeExisting) {
      await repo.delete(query)
    }

    if (!mappings.length) return []

    await this.validateDuplicateMappings(mappings)
    await this.validateInternalWalletTypes(mappings)
    await this.validateStores(mappings)

    const newEntities = mappings.map(entityCreator)
    await repo.insert(newEntities)

    return await repo.find(query)
  }

  private async validateDuplicateMappings(mappings: StoreMappingRequest[]) {
    const duplicateWalletTypes = mappings
      .filter(
        (mapping, index) =>
          mappings.findIndex(
            (findMapping) => mapping.walletType === findMapping.walletType,
          ) !== index,
      )
      .map((mapping) => mapping.walletType)

    if (!duplicateWalletTypes.length) return

    throw new ValidationException(
      LocalErrorName.InvalidStoreMappingException,
      `Multiple store mappings were provided for the following wallet types: ${duplicateWalletTypes}`,
      duplicateWalletTypes,
    )
  }

  private async validateInternalWalletTypes(mappings: StoreMappingRequest[]) {
    const invalidMappings = mappings.filter((mapping) =>
      EXTERNAL_WALLET_TYPES.includes(mapping.walletType),
    )

    if (!invalidMappings.length) return

    const invalidStoreNames = invalidMappings
      .map((mapping) => mapping.storeId)
      .join(', ')

    throw new ValidationException(
      LocalErrorName.InvalidStoreMappingException,
      `Stores can only be mapped to internal wallet types: ${invalidStoreNames}`,
      invalidMappings,
    )
  }

  private async validateStores(mappings: StoreMappingRequest[]) {
    const storeConfig = await this.storeConfigService.get()

    const invalidMappings = mappings.filter((mapping) => {
      const registeredWalletType = storeConfig[mapping.storeId]
      return (
        !registeredWalletType || registeredWalletType !== mapping.walletType
      )
    })

    if (!invalidMappings.length) return

    const invalidStoreNames = invalidMappings
      .map((mapping) => mapping.storeId)
      .join(', ')

    throw new ValidationException(
      LocalErrorName.InvalidStoreMappingException,
      `The following stores are not registered or are incompatible with their specified wallet type: ${invalidStoreNames}`,
      invalidMappings,
    )
  }
}
