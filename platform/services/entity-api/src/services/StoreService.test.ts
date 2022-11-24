import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  entityIdMock,
  storeIdMock,
  storeIdMock2,
  storeIdMock3,
  tenantIdMock,
} from '../../test/mocks'
import { Repository } from 'typeorm'
import { WalletType } from '@consensys/ts-types'
import { StoreService } from './StoreService'
import { TenantStoreEntity } from 'src/data/entities/TenantStoreEntity'
import { EntityStoreEntity } from 'src/data/entities/EntityStoreEntity'
import { StoreConfigService } from './StoreConfigService'

describe('StoreService', () => {
  let service: StoreService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tenantStoreRepositoryMock: jest.Mocked<Repository<TenantStoreEntity>>
  let entityStoreRepositoryMock: jest.Mocked<Repository<EntityStoreEntity>>
  let storeConfigServiceMock: jest.Mocked<StoreConfigService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    tenantStoreRepositoryMock = createMockInstance(Repository as any)
    entityStoreRepositoryMock = createMockInstance(Repository as any)
    storeConfigServiceMock = createMockInstance(StoreConfigService)

    service = new StoreService(
      loggerMock,
      tenantStoreRepositoryMock,
      entityStoreRepositoryMock,
      storeConfigServiceMock,
    )
  })

  describe('getStore', () => {
    it('(OK) returns undefined if no tenant mapping or entity mapping exists', async () => {
      const result = await service.getStore(
        tenantIdMock,
        entityIdMock,
        WalletType.INTERNAL_CLIENT_AWS_VAULT,
      )
      expect(result).toBe(undefined)
    })

    it('(OK) returns store ID from tenant mapping if no entity mapping exists', async () => {
      tenantStoreRepositoryMock.findOne.mockResolvedValueOnce({
        storeId: storeIdMock,
      } as TenantStoreEntity)

      const result = await service.getStore(
        tenantIdMock,
        entityIdMock,
        WalletType.INTERNAL_CLIENT_AWS_VAULT,
      )

      expect(result).toBe(storeIdMock)
    })

    it('(OK) returns store ID from entity mapping if no tenant mapping exists', async () => {
      entityStoreRepositoryMock.findOne.mockResolvedValueOnce({
        storeId: storeIdMock,
      } as EntityStoreEntity)

      const result = await service.getStore(
        tenantIdMock,
        entityIdMock,
        WalletType.INTERNAL_CLIENT_AWS_VAULT,
      )

      expect(result).toBe(storeIdMock)
    })

    it('(OK) returns store ID from entity mapping even if tenant mapping also exists', async () => {
      tenantStoreRepositoryMock.findOne.mockResolvedValueOnce({
        storeId: storeIdMock2,
      } as TenantStoreEntity)

      entityStoreRepositoryMock.findOne.mockResolvedValueOnce({
        storeId: storeIdMock,
      } as EntityStoreEntity)

      const result = await service.getStore(
        tenantIdMock,
        entityIdMock,
        WalletType.INTERNAL_CLIENT_AWS_VAULT,
      )

      expect(result).toBe(storeIdMock)
    })
  })

  describe('setTenantMappings', () => {
    it('(OK) inserts tenant store entities', async () => {
      const storeMappings = [
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
          storeId: storeIdMock2,
        },
      ]
      const expectedTenantStores = [
        {
          ...storeMappings[0],
          tenantId: tenantIdMock,
        },
        {
          ...storeMappings[1],
          tenantId: tenantIdMock,
        },
      ]

      tenantStoreRepositoryMock.find.mockResolvedValueOnce(
        expectedTenantStores as TenantStoreEntity[],
      )

      storeConfigServiceMock.get.mockResolvedValueOnce({
        [storeIdMock]: WalletType.INTERNAL_CLIENT_AWS_VAULT,
        [storeIdMock2]: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
      })

      const result = await service.setTenantMappings(
        storeMappings,
        tenantIdMock,
      )

      expect(tenantStoreRepositoryMock.insert).toHaveBeenCalledWith(
        expectedTenantStores,
      )
      expect(tenantStoreRepositoryMock.delete).toHaveBeenCalledTimes(0)
      expect(result).toBe(expectedTenantStores)
    })

    it('(OK) does not insert if no mappings provided', async () => {
      const result = await service.setTenantMappings([], tenantIdMock)
      expect(tenantStoreRepositoryMock.insert).toHaveBeenCalledTimes(0)
      expect(result).toEqual([])
    })

    it('(OK) removes existing mappings if requested', async () => {
      const storeMappings = [
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
          storeId: storeIdMock2,
        },
      ]
      const expectedTenantStores = [
        {
          ...storeMappings[0],
          tenantId: tenantIdMock,
        },
        {
          ...storeMappings[1],
          tenantId: tenantIdMock,
        },
      ]

      tenantStoreRepositoryMock.find.mockResolvedValueOnce(
        expectedTenantStores as TenantStoreEntity[],
      )

      storeConfigServiceMock.get.mockResolvedValueOnce({
        [storeIdMock]: WalletType.INTERNAL_CLIENT_AWS_VAULT,
        [storeIdMock2]: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
      })

      const result = await service.setTenantMappings(
        storeMappings,
        tenantIdMock,
        { removeExisting: true },
      )

      expect(tenantStoreRepositoryMock.delete).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
      })
      expect(tenantStoreRepositoryMock.insert).toHaveBeenCalledWith(
        expectedTenantStores,
      )
      expect(result).toBe(expectedTenantStores)
    })

    it('(FAIL) throws if stores not in config', async () => {
      const storeMappings = [
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
          storeId: storeIdMock2,
        },
        {
          walletType: WalletType.INTERNAL_CODEFI_AWS_VAULT,
          storeId: storeIdMock3,
        },
      ]

      storeConfigServiceMock.get.mockResolvedValueOnce({
        [storeIdMock2]: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
      })

      try {
        await service.setTenantMappings(storeMappings, tenantIdMock)
        fail('should have thrown error')
      } catch (error) {
        expect(error.message).toBe(
          `The following stores are not registered or are incompatible with their specified wallet type: ${storeIdMock}, ${storeIdMock3}`,
        )
        expect(error.payload).toEqual([storeMappings[0], storeMappings[2]])
      }
    })

    it('(FAIL) throws if stores in config have different types', async () => {
      const storeMappings = [
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
          storeId: storeIdMock2,
        },
        {
          walletType: WalletType.INTERNAL_CODEFI_AWS_VAULT,
          storeId: storeIdMock3,
        },
      ]

      storeConfigServiceMock.get.mockResolvedValueOnce({
        [storeIdMock]: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        [storeIdMock2]: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
        [storeIdMock3]: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
      })

      try {
        await service.setTenantMappings(storeMappings, tenantIdMock)
        fail('should have thrown error')
      } catch (error) {
        expect(error.message).toBe(
          `The following stores are not registered or are incompatible with their specified wallet type: ${storeIdMock}, ${storeIdMock3}`,
        )
        expect(error.payload).toEqual([storeMappings[0], storeMappings[2]])
      }
    })

    it('(FAIL) throws if duplicate mappings for same wallet type', async () => {
      const storeMappings = [
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
          storeId: storeIdMock2,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock3,
        },
      ]

      try {
        await service.setTenantMappings(storeMappings, tenantIdMock)
        fail('should have thrown error')
      } catch (error) {
        expect(error.message).toBe(
          `Multiple store mappings were provided for the following wallet types: ${WalletType.INTERNAL_CLIENT_AWS_VAULT}`,
        )
        expect(error.payload).toEqual([WalletType.INTERNAL_CLIENT_AWS_VAULT])
      }
    })

    it.each([
      WalletType.EXTERNAL_CLIENT_METAMASK,
      WalletType.EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL,
      WalletType.EXTERNAL_OTHER,
    ])('(FAIL) throws if mapping has %s wallet type', async (walletType) => {
      const storeMappings = [
        {
          walletType,
          storeId: storeIdMock,
        },
      ]

      storeConfigServiceMock.get.mockResolvedValueOnce({})

      try {
        await service.setTenantMappings(storeMappings, tenantIdMock)
        fail('should have thrown error')
      } catch (error) {
        expect(error.message).toBe(
          `Stores can only be mapped to internal wallet types: ${storeIdMock}`,
        )
        expect(error.payload).toEqual([storeMappings[0]])
      }
    })
  })

  describe('setEntityMappings', () => {
    it('(OK) inserts entity store entities', async () => {
      const storeMappings = [
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
          storeId: storeIdMock2,
        },
      ]
      const expectedEntityStores = [
        {
          ...storeMappings[0],
          tenantId: tenantIdMock,
          entityId: entityIdMock,
        },
        {
          ...storeMappings[1],
          tenantId: tenantIdMock,
          entityId: entityIdMock,
        },
      ]

      entityStoreRepositoryMock.find.mockResolvedValueOnce(
        expectedEntityStores as EntityStoreEntity[],
      )

      storeConfigServiceMock.get.mockResolvedValueOnce({
        [storeIdMock]: WalletType.INTERNAL_CLIENT_AWS_VAULT,
        [storeIdMock2]: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
      })

      const result = await service.setEntityMappings(
        storeMappings,
        tenantIdMock,
        entityIdMock,
      )

      expect(entityStoreRepositoryMock.insert).toHaveBeenCalledWith(
        expectedEntityStores,
      )
      expect(entityStoreRepositoryMock.delete).toHaveBeenCalledTimes(0)
      expect(result).toBe(expectedEntityStores)
    })

    it('(OK) does not insert if no mappings provided', async () => {
      const result = await service.setEntityMappings(
        [],
        tenantIdMock,
        entityIdMock,
      )
      expect(entityStoreRepositoryMock.insert).toHaveBeenCalledTimes(0)
      expect(result).toEqual([])
    })

    it('(OK) removes existing mappings if requested', async () => {
      const storeMappings = [
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
          storeId: storeIdMock2,
        },
      ]
      const expectedEntityStores = [
        {
          ...storeMappings[0],
          tenantId: tenantIdMock,
          entityId: entityIdMock,
        },
        {
          ...storeMappings[1],
          tenantId: tenantIdMock,
          entityId: entityIdMock,
        },
      ]

      entityStoreRepositoryMock.find.mockResolvedValueOnce(
        expectedEntityStores as EntityStoreEntity[],
      )

      storeConfigServiceMock.get.mockResolvedValueOnce({
        [storeIdMock]: WalletType.INTERNAL_CLIENT_AWS_VAULT,
        [storeIdMock2]: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
      })

      const result = await service.setEntityMappings(
        storeMappings,
        tenantIdMock,
        entityIdMock,
        { removeExisting: true },
      )

      expect(entityStoreRepositoryMock.delete).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
      })
      expect(entityStoreRepositoryMock.insert).toHaveBeenCalledWith(
        expectedEntityStores,
      )
      expect(result).toBe(expectedEntityStores)
    })

    it('(FAIL) throws if stores not in config', async () => {
      const storeMappings = [
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
          storeId: storeIdMock2,
        },
        {
          walletType: WalletType.INTERNAL_CODEFI_AWS_VAULT,
          storeId: storeIdMock3,
        },
      ]

      storeConfigServiceMock.get.mockResolvedValueOnce({
        [storeIdMock2]: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
      })

      try {
        await service.setEntityMappings(
          storeMappings,
          tenantIdMock,
          entityIdMock,
        )
        fail('should have thrown error')
      } catch (error) {
        expect(error.message).toBe(
          `The following stores are not registered or are incompatible with their specified wallet type: ${storeIdMock}, ${storeIdMock3}`,
        )
        expect(error.payload).toEqual([storeMappings[0], storeMappings[2]])
      }
    })

    it('(FAIL) throws if stores in config have different types', async () => {
      const storeMappings = [
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
          storeId: storeIdMock2,
        },
        {
          walletType: WalletType.INTERNAL_CODEFI_AWS_VAULT,
          storeId: storeIdMock3,
        },
      ]

      storeConfigServiceMock.get.mockResolvedValueOnce({
        [storeIdMock]: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        [storeIdMock2]: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
        [storeIdMock3]: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
      })

      try {
        await service.setEntityMappings(
          storeMappings,
          tenantIdMock,
          entityIdMock,
        )
        fail('should have thrown error')
      } catch (error) {
        expect(error.message).toBe(
          `The following stores are not registered or are incompatible with their specified wallet type: ${storeIdMock}, ${storeIdMock3}`,
        )
        expect(error.payload).toEqual([storeMappings[0], storeMappings[2]])
      }
    })

    it('(FAIL) throws if duplicate mappings for same wallet type', async () => {
      const storeMappings = [
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AZURE_VAULT,
          storeId: storeIdMock2,
        },
        {
          walletType: WalletType.INTERNAL_CLIENT_AWS_VAULT,
          storeId: storeIdMock3,
        },
      ]

      try {
        await service.setEntityMappings(
          storeMappings,
          tenantIdMock,
          entityIdMock,
        )
        fail('should have thrown error')
      } catch (error) {
        expect(error.message).toBe(
          `Multiple store mappings were provided for the following wallet types: ${WalletType.INTERNAL_CLIENT_AWS_VAULT}`,
        )
        expect(error.payload).toEqual([WalletType.INTERNAL_CLIENT_AWS_VAULT])
      }
    })

    it.each([
      WalletType.EXTERNAL_CLIENT_METAMASK,
      WalletType.EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL,
      WalletType.EXTERNAL_OTHER,
    ])('(FAIL) throws if mapping has %s wallet type', async (walletType) => {
      const storeMappings = [
        {
          walletType,
          storeId: storeIdMock,
        },
      ]

      storeConfigServiceMock.get.mockResolvedValueOnce({})

      try {
        await service.setEntityMappings(
          storeMappings,
          tenantIdMock,
          entityIdMock,
        )
        fail('should have thrown error')
      } catch (error) {
        expect(error.message).toBe(
          `Stores can only be mapped to internal wallet types: ${storeIdMock}`,
        )
        expect(error.payload).toEqual([storeMappings[0]])
      }
    })
  })
})
