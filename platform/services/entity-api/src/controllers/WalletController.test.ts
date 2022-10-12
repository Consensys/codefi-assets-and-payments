import { WalletController } from './WalletController'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import {
  tenantIdMock,
  subjectMock,
  entityIdMock,
  walletAddressMock,
  walletMock,
  walletUpdateMock,
} from '../../test/mocks'
import { WalletService } from '../services/WalletService'
import { craftRequestWithAuthHeaders } from '@codefi-assets-and-payments/auth'
import { WalletEntity } from '../data/entities/WalletEntity'
import { EntityService } from '../services/EntityService'
import { UnauthorizedException } from '@codefi-assets-and-payments/error-handler'
import { MAX_PAGINATED_LIMIT } from '../validation/paginatedQueryRequestProperties'
import { WalletQueryRequest, WalletType } from '@codefi-assets-and-payments/ts-types'
import { FindOperator } from 'typeorm'

const differentEntityIdMock = `different-${entityIdMock}`

describe('WalletController', () => {
  let controller: WalletController
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let walletServiceMock: jest.Mocked<WalletService>
  let entityServiceMock: jest.Mocked<EntityService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    walletServiceMock = createMockInstance(WalletService)
    entityServiceMock = createMockInstance(EntityService)
    controller = new WalletController(
      loggerMock,
      walletServiceMock,
      entityServiceMock,
    )
  })

  describe('findAll', () => {
    it("success - user lists his own entity's wallet without 'read_all' permission", async () => {
      walletServiceMock.getAll.mockResolvedValueOnce([[], 0])

      const query = {
        skip: 0,
        limit: MAX_PAGINATED_LIMIT,
      }
      const result = await controller.findAll(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        query,
        entityIdMock,
      )

      expect(result).toEqual({
        items: [],
        count: 0,
        skip: 0,
        limit: MAX_PAGINATED_LIMIT,
      })
      expect(walletServiceMock.getAll).toHaveBeenCalledWith({
        skip: 0,
        take: MAX_PAGINATED_LIMIT,
        where: {
          tenantId: tenantIdMock,
          entityId: entityIdMock,
        },
        order: {
          createdAt: 'DESC',
        },
      })
    })

    it("success - user lists a different entity's wallet with 'read_all' permission", async () => {
      walletServiceMock.getAll.mockResolvedValueOnce([[], 0])

      const query = {
        skip: 0,
        limit: MAX_PAGINATED_LIMIT,
      }
      const result = await controller.findAll(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'read_all:entity',
        ]),
        query,
        differentEntityIdMock,
      )

      expect(result).toEqual({
        items: [],
        count: 0,
        skip: 0,
        limit: MAX_PAGINATED_LIMIT,
      })
      expect(walletServiceMock.getAll).toHaveBeenCalledTimes(1)
      expect(walletServiceMock.getAll).toHaveBeenCalledWith({
        skip: 0,
        take: MAX_PAGINATED_LIMIT,
        where: {
          tenantId: tenantIdMock,
          entityId: differentEntityIdMock,
        },
        order: {
          createdAt: 'DESC',
        },
      })
    })

    it("(FAIL) throws when entityId is different from user's entityId", async () => {
      walletServiceMock.getAll.mockResolvedValueOnce([[], 0])

      const query = {
        skip: 0,
        limit: MAX_PAGINATED_LIMIT,
      }
      await expect(
        controller.findAll(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          query,
          differentEntityIdMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(walletServiceMock.getAll).toHaveBeenCalledTimes(0)
    })

    it('success - query values', async () => {
      walletServiceMock.getAll.mockResolvedValueOnce([
        [walletMock as WalletEntity],
        1,
      ])
      const query: WalletQueryRequest = {
        skip: 1,
        limit: 100,
        type: WalletType.EXTERNAL_OTHER,
        metadata: { value1: 'value1 ' },
      }
      const result = await controller.findAll(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        query,
        entityIdMock,
      )

      expect(result).toEqual({
        items: [walletMock],
        count: 1,
        skip: 1,
        limit: 100,
      })
      expect(walletServiceMock.getAll).toHaveBeenCalledWith({
        skip: query.skip,
        take: query.limit,
        where: {
          tenantId: tenantIdMock,
          entityId: entityIdMock,
          type: query.type,
          metadata: expect.any(FindOperator),
        },
        order: {
          createdAt: 'DESC',
        },
      })
    })
  })

  describe('findById', () => {
    it("success - user retrieves his own entity's wallet without 'read_all' permission", async () => {
      await controller.findById(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        entityIdMock,
        walletAddressMock,
      )

      expect(walletServiceMock.getById).toHaveBeenCalledTimes(1)
      expect(walletServiceMock.getById).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
      )
    })
    it("success - user retrieves a different entity's wallet with 'read_all' permission", async () => {
      await controller.findById(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'read_all:entity',
        ]),
        differentEntityIdMock,
        walletAddressMock,
      )

      expect(walletServiceMock.getById).toHaveBeenCalledTimes(1)
      expect(walletServiceMock.getById).toHaveBeenCalledWith(
        tenantIdMock,
        differentEntityIdMock,
        walletAddressMock,
      )
    })
    it("(FAIL) throws when entityId is different from user's entityId", async () => {
      await expect(
        controller.findById(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          differentEntityIdMock,
          walletAddressMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(walletServiceMock.getById).toHaveBeenCalledTimes(0)
    })
  })

  describe('create', () => {
    it("success - user create a wallet for his own entity without 'update_all' permission", async () => {
      entityServiceMock.createWalletForEntity.mockResolvedValueOnce(
        walletMock as WalletEntity,
      )

      const result = await controller.create(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        false,
        entityIdMock,
        walletMock,
      )

      expect(entityServiceMock.createWalletForEntity).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.createWalletForEntity).toHaveBeenCalledWith(
        tenantIdMock,
        { ...walletMock, entityId: entityIdMock, createdBy: subjectMock },
        false,
      )
      expect(result).toEqual(walletMock)
    })
    it("success - user create a wallet for a different entity with 'update_all' permission", async () => {
      entityServiceMock.createWalletForEntity.mockResolvedValueOnce(
        walletMock as WalletEntity,
      )

      const result = await controller.create(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'update_all:entity',
        ]),
        false,
        differentEntityIdMock,
        walletMock,
      )

      expect(entityServiceMock.createWalletForEntity).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.createWalletForEntity).toHaveBeenCalledWith(
        tenantIdMock,
        {
          ...walletMock,
          entityId: differentEntityIdMock,
          createdBy: subjectMock,
        },
        false,
      )
      expect(result).toEqual(walletMock)
    })
    it("(FAIL) throws when entityId is different from user's entityId", async () => {
      entityServiceMock.createWalletForEntity.mockResolvedValueOnce(
        walletMock as WalletEntity,
      )

      await expect(
        controller.create(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          false,
          differentEntityIdMock,
          walletMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(entityServiceMock.createWalletForEntity).toHaveBeenCalledTimes(0)
    })
  })

  describe('update', () => {
    it("success - user updates his own entity's wallet without 'update_all' permission", async () => {
      entityServiceMock.updateWalletForEntity.mockResolvedValueOnce(
        walletMock as WalletEntity,
      )

      const result = await controller.update(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        true,
        entityIdMock,
        walletAddressMock,
        walletUpdateMock,
      )

      expect(entityServiceMock.updateWalletForEntity).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.updateWalletForEntity).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
        walletUpdateMock,
        true,
      )
      expect(result).toEqual(walletMock)
    })
    it("success - user updates a different entity's wallet with 'update_all' permission", async () => {
      entityServiceMock.updateWalletForEntity.mockResolvedValueOnce(
        walletMock as WalletEntity,
      )

      const result = await controller.update(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'update_all:entity',
        ]),
        true,
        differentEntityIdMock,
        walletAddressMock,
        walletUpdateMock,
      )

      expect(entityServiceMock.updateWalletForEntity).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.updateWalletForEntity).toHaveBeenCalledWith(
        tenantIdMock,
        differentEntityIdMock,
        walletAddressMock,
        walletUpdateMock,
        true,
      )
      expect(result).toEqual(walletMock)
    })
    it("(FAIL) throws when entityId is different from user's entityId", async () => {
      entityServiceMock.updateWalletForEntity.mockResolvedValueOnce(
        walletMock as WalletEntity,
      )

      await expect(
        controller.update(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          true,
          differentEntityIdMock,
          walletAddressMock,
          walletUpdateMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(entityServiceMock.updateWalletForEntity).toHaveBeenCalledTimes(0)
    })
  })

  describe('delete', () => {
    it("success - user deletes his own entity's wallet without 'update_all' permission", async () => {
      await controller.delete(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        entityIdMock,
        walletAddressMock,
      )

      expect(walletServiceMock.delete).toHaveBeenCalledTimes(1)
      expect(walletServiceMock.delete).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
      )
    })
    it("success - user deletes a different entity's wallet with 'update_all' permission", async () => {
      await controller.delete(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'update_all:entity',
        ]),
        differentEntityIdMock,
        walletAddressMock,
      )

      expect(walletServiceMock.delete).toHaveBeenCalledTimes(1)
      expect(walletServiceMock.delete).toHaveBeenCalledWith(
        tenantIdMock,
        differentEntityIdMock,
        walletAddressMock,
      )
    })
    it("(FAIL) throws when entityId is different from user's entityId", async () => {
      await expect(
        controller.delete(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          differentEntityIdMock,
          walletAddressMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(walletServiceMock.delete).toHaveBeenCalledTimes(0)
    })
  })
})
