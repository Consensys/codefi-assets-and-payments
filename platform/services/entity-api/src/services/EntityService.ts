import { Injectable } from '@nestjs/common'
import { DataFieldsOnly } from '../utils/types'
import { EntityEntity } from '../data/entities/EntityEntity'
import { InjectRepository } from '@nestjs/typeorm'
import { DeleteResult, FindManyOptions, Repository } from 'typeorm'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import {
  EntityCreateRequest,
  EntityStatus,
  EntityUpdateRequest,
  WalletCreateRequest,
  WalletType,
  WalletUpdateRequest,
} from '@codefi-assets-and-payments/ts-types'
import { AdminApiService } from './AdminApiService'
import { v4 as uuidv4 } from 'uuid'
import { WalletService } from './WalletService'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import {
  Commands,
  Events,
  MessageDataOperation,
  WalletDeleteCommandBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { IEntityOperationEvent } from '@codefi-assets-and-payments/messaging-events/dist/messages/events/EntityOperationEvent'
import { WalletEntity } from '../data/entities/WalletEntity'
import {
  EntityNotFoundException,
  ValidationException,
} from '@codefi-assets-and-payments/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'
import { getChecksumAddress } from '../utils/utils'
import { StoreService } from './StoreService'

export const ENTITY_ADMIN_ROLE = 'Entity Admin'

@Injectable()
export class EntityService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(EntityEntity)
    private readonly entityRepository: Repository<EntityEntity>,
    private readonly walletService: WalletService,
    private readonly adminApiService: AdminApiService,
    private readonly storeService: StoreService,
    private readonly kafkaProducer: KafkaProducer,
  ) {
    logger.setContext(EntityService.name)
  }

  async getAll(filter: FindManyOptions<EntityEntity>, includeWallets = false) {
    return this.entityRepository.findAndCount({
      ...filter,
      ...(includeWallets ? { relations: ['wallets'] } : undefined),
    })
  }

  async getById(
    tenantId: string,
    entityId: string,
    includeWallets = false,
  ): Promise<EntityEntity> {
    const entity = await this.entityRepository.findOne(
      { tenantId, id: entityId },
      includeWallets ? { relations: ['wallets'] } : undefined,
    )
    if (!entity) {
      throw new EntityNotFoundException(
        LocalErrorName.EntityNotFoundException,
        'Entity does not exist or it is not part of the tenant',
        { tenantId, entityId },
      )
    }
    return entity
  }

  async create(
    entity: EntityCreateRequest & { tenantId: string },
    createdBy: string,
  ): Promise<EntityEntity> {
    this.logger.info(`Creating entity ${JSON.stringify(entity)}`)

    const checksumDefaultWallet = getChecksumAddress(entity.defaultWallet)
    const checksumInitialWallets = !entity.initialWallets
      ? undefined
      : entity.initialWallets.map((wallet) => ({
          ...wallet,
          address: getChecksumAddress(wallet.address),
        }))

    if (
      checksumDefaultWallet &&
      (!checksumInitialWallets ||
        !checksumInitialWallets.find(
          (wallet) => wallet.address === checksumDefaultWallet,
        ))
    ) {
      throw new ValidationException(
        LocalErrorName.DefaultWalletDoesNotExistException,
        'defaultWallet is not in list of entity wallets',
        entity,
      )
    }

    const newEntity: DataFieldsOnly<EntityEntity> = {
      id: entity.id || uuidv4(),
      tenantId: entity.tenantId,
      name: entity.name,
      metadata: entity.metadata || {},
      initialAdmins:
        entity.initialAdmins?.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })) || [],
      defaultWallet: '',
      createdBy,
    }

    await this.entityRepository.insert(newEntity)

    const result = await this.getById(newEntity.tenantId, newEntity.id)

    await this.sendEventMessage(MessageDataOperation.CREATE, result)

    if (entity.stores) {
      await this.storeService.setEntityMappings(
        entity.stores,
        newEntity.tenantId,
        newEntity.id,
      )
    }

    await this.createInitialWallets(
      result,
      checksumInitialWallets,
      checksumDefaultWallet,
      createdBy,
    )

    await this.adminApiService.createAdmins(
      newEntity.initialAdmins,
      [ENTITY_ADMIN_ROLE],
      newEntity.tenantId,
      newEntity.id,
    )

    return this.getById(newEntity.tenantId, newEntity.id)
  }

  async update(
    tenantId: string,
    entityId: string,
    entity: EntityUpdateRequest,
  ): Promise<EntityEntity> {
    this.logger.info(`Updating entity ${entityId}: ${JSON.stringify(entity)}`)

    // Throws if entity doesn't exist
    const { wallets } = await this.getById(tenantId, entityId, true)
    const checksumDefaultWallet = getChecksumAddress(entity.defaultWallet)

    if (
      checksumDefaultWallet &&
      !wallets.find((wallet) => wallet.address === checksumDefaultWallet)
    ) {
      throw new ValidationException(
        LocalErrorName.DefaultWalletDoesNotExistException,
        'defaultWallet is not present in list of entity wallets',
        entity,
      )
    }

    const updatedEntity = { ...entity }
    delete updatedEntity.stores

    await this.entityRepository.update(
      { tenantId, id: entityId },
      updatedEntity,
    )

    if (entity.stores) {
      await this.storeService.setEntityMappings(
        entity.stores,
        tenantId,
        entityId,
        { removeExisting: true },
      )
    }

    const result = await this.getById(tenantId, entityId)

    await this.sendEventMessage(MessageDataOperation.UPDATE, result)

    return result
  }

  async delete(tenantId: string, entityId: string): Promise<DeleteResult> {
    this.logger.info(`Deleting entity ${entityId}`)

    // Throws if entity doesn't exist
    const entity = await this.getById(tenantId, entityId, true)

    await this.storeService.setEntityMappings([], tenantId, entityId, {
      removeExisting: true,
    })

    const result = await this.entityRepository.softDelete({
      tenantId,
      id: entityId,
    })

    await this.sendEventMessage(MessageDataOperation.DELETE, entity)

    // Send commands to delete wallets
    const deleteWalletCommands = entity.wallets.map((wallet) => {
      const command = WalletDeleteCommandBuilder.get(
        tenantId,
        entityId,
        wallet.address,
      ).build()
      return this.kafkaProducer.send(Commands.walletDeleteCommand, command)
    })

    await Promise.all(deleteWalletCommands)

    return result
  }

  async createWalletForEntity(
    tenantId: string,
    wallet: WalletCreateRequest & { entityId: string; createdBy: string },
    setAsDefault: boolean,
  ): Promise<WalletEntity> {
    const result = await this.walletService.create(tenantId, wallet)

    if (setAsDefault) {
      await this.entityRepository.update(
        { tenantId, id: wallet.entityId },
        { defaultWallet: result.address },
      )

      const entityResult = await this.getById(tenantId, result.entityId)
      await this.sendEventMessage(MessageDataOperation.UPDATE, entityResult)
    }

    return result
  }

  async updateWalletForEntity(
    tenantId: string,
    entityId: string,
    address: string,
    wallet: WalletUpdateRequest,
    setAsDefault: boolean,
  ): Promise<WalletEntity> {
    const result = await this.walletService.update(
      tenantId,
      entityId,
      address,
      wallet,
    )

    const checksumAddress = getChecksumAddress(address)

    if (setAsDefault) {
      await this.entityRepository.update(
        { tenantId, id: result.entityId },
        { defaultWallet: checksumAddress },
      )

      const entityResult = await this.getById(tenantId, result.entityId)
      await this.sendEventMessage(MessageDataOperation.UPDATE, entityResult)
    }

    return result
  }

  // TODO Potential race condition here if two events asynchronously update the same array
  // Initial admins should be on their own table so that they can be updated safely
  // It would also mean less code and business logic
  async updateAdminStatus(
    tenantId: string,
    entityId: string,
    email: string,
    name: string,
  ): Promise<void> {
    this.logger.info(
      `Updating status of entity admin ${JSON.stringify({
        entityId,
        email,
        name,
      })}`,
    )

    const entity = await this.getById(tenantId, entityId)
    const adminIndex = entity.initialAdmins.findIndex(
      (el) => el.name === name && el.email === email,
    )
    if (adminIndex !== -1) {
      entity.initialAdmins[adminIndex].status = EntityStatus.Confirmed

      await this.entityRepository.update(
        { tenantId, id: entityId },
        { initialAdmins: entity.initialAdmins },
      )
    }
  }

  private async sendEventMessage(
    operation: MessageDataOperation,
    entity: EntityEntity,
  ) {
    const message: IEntityOperationEvent = {
      operation,
      entityId: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      defaultWallet: entity.defaultWallet,
      metadata: JSON.stringify(entity.metadata),
      createdBy: entity.createdBy,
      createdAt: entity.createdAt.toISOString(),
    }

    await this.kafkaProducer.send(Events.entityOperationEvent, message)
  }

  private async createInitialWallets(
    newEntity: EntityEntity,
    initialWallets: WalletCreateRequest[],
    requestDefaultWallet: string,
    createdBy: string,
  ) {
    if (!initialWallets || !initialWallets.length) {
      initialWallets = [{ type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT }]
    }

    for (let i = 0; i < initialWallets.length; i++) {
      const wallet = initialWallets[i]

      // Make it the default wallet if it matches the one given
      // Make it the default wallet if it's the first and none is given
      const isDefaultWallet =
        (wallet.address && wallet.address === requestDefaultWallet) ||
        (!requestDefaultWallet && i === 0)

      await this.createWalletForEntity(
        newEntity.tenantId,
        {
          ...wallet,
          entityId: newEntity.id,
          createdBy,
        },
        isDefaultWallet,
      )
    }
  }
}
