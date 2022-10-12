import { Injectable } from '@nestjs/common'
import { WalletEntity } from '../data/entities/WalletEntity'
import { FindConditions, Repository } from 'typeorm'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityEntity } from '../data/entities/EntityEntity'
import { TenantEntity } from '../data/entities/TenantEntity'
import {
  IEntityOperationEvent,
  ITenantOperationEvent,
  IWalletOperationEvent,
  MessageDataOperation,
} from '@codefi-assets-and-payments/messaging-events'
import { EntityNotFoundException } from '@codefi-assets-and-payments/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'

interface EventType {
  operation: MessageDataOperation
}

@Injectable()
export class RecoveryService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(EntityEntity)
    private readonly entityRepository: Repository<EntityEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {
    logger.setContext(RecoveryService.name)
  }

  async processTenantOperationEvent(event: ITenantOperationEvent) {
    await this.processOperationEvent(
      event,
      event.tenantId,
      event.name,
      this.tenantRepository,
      this.createTenant.bind(this),
      'tenant',
      { id: event.tenantId },
    )
  }

  async processEntityOperationEvent(event: IEntityOperationEvent) {
    await this.processOperationEvent(
      event,
      event.entityId,
      event.name,
      this.entityRepository,
      this.createEntity.bind(this),
      'entity',
      { id: event.entityId },
    )
  }

  async processWalletOperationEvent(event: IWalletOperationEvent) {
    await this.processOperationEvent(
      event,
      event.address,
      event.address,
      this.walletRepository,
      this.createWallet.bind(this),
      'wallet',
      { address: event.address },
    )
  }

  private async processOperationEvent<EntityType>(
    event: EventType,
    entityId: string,
    entityName: string,
    repo: Repository<EntityType>,
    createHelper: (event: EventType) => EntityType,
    entityTypeName: string,
    findConditions: FindConditions<EntityType>,
  ) {
    switch (event.operation) {
      case MessageDataOperation.CREATE:
        await this.insertEntity(
          event,
          entityName,
          repo,
          createHelper,
          entityTypeName,
          findConditions,
        )
        break
      case MessageDataOperation.UPDATE:
        await this.updateEntity(
          event,
          entityId,
          entityName,
          repo,
          createHelper,
          entityTypeName,
          findConditions,
        )
        break
      case MessageDataOperation.DELETE:
        await this.deleteEntity(
          entityId,
          entityName,
          repo,
          entityTypeName,
          findConditions,
        )
        break
    }
  }

  private async insertEntity<EntityType>(
    event: EventType,
    entityName: string,
    repo: Repository<EntityType>,
    createHelper: (event: EventType) => EntityType,
    entityTypeName: string,
    findConditions: FindConditions<EntityType>,
  ) {
    const existing = await repo.findOne(findConditions, { withDeleted: true })

    if (existing) {
      this.logger.info(
        `Skipped creation of existing ${entityTypeName}: ${entityName}`,
      )
      return
    }

    const newEntity = await createHelper(event)

    await repo.insert(newEntity)

    this.logger.info(`Inserted ${entityTypeName}: ${entityName}`)
  }

  private async updateEntity<EntityType>(
    event: EventType,
    entityId: string,
    entityName: string,
    repo: Repository<EntityType>,
    createHelper: (event: EventType) => EntityType,
    entityTypeName: string,
    findConditions: FindConditions<EntityType>,
  ) {
    const existing = await repo.findOne(findConditions, { withDeleted: true })

    if (!existing) {
      this.logger.info(`Cannot find ${entityTypeName} to update: ${entityName}`)
      return
    }

    const updatedEntity = {
      ...(await createHelper(event)),
      updatedAt: new Date(),
    }

    await repo.update(entityId, updatedEntity)

    this.logger.info(`Updated ${entityTypeName}: ${entityName}`)
  }

  private async deleteEntity<EntityType>(
    entityId: string,
    entityName: string,
    repo: Repository<EntityType>,
    entityTypeName: string,
    findConditions: FindConditions<EntityType>,
  ) {
    const deleted = await repo.findOne(findConditions, { withDeleted: true })
    const existing = await repo.findOne(findConditions)

    if (deleted && !existing) {
      this.logger.info(
        `Skipped delete of already deleted ${entityTypeName}: ${entityName}`,
      )
      return
    }

    if (!existing) {
      this.logger.info(`Cannot find ${entityTypeName} to delete: ${entityName}`)
      return
    }

    await repo.softDelete(entityId)

    this.logger.info(`Deleted ${entityTypeName}: ${entityName}`)
  }

  private async createTenant(
    event: ITenantOperationEvent,
  ): Promise<TenantEntity> {
    const products = Object.keys(event.products)
      .filter((productType) => event.products[productType])
      .reduce((output, current) => {
        output[current] = true
        return output
      }, {})

    return {
      id: event.tenantId,
      name: event.name,
      products,
      defaultNetworkKey: event.defaultNetworkKey,
      metadata: event.metadata ? JSON.parse(event.metadata) : {},
      initialAdmins: [],
      createdBy: event.createdBy,
      createdAt: new Date(event.createdAt),
    } as TenantEntity
  }

  private async createEntity(
    event: IEntityOperationEvent,
  ): Promise<EntityEntity> {
    const tenant = await this.tenantRepository.findOne(
      {
        id: event.tenantId,
      },
      { withDeleted: true },
    )

    if (!tenant) {
      throw new EntityNotFoundException(
        LocalErrorName.EntityNotFoundException,
        `Cannot find tenant '${event.tenantId}' for entity: ${event.name}`,
        { event },
      )
    }

    return {
      id: event.entityId,
      tenantId: event.tenantId,
      name: event.name,
      defaultWallet: event.defaultWallet,
      metadata: event.metadata ? JSON.parse(event.metadata) : {},
      initialAdmins: [],
      createdBy: event.createdBy,
      createdAt: new Date(event.createdAt),
    } as EntityEntity
  }

  private async createWallet(
    event: IWalletOperationEvent,
  ): Promise<WalletEntity> {
    const entity = await this.entityRepository.findOne(
      { id: event.entityId },
      { withDeleted: true },
    )

    if (!entity) {
      throw new EntityNotFoundException(
        LocalErrorName.EntityNotFoundException,
        `Cannot find entity '${event.entityId}' for wallet: ${event.address}`,
        { event },
      )
    }

    return {
      address: event.address,
      entityId: event.entityId,
      tenantId: entity.tenantId,
      type: event.type,
      storeId: event.storeId,
      metadata: event.metadata ? JSON.parse(event.metadata) : {},
      createdBy: event.createdBy,
      createdAt: new Date(event.createdAt),
    } as WalletEntity
  }
}
