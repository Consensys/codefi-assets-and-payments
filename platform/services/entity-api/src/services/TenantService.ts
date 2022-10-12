import { Injectable } from '@nestjs/common'
import { TenantEntity } from '../data/entities/TenantEntity'
import { InjectRepository } from '@nestjs/typeorm'
import { DeleteResult, FindManyOptions, Repository } from 'typeorm'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { AdminApiService } from './AdminApiService'
import {
  EntityCreateRequest,
  EntityStatus,
  ProductType,
  TenantCreateRequest,
  TenantUpdateRequest,
} from '@codefi-assets-and-payments/ts-types'
import { DataFieldsOnly } from '../utils/types'
import {
  MessageDataOperation,
  ITenantOperationEvent,
  Events,
  Commands,
  EntityDeleteCommandBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import { EntityNotFoundException } from '@codefi-assets-and-payments/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'
import { EntityService } from './EntityService'
import { StoreService } from './StoreService'

export const TENANT_ADMIN_ROLE = 'Tenant Admin'
export const DEFAULT_INITIAL_ENTITY_NAME = 'Admin Entity'

@Injectable()
export class TenantService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    private readonly entityService: EntityService,
    private readonly adminApiService: AdminApiService,
    private readonly storeService: StoreService,
    private readonly kafkaProducer: KafkaProducer,
  ) {
    logger.setContext(TenantService.name)
  }

  async getAll(filter?: FindManyOptions<TenantEntity>) {
    return this.tenantRepository.findAndCount(filter)
  }

  async getById(
    tenantId: string,
    includeEntities = false,
  ): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findOne(
      { id: tenantId },
      includeEntities ? { relations: ['entities'] } : undefined,
    )
    if (!tenant) {
      throw new EntityNotFoundException(
        LocalErrorName.TenantNotFoundException,
        'Tenant does not exist',
        { tenantId },
      )
    }
    return tenant
  }

  async create(
    tenant: TenantCreateRequest,
    createdBy: string,
  ): Promise<TenantEntity> {
    this.logger.info(`Creating tenant ${JSON.stringify(tenant)}`)

    const newTenant: DataFieldsOnly<TenantEntity> = {
      ...tenant,
      metadata: tenant.metadata || {},
      initialAdmins:
        tenant.initialAdmins?.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })) || [],
      createdBy,
      stores: undefined,
    }

    await this.tenantRepository.insert(newTenant)

    const result = await this.getById(newTenant.id)

    await this.sendEventMessage(MessageDataOperation.CREATE, result)

    if (tenant.stores) {
      await this.storeService.setTenantMappings(tenant.stores, tenant.id)
    }

    const tenantAdminEntityId = await this.createInitialEntities(
      result,
      tenant.initialEntities,
      createdBy,
    )

    await this.adminApiService.createAdmins(
      tenant.initialAdmins,
      [TENANT_ADMIN_ROLE],
      newTenant.id,
      tenantAdminEntityId,
    )

    return result
  }

  async update(
    tenantId: string,
    tenant: TenantUpdateRequest,
  ): Promise<TenantEntity> {
    this.logger.info(`Updating tenant ${tenantId}: ${JSON.stringify(tenant)}`)

    // Throws if tenant doesn't exist
    await this.getById(tenantId)

    const updatedTenant = {
      ...tenant,
    }
    delete updatedTenant.stores

    await this.tenantRepository.update({ id: tenantId }, updatedTenant)

    if (tenant.stores) {
      await this.storeService.setTenantMappings(tenant.stores, tenantId, {
        removeExisting: true,
      })
    }

    const result = await this.getById(tenantId)

    await this.sendEventMessage(MessageDataOperation.UPDATE, result)

    return result
  }

  async delete(tenantId: string): Promise<DeleteResult> {
    this.logger.info(`Deleting tenant ${tenantId}`)

    // Throws if tenant doesn't exist
    const tenant = await this.getById(tenantId, true)

    await this.storeService.setTenantMappings([], tenantId, {
      removeExisting: true,
    })

    const result = await this.tenantRepository.softDelete({ id: tenantId })

    await this.sendEventMessage(MessageDataOperation.DELETE, tenant)

    // Send commands to delete entities
    const deleteEntityCommands = tenant.entities.map((entity) => {
      const command = EntityDeleteCommandBuilder.get(
        tenantId,
        entity.id,
      ).build()
      return this.kafkaProducer.send(Commands.entityDeleteCommand, command)
    })

    await Promise.all(deleteEntityCommands)

    return result
  }

  // TODO Potential race condition here if two events asynchronously update the same array
  // Initial admins should be on their own table so that they can be updated safely
  // It would also mean less code and business logic
  async updateAdminStatus(
    tenantId: string,
    email: string,
    name: string,
  ): Promise<void> {
    this.logger.info(
      `Updating status of tenant admin ${JSON.stringify({
        tenantId,
        email,
        name,
      })}`,
    )

    const tenant = await this.getById(tenantId)
    const adminIndex = tenant.initialAdmins.findIndex(
      (el) => el.name === name && el.email === email,
    )

    if (adminIndex !== -1) {
      tenant.initialAdmins[adminIndex].status = EntityStatus.Confirmed

      await this.tenantRepository.update(
        { id: tenantId },
        { initialAdmins: tenant.initialAdmins },
      )
    }
  }

  private async sendEventMessage(
    operation: MessageDataOperation,
    tenant: TenantEntity,
  ) {
    const emptyProducts = Object.keys(ProductType).reduce((acc, curr) => {
      acc[curr] = null
      return acc
    }, {}) as { [key in ProductType]: boolean }

    const message: ITenantOperationEvent = {
      operation,
      tenantId: tenant.id,
      name: tenant.name,
      products: {
        ...emptyProducts,
        ...tenant.products,
      },
      defaultNetworkKey: tenant.defaultNetworkKey,
      metadata: JSON.stringify(tenant.metadata),
      createdBy: tenant.createdBy,
      createdAt: tenant.createdAt.toISOString(),
    }

    await this.kafkaProducer.send(Events.tenantOperationEvent, message)
  }

  private async createInitialEntities(
    newTenant: TenantEntity,
    initialEntities: EntityCreateRequest[],
    createdBy: string,
  ) {
    if (!initialEntities || !initialEntities.length) {
      initialEntities = [{ name: DEFAULT_INITIAL_ENTITY_NAME }]
    }

    let tenantAdminEntityId: string
    for (let i = 0; i < initialEntities.length; i++) {
      const entity = initialEntities[i]

      const newEntity = await this.entityService.create(
        {
          ...entity,
          tenantId: newTenant.id,
        },
        createdBy,
      )

      if (i === 0) {
        tenantAdminEntityId = newEntity.id
      }
    }

    return tenantAdminEntityId
  }
}
