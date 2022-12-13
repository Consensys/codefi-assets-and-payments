import { Injectable } from '@nestjs/common'
import { WalletEntity } from '../data/entities/WalletEntity'
import { DeleteResult, FindManyOptions, Repository } from 'typeorm'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  OrchestrateAccountsService,
  OrchestrateUtils,
} from '@consensys/nestjs-orchestrate'
import {
  WalletCreateRequest,
  WalletType,
  WalletUpdateRequest,
} from '@consensys/ts-types'
import { DataFieldsOnly } from '../utils/types'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityEntity } from '../data/entities/EntityEntity'
import { KafkaProducer } from '@consensys/nestjs-messaging'
import {
  Events,
  IWalletOperationEvent,
  MessageDataOperation,
} from '@consensys/messaging-events'
import {
  EntityNotFoundException,
  ValidationException,
} from '@consensys/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'
import { M2mTokenService } from '@consensys/auth'
import config from '../config'
import { getChecksumAddress } from '../utils/utils'
import { StoreService } from './StoreService'

const EXTERNAL_WALLET_TYPES = [
  WalletType.EXTERNAL_CLIENT_METAMASK,
  WalletType.EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL,
  WalletType.EXTERNAL_OTHER,
]

const WALLET_TYPES_WITH_DEFAULT_STORE = [
  WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
]

@Injectable()
export class WalletService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(EntityEntity)
    private readonly entityRepository: Repository<EntityEntity>,
    private readonly orchestrateAccountsService: OrchestrateAccountsService,
    private readonly storeService: StoreService,
    private readonly kafkaProducer: KafkaProducer,
    private readonly m2mTokenService: M2mTokenService,
  ) {
    logger.setContext(WalletService.name)
  }

  async getAll(filter?: FindManyOptions<WalletEntity>) {
    return this.walletRepository.findAndCount(filter)
  }

  async getById(
    tenantId: string,
    entityId: string,
    address: string,
  ): Promise<WalletEntity> {
    const checksumAddress = getChecksumAddress(address)
    const wallet = await this.walletRepository.findOne({
      tenantId,
      entityId,
      address: checksumAddress,
    })
    if (!wallet) {
      throw new EntityNotFoundException(
        LocalErrorName.WalletNotFoundException,
        'Wallet does not exist or it is not part of the tenant or entity',
        { tenantId, entityId, address },
      )
    }
    return wallet
  }

  async create(
    tenantId: string,
    wallet: WalletCreateRequest & { entityId: string; createdBy: string },
  ): Promise<WalletEntity> {
    this.logger.info(`Creating wallet ${JSON.stringify(wallet)}`)

    // Throws if entity neither exists nor belongs to the tenant
    await this.findEntity(tenantId, wallet.entityId)

    let walletAddress = getChecksumAddress(wallet.address)
    let storeId = undefined
    const isExternalWalletType = EXTERNAL_WALLET_TYPES.includes(wallet.type)

    if (isExternalWalletType) {
      if (!walletAddress) {
        // Throw when a non-orchestrate wallet does not include an address
        throw new ValidationException(
          LocalErrorName.NoWalletAddressProvidedException,
          'Wallet address is required for non-Orchestrate wallets',
          wallet,
        )
      }
    } else {
      // We need to create an M2M token to communicate with Orchestrate
      // The M2M token will include "*" as tenantId in its custom claims,
      // allowing it to create the wallet for the correct tenant and entity
      const authToken = await this.createM2MAuthToken()

      const authHeaders = OrchestrateUtils.buildOrchestrateHeadersForTenant(
        tenantId,
        wallet.entityId,
      )

      if (!walletAddress) {
        // Register a new orchestrate wallet
        ;({ address: walletAddress, storeId } = await this.createNewAccount(
          tenantId,
          wallet.entityId,
          wallet.type,
          authToken,
          authHeaders,
        ))
      } else if (
        !(await this.orchestrateAccountsService.isRegistered(
          walletAddress,
          authToken,
          authHeaders,
        ))
      ) {
        // Throw when an orchestrate wallet includes an address that is not registered
        throw new ValidationException(
          LocalErrorName.OrchestrateWalletNotRegisteredException,
          'Orchestrate wallet address is not registered',
          wallet,
        )
      }
    }

    const newWallet: DataFieldsOnly<WalletEntity> = {
      address: walletAddress,
      storeId,
      type: wallet.type,
      metadata: wallet.metadata || {},
      createdBy: wallet.createdBy,
      entityId: wallet.entityId,
      tenantId: tenantId,
    }

    await this.walletRepository.insert(newWallet)

    const result = await this.getById(
      newWallet.tenantId,
      newWallet.entityId,
      newWallet.address,
    )

    await this.sendEventMessage(MessageDataOperation.CREATE, result)

    return result
  }

  async update(
    tenantId: string,
    entityId: string,
    address: string,
    wallet: WalletUpdateRequest,
  ): Promise<WalletEntity> {
    this.logger.info(`Updating wallet ${address}: ${JSON.stringify(wallet)}`)

    const checksumAddress = getChecksumAddress(address)

    // Throws if wallet doesn't exist
    await this.getById(tenantId, entityId, checksumAddress)

    await this.walletRepository.update(
      { tenantId, entityId, address: checksumAddress },
      wallet,
    )

    const result = await this.getById(tenantId, entityId, checksumAddress)

    await this.sendEventMessage(MessageDataOperation.UPDATE, result)

    return result
  }

  async delete(
    tenantId: string,
    entityId: string,
    address: string,
  ): Promise<DeleteResult> {
    this.logger.info(`Deleting wallet ${address}`)

    const checksumAddress = getChecksumAddress(address)
    // Throws if entity neither exists nor belongs to the tenant
    const entity = await this.findEntity(tenantId, entityId, true)
    // If the entity is already deleted, we can delete the default wallet
    if (!entity.deletedDate && entity.defaultWallet === checksumAddress) {
      throw new ValidationException(
        LocalErrorName.DefaultWalletDeletedException,
        'Entity default wallet cannot be deleted',
        { entityId, checksumAddress },
      )
    }

    // Throws if wallet doesn't exist
    const wallet = await this.getById(tenantId, entityId, checksumAddress)

    const result = this.walletRepository.softDelete({
      tenantId,
      entityId,
      address: checksumAddress,
    })

    await this.sendEventMessage(MessageDataOperation.DELETE, wallet)

    return result
  }

  private async findEntity(
    tenantId: string,
    entityId: string,
    withDeleted = false,
  ) {
    const entity = await this.entityRepository.findOne(
      { tenantId, id: entityId },
      { withDeleted },
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

  private async sendEventMessage(
    operation: MessageDataOperation,
    wallet: WalletEntity,
  ) {
    const message: IWalletOperationEvent = {
      operation,
      entityId: wallet.entityId,
      address: wallet.address,
      type: wallet.type,
      storeId: wallet.storeId,
      metadata: JSON.stringify(wallet.metadata),
      createdBy: wallet.createdBy,
      createdAt: wallet.createdAt.toISOString(),
    }

    await this.kafkaProducer.send(Events.walletOperationEvent, message)
  }

  private async createNewAccount(
    tenantId: string,
    entityId: string,
    walletType: WalletType,
    authToken: string,
    authHeaders: { [x: string]: string },
  ): Promise<{ address: string; storeId: string | undefined }> {
    const storeId = await this.storeService.getStore(
      tenantId,
      entityId,
      walletType,
    )

    const requiresStore = !WALLET_TYPES_WITH_DEFAULT_STORE.includes(walletType)

    if (requiresStore && !storeId) {
      throw new ValidationException(
        LocalErrorName.NoStoreMappingException,
        `A store mapping must exist for the tenant or entity when using the ${walletType} wallet type`,
        { walletType, tenantId, entityId },
      )
    }

    const address = getChecksumAddress(
      await this.orchestrateAccountsService.generateAccount(
        authToken,
        authHeaders,
        storeId,
      ),
    )

    return { address, storeId }
  }

  private async createM2MAuthToken(): Promise<string> {
    return this.m2mTokenService.createM2mToken(
      config().m2mToken.client.id,
      config().m2mToken.client.secret,
      config().m2mToken.audience,
    )
  }
}
