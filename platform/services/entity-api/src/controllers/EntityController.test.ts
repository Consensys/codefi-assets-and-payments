import { EntityController } from './EntityController'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import {
  entityIdMock,
  tenantIdMock,
  subjectMock,
  entityMock,
  entityUpdateMock,
  walletAddressMock,
} from '../../test/mocks'
import { EntityService } from '../services/EntityService'
import { craftRequestWithAuthHeaders } from '@codefi-assets-and-payments/auth'
import { UnauthorizedException } from '@codefi-assets-and-payments/error-handler'
import { MAX_PAGINATED_LIMIT } from '../validation/paginatedQueryRequestProperties'
import { EntityQueryRequest } from '@codefi-assets-and-payments/ts-types'
import { EntityEntity } from '../data/entities/EntityEntity'
import { FindOperator } from 'typeorm'

const differentEntityIdMock = `different-${entityIdMock}`

describe('EntityController', () => {
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let entityServiceMock: jest.Mocked<EntityService>
  let controller: EntityController

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    entityServiceMock = createMockInstance(EntityService)
    controller = new EntityController(loggerMock, entityServiceMock)
  })

  describe('findAll', () => {
    it('success - default values', async () => {
      entityServiceMock.getAll.mockResolvedValueOnce([[], 0])
      const query: EntityQueryRequest = {
        skip: 0,
        limit: MAX_PAGINATED_LIMIT,
      }
      const result = await controller.findAll(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        query,
      )

      expect(result).toEqual({
        items: [],
        count: 0,
        skip: 0,
        limit: MAX_PAGINATED_LIMIT,
      })
      expect(entityServiceMock.getAll).toHaveBeenCalledWith(
        {
          skip: 0,
          take: MAX_PAGINATED_LIMIT,
          where: {
            tenantId: tenantIdMock,
          },
          order: {
            createdAt: 'DESC',
          },
        },
        undefined,
      )
    })

    it('success - query values', async () => {
      entityServiceMock.getAll.mockResolvedValueOnce([
        [entityMock as EntityEntity],
        1,
      ])
      const query: EntityQueryRequest = {
        skip: 1,
        limit: 100,
        ids: ['1', '2'],
        name: 'name',
        defaultWallet: walletAddressMock,
        includeWallets: true,
        metadata: { value1: 'value1 ' },
        metadataWithOptions: { value2: ['1', '2'] },
      }
      const result = await controller.findAll(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        query,
      )

      expect(result).toEqual({
        items: [entityMock],
        count: 1,
        skip: 1,
        limit: 100,
      })
      expect(entityServiceMock.getAll).toHaveBeenCalledWith(
        {
          skip: 1,
          take: 100,
          where: {
            tenantId: tenantIdMock,
            id: expect.any(FindOperator),
            name: 'name',
            defaultWallet: walletAddressMock,
            metadata: expect.any(FindOperator),
          },
          order: {
            createdAt: 'DESC',
          },
        },
        true,
      )
    })
  })

  describe('findById', () => {
    it("success - user retrieves his own entity without 'read_all' permission", async () => {
      await controller.findById(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        entityIdMock,
        true,
      )

      expect(entityServiceMock.getById).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.getById).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        true,
      )
    })
    it("success - user retrieves a different entity with 'read_all' permission", async () => {
      await controller.findById(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'read_all:entity',
        ]),
        differentEntityIdMock,
        false,
      )

      expect(entityServiceMock.getById).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.getById).toHaveBeenCalledWith(
        tenantIdMock,
        differentEntityIdMock,
        false,
      )
    })
    it("(FAIL) throws when entityId is different from user's entityId", async () => {
      await expect(
        controller.findById(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          differentEntityIdMock,
          false,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(entityServiceMock.getById).toHaveBeenCalledTimes(0)
    })
  })

  describe('create', () => {
    it('success', async () => {
      await controller.create(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        entityMock,
      )

      expect(entityServiceMock.create).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.create).toHaveBeenCalledWith(
        {
          ...entityMock,
          tenantId: tenantIdMock,
        },
        subjectMock,
      )
    })
  })

  describe('update', () => {
    it("success - user updates his own entity without 'update_all' permission", async () => {
      const entityUpdateRequest = {
        ...entityUpdateMock,
        defaultWallet: walletAddressMock,
      }

      await controller.update(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        entityIdMock,
        entityUpdateRequest,
      )

      expect(entityServiceMock.update).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.update).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        entityUpdateRequest,
      )
    })
    it("success - user updates a different entity with 'update_all' permission", async () => {
      const entityUpdateRequest = {
        ...entityUpdateMock,
        defaultWallet: walletAddressMock,
      }

      await controller.update(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'update_all:entity',
        ]),
        differentEntityIdMock,
        entityUpdateRequest,
      )

      expect(entityServiceMock.update).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.update).toHaveBeenCalledWith(
        tenantIdMock,
        differentEntityIdMock,
        entityUpdateRequest,
      )
    })
    it("(FAIL) throws when entityId is different from user's entityId", async () => {
      const entityUpdateRequest = {
        ...entityUpdateMock,
        defaultWallet: walletAddressMock,
      }

      await expect(
        controller.update(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          differentEntityIdMock,
          entityUpdateRequest,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(entityServiceMock.update).toHaveBeenCalledTimes(0)
    })
  })

  describe('delete', () => {
    it("success - user deletes his own entity without 'delete_all' permission", async () => {
      await controller.delete(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        entityIdMock,
      )

      expect(entityServiceMock.delete).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.delete).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
      )
    })
    it("success - user deletes a different entity with 'delete_all' permission", async () => {
      await controller.delete(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'delete_all:entity',
        ]),
        differentEntityIdMock,
      )

      expect(entityServiceMock.delete).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.delete).toHaveBeenCalledWith(
        tenantIdMock,
        differentEntityIdMock,
      )
    })
    it("(FAIL) throws when entityId is different from user's entityId", async () => {
      await expect(
        controller.delete(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          differentEntityIdMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(entityServiceMock.delete).toHaveBeenCalledTimes(0)
    })
  })
})
