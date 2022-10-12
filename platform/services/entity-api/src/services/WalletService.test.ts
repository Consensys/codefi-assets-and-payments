import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { WalletService } from './WalletService'
import {
  authHeadersMock,
  authTokenMock,
  entityIdMock,
  storeIdMock,
  subjectMock,
  tenantIdMock,
  walletAddressMock,
  walletAddressWithoutChecksumMock,
  walletMock,
  walletUpdateMock,
} from '../../test/mocks'
import { OrchestrateAccountsService } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { WalletEntity } from '../data/entities/WalletEntity'
import { EntityEntity } from '../data/entities/EntityEntity'
import { Repository, UpdateResult } from 'typeorm'
import { WalletType } from '@codefi-assets-and-payments/ts-types'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import { Events, MessageDataOperation } from '@codefi-assets-and-payments/messaging-events'
import {
  EntityNotFoundException,
  ValidationException,
} from '@codefi-assets-and-payments/error-handler'
import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { StoreService } from './StoreService'

describe('WalletService', () => {
  let service: WalletService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let walletRepositoryMock: jest.Mocked<Repository<WalletEntity>>
  let entityRepositoryMock: jest.Mocked<Repository<EntityEntity>>
  let orchestrateAccountsServiceMock: jest.Mocked<OrchestrateAccountsService>
  let storeServiceMock: jest.Mocked<StoreService>
  let kafkaProducerMock: jest.Mocked<KafkaProducer>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    walletRepositoryMock = createMockInstance(Repository as any)
    entityRepositoryMock = createMockInstance(Repository as any)
    orchestrateAccountsServiceMock = createMockInstance(
      OrchestrateAccountsService,
    )
    storeServiceMock = createMockInstance(StoreService)
    kafkaProducerMock = createMockInstance(KafkaProducer)
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    service = new WalletService(
      loggerMock,
      walletRepositoryMock,
      entityRepositoryMock,
      orchestrateAccountsServiceMock,
      storeServiceMock,
      kafkaProducerMock,
      m2mTokenServiceMock,
    )
  })

  describe('getAll', () => {
    it('(OK) succeeds if wallet exists', async () => {
      const filter = {}

      const findResult = [[], 0]
      walletRepositoryMock.findAndCount.mockResolvedValueOnce(findResult as any)

      const result = await service.getAll(filter)

      expect(result).toBe(findResult)
      expect(walletRepositoryMock.findAndCount).toHaveBeenCalledWith(filter)
    })
  })

  describe('getById', () => {
    it('(OK) succeeds if wallet exists', async () => {
      const findOneResult = {}
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneResult as WalletEntity,
      )

      const result = await service.getById(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
      )

      expect(result).toBe(findOneResult)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
    })

    it('(OK) succeeds if wallet exists with checksum address when given non-checksum address', async () => {
      const findOneResult = {}
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneResult as WalletEntity,
      )

      const result = await service.getById(
        tenantIdMock,
        entityIdMock,
        walletAddressWithoutChecksumMock,
      )

      expect(result).toBe(findOneResult)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
    })

    it('(FAIL) throws if wallet does not exist', async () => {
      walletRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(
        service.getById(tenantIdMock, entityIdMock, walletAddressMock),
      ).rejects.toThrowError(EntityNotFoundException)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
    })
  })

  describe('create', () => {
    it('(OK) creates external wallet with a given address', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
      const findOneWalletResult = {
        ...walletMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneWalletResult as WalletEntity,
      )

      const result = await service.create(tenantIdMock, {
        ...walletMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
      })

      expect(result).toBe(findOneWalletResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(0)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(0)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledTimes(
        0,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledWith({
        ...walletMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
        storeId: undefined,
      })
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletMock.address,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          entityId: entityIdMock,
          address: findOneWalletResult.address,
          type: findOneWalletResult.type,
          metadata: JSON.stringify(findOneWalletResult.metadata),
          createdBy: findOneWalletResult.createdBy,
          createdAt: findOneWalletResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) creates external wallet with checksum address when given non-checksum address', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
      const findOneWalletResult = {
        ...walletMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneWalletResult as WalletEntity,
      )

      const result = await service.create(tenantIdMock, {
        ...walletMock,
        address: walletAddressWithoutChecksumMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
      })

      expect(result).toBe(findOneWalletResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(0)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(0)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledTimes(
        0,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledWith({
        ...walletMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
      })
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletMock.address,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          entityId: entityIdMock,
          address: findOneWalletResult.address,
          type: findOneWalletResult.type,
          metadata: JSON.stringify(findOneWalletResult.metadata),
          createdBy: findOneWalletResult.createdBy,
          createdAt: findOneWalletResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) creates orchestrate wallet without a given address', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
      orchestrateAccountsServiceMock.generateAccount.mockResolvedValueOnce(
        walletAddressMock,
      )
      const findOneWalletResult = {
        address: walletAddressMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        metadata: {},
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneWalletResult as WalletEntity,
      )

      const result = await service.create(tenantIdMock, {
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        entityId: entityIdMock,
        createdBy: subjectMock,
      })

      expect(result).toBe(findOneWalletResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledWith(authTokenMock, authHeadersMock, undefined)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledTimes(
        0,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        address: walletAddressMock,
        metadata: {},
        storeId: undefined,
        createdBy: subjectMock,
      })
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          entityId: entityIdMock,
          address: findOneWalletResult.address,
          type: findOneWalletResult.type,
          metadata: JSON.stringify(findOneWalletResult.metadata),
          createdBy: findOneWalletResult.createdBy,
          createdAt: findOneWalletResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) creates orchestrate wallet in specific store if mapping exists', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
      orchestrateAccountsServiceMock.generateAccount.mockResolvedValueOnce(
        walletAddressMock,
      )
      const findOneWalletResult = {
        address: walletAddressMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        metadata: {},
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
        storeId: storeIdMock,
      }
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneWalletResult as WalletEntity,
      )
      storeServiceMock.getStore.mockResolvedValueOnce(storeIdMock)

      const result = await service.create(tenantIdMock, {
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        entityId: entityIdMock,
        createdBy: subjectMock,
      })

      expect(result).toBe(findOneWalletResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledWith(authTokenMock, authHeadersMock, storeIdMock)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledTimes(
        0,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        address: walletAddressMock,
        metadata: {},
        storeId: storeIdMock,
        createdBy: subjectMock,
      })
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          entityId: entityIdMock,
          address: findOneWalletResult.address,
          type: findOneWalletResult.type,
          storeId: storeIdMock,
          metadata: JSON.stringify(findOneWalletResult.metadata),
          createdBy: findOneWalletResult.createdBy,
          createdAt: findOneWalletResult.createdAt.toISOString(),
        },
      )
      expect(storeServiceMock.getStore).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
      )
    })

    it('(OK) creates orchestrate wallet with a given registered address', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
      orchestrateAccountsServiceMock.isRegistered.mockResolvedValueOnce(true)
      const findOneWalletResult = {
        address: walletAddressMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        metadata: {},
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneWalletResult as WalletEntity,
      )

      const result = await service.create(tenantIdMock, {
        address: walletAddressMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        entityId: entityIdMock,
        createdBy: subjectMock,
      })

      expect(result).toBe(findOneWalletResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(0)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledWith(
        walletAddressMock,
        authTokenMock,
        authHeadersMock,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        address: walletAddressMock,
        metadata: {},
        storeId: undefined,
        createdBy: subjectMock,
      })
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          entityId: entityIdMock,
          address: findOneWalletResult.address,
          type: findOneWalletResult.type,
          metadata: JSON.stringify(findOneWalletResult.metadata),
          createdBy: findOneWalletResult.createdBy,
          createdAt: findOneWalletResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) creates orchestrate wallet with checksum address when given registered non-checksum address', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
      orchestrateAccountsServiceMock.isRegistered.mockResolvedValueOnce(true)
      const findOneWalletResult = {
        address: walletAddressMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        metadata: {},
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneWalletResult as WalletEntity,
      )

      const result = await service.create(tenantIdMock, {
        address: walletAddressWithoutChecksumMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        entityId: entityIdMock,
        createdBy: subjectMock,
      })

      expect(result).toBe(findOneWalletResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(0)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledWith(
        walletAddressMock,
        authTokenMock,
        authHeadersMock,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        address: walletAddressMock,
        metadata: {},
        createdBy: subjectMock,
      })
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          entityId: entityIdMock,
          address: findOneWalletResult.address,
          type: findOneWalletResult.type,
          metadata: JSON.stringify(findOneWalletResult.metadata),
          createdBy: findOneWalletResult.createdBy,
          createdAt: findOneWalletResult.createdAt.toISOString(),
        },
      )
    })

    it('(FAIL) throws if entity does not exist', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(
        service.create(tenantIdMock, {
          type: WalletType.EXTERNAL_OTHER,
          entityId: entityIdMock,
          createdBy: subjectMock,
        }),
      ).rejects.toThrowError(EntityNotFoundException)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(0)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(0)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledTimes(
        0,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledTimes(0)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) throws if address is passed for orchestrate account without being registered', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
      orchestrateAccountsServiceMock.isRegistered.mockResolvedValueOnce(false)

      await expect(
        service.create(tenantIdMock, {
          address: walletAddressMock,
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          entityId: entityIdMock,
          createdBy: subjectMock,
        }),
      ).rejects.toThrowError(ValidationException)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(0)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledWith(
        walletAddressMock,
        authTokenMock,
        authHeadersMock,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledTimes(0)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) throws if no address is passed and wallet type is EXTERNAL_OTHER', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)

      await expect(
        service.create(tenantIdMock, {
          type: WalletType.EXTERNAL_OTHER,
          entityId: entityIdMock,
          createdBy: subjectMock,
        }),
      ).rejects.toThrowError(ValidationException)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(0)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(0)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledTimes(
        0,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledTimes(0)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) throws if no address is passed and wallet type is EXTERNAL_CLIENT_METAMASK', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)

      await expect(
        service.create(tenantIdMock, {
          type: WalletType.EXTERNAL_CLIENT_METAMASK,
          entityId: entityIdMock,
          createdBy: subjectMock,
        }),
      ).rejects.toThrowError(ValidationException)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(0)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(0)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledTimes(
        0,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledTimes(0)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) throws if no address is passed and wallet type is EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)

      await expect(
        service.create(tenantIdMock, {
          type: WalletType.EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL,
          entityId: entityIdMock,
          createdBy: subjectMock,
        }),
      ).rejects.toThrowError(ValidationException)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: false },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(0)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(0)
      expect(orchestrateAccountsServiceMock.isRegistered).toHaveBeenCalledTimes(
        0,
      )
      expect(walletRepositoryMock.insert).toHaveBeenCalledTimes(0)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })

    it.each([
      WalletType.INTERNAL_CODEFI_AWS_VAULT,
      WalletType.INTERNAL_CODEFI_AZURE_VAULT,
      WalletType.INTERNAL_CLIENT_AWS_VAULT,
      WalletType.INTERNAL_CLIENT_AZURE_VAULT,
    ])(
      '(FAIL) throws if no store found and wallet type is %s',
      async (walletType) => {
        m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)
        entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
        storeServiceMock.getStore.mockResolvedValueOnce(undefined)

        try {
          await service.create(tenantIdMock, {
            type: walletType,
            entityId: entityIdMock,
            createdBy: subjectMock,
          })
        } catch (error) {
          expect(error.message).toBe(
            `A store mapping must exist for the tenant or entity when using the ${walletType} wallet type`,
          )
          expect(error.payload).toEqual({
            tenantId: tenantIdMock,
            entityId: entityIdMock,
            walletType,
          })
        }

        expect(storeServiceMock.getStore).toHaveBeenCalledWith(
          tenantIdMock,
          entityIdMock,
          walletType,
        )
      },
    )
  })

  describe('update', () => {
    it('(OK) updates wallet', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
      const findOneResult = {
        ...walletMock,
        ...walletUpdateMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValue(
        findOneResult as WalletEntity,
      )

      const result = await service.update(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
        walletUpdateMock,
      )

      expect(result).toBe(findOneResult)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(walletRepositoryMock.update).toHaveBeenCalledWith(
        {
          tenantId: tenantIdMock,
          entityId: entityIdMock,
          address: walletAddressMock,
        },
        walletUpdateMock,
      )
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(walletRepositoryMock.findOne).toHaveBeenCalledTimes(2)
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.UPDATE,
          entityId: entityIdMock,
          address: findOneResult.address,
          type: findOneResult.type,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) updates wallet when given non-checksum address', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
      const findOneResult = {
        ...walletMock,
        ...walletUpdateMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValue(
        findOneResult as WalletEntity,
      )

      const result = await service.update(
        tenantIdMock,
        entityIdMock,
        walletAddressWithoutChecksumMock,
        walletUpdateMock,
      )

      expect(result).toBe(findOneResult)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(walletRepositoryMock.update).toHaveBeenCalledWith(
        {
          tenantId: tenantIdMock,
          entityId: entityIdMock,
          address: walletAddressMock,
        },
        walletUpdateMock,
      )
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(walletRepositoryMock.findOne).toHaveBeenCalledTimes(2)
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.UPDATE,
          entityId: entityIdMock,
          address: findOneResult.address,
          type: findOneResult.type,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
    })

    it('(FAIL) throws if wallet does not exist', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({} as EntityEntity)
      walletRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(
        service.update(
          tenantIdMock,
          entityIdMock,
          walletAddressMock,
          walletUpdateMock,
        ),
      ).rejects.toThrowError(EntityNotFoundException)
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(walletRepositoryMock.update).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('delete', () => {
    it('(OK) deletes wallet', async () => {
      const findOneEntityResult = { id: entityIdMock, defaultWallet: 'X' }
      entityRepositoryMock.findOne.mockResolvedValueOnce(
        findOneEntityResult as EntityEntity,
      )
      const findOneWalletResult = {
        ...walletMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneWalletResult as WalletEntity,
      )
      const softDeleteResult = {}
      walletRepositoryMock.softDelete.mockResolvedValueOnce(
        softDeleteResult as UpdateResult,
      )

      const result = await service.delete(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
      )

      expect(result).toBe(softDeleteResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: true },
      )
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(walletRepositoryMock.softDelete).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.DELETE,
          entityId: entityIdMock,
          address: findOneWalletResult.address,
          type: findOneWalletResult.type,
          metadata: JSON.stringify(findOneWalletResult.metadata),
          createdBy: findOneWalletResult.createdBy,
          createdAt: findOneWalletResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) deletes wallet when given non-checksum address', async () => {
      const findOneEntityResult = { id: entityIdMock, defaultWallet: 'X' }
      entityRepositoryMock.findOne.mockResolvedValueOnce(
        findOneEntityResult as EntityEntity,
      )
      const findOneWalletResult = {
        ...walletMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneWalletResult as WalletEntity,
      )
      const softDeleteResult = {}
      walletRepositoryMock.softDelete.mockResolvedValueOnce(
        softDeleteResult as UpdateResult,
      )

      const result = await service.delete(
        tenantIdMock,
        entityIdMock,
        walletAddressWithoutChecksumMock,
      )

      expect(result).toBe(softDeleteResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: true },
      )
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(walletRepositoryMock.softDelete).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.DELETE,
          entityId: entityIdMock,
          address: findOneWalletResult.address,
          type: findOneWalletResult.type,
          metadata: JSON.stringify(findOneWalletResult.metadata),
          createdBy: findOneWalletResult.createdBy,
          createdAt: findOneWalletResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) deletes default wallet for deleted entity', async () => {
      const findOneEntityResult = {
        id: entityIdMock,
        defaultWallet: walletMock.address,
        deletedDate: new Date(),
      }
      entityRepositoryMock.findOne.mockResolvedValueOnce(
        findOneEntityResult as EntityEntity,
      )
      const findOneWalletResult = {
        ...walletMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneWalletResult as WalletEntity,
      )
      const softDeleteResult = {}
      walletRepositoryMock.softDelete.mockResolvedValueOnce(
        softDeleteResult as UpdateResult,
      )

      const result = await service.delete(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
      )

      expect(result).toBe(softDeleteResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: true },
      )
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(walletRepositoryMock.softDelete).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.walletOperationEvent,
        {
          operation: MessageDataOperation.DELETE,
          entityId: entityIdMock,
          address: findOneWalletResult.address,
          type: findOneWalletResult.type,
          metadata: JSON.stringify(findOneWalletResult.metadata),
          createdBy: findOneWalletResult.createdBy,
          createdAt: findOneWalletResult.createdAt.toISOString(),
        },
      )
    })

    it('(FAIL) throws if entity does not exist', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(
        service.delete(tenantIdMock, entityIdMock, walletAddressMock),
      ).rejects.toThrowError(EntityNotFoundException)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: true },
      )
      expect(walletRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(walletRepositoryMock.softDelete).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) throws if wallet is the default for the entity', async () => {
      const findOneEntityResult = {
        id: entityIdMock,
        defaultWallet: walletMock.address,
      }
      entityRepositoryMock.findOne.mockResolvedValueOnce(
        findOneEntityResult as EntityEntity,
      )
      const findOneWalletResult = {
        ...walletMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      walletRepositoryMock.findOne.mockResolvedValueOnce(
        findOneWalletResult as WalletEntity,
      )

      await expect(
        service.delete(tenantIdMock, entityIdMock, walletAddressMock),
      ).rejects.toThrowError(ValidationException)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: true },
      )
      expect(walletRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(walletRepositoryMock.softDelete).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) throws if wallet does not exist', async () => {
      const findOneEntityResult = { id: entityIdMock, defaultWallet: 'X' }
      entityRepositoryMock.findOne.mockResolvedValueOnce(
        findOneEntityResult as EntityEntity,
      )
      walletRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(
        service.delete(tenantIdMock, entityIdMock, walletAddressMock),
      ).rejects.toThrowError(EntityNotFoundException)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { withDeleted: true },
      )
      expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        address: walletAddressMock,
      })
      expect(walletRepositoryMock.softDelete).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })
})
