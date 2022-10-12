import { TenantController } from './TenantController'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import {
  tenantIdMock,
  subjectMock,
  tenantMock,
  tenantUpdateMock,
  entityIdMock,
} from '../../test/mocks'
import { TenantService } from '../services/TenantService'
import { craftRequestWithAuthHeaders } from '@codefi-assets-and-payments/auth'
import { UnauthorizedException } from '@codefi-assets-and-payments/error-handler'
import { MAX_PAGINATED_LIMIT } from '../validation/paginatedQueryRequestProperties'
import { TenantQueryRequest } from '@codefi-assets-and-payments/ts-types'
import { TenantEntity } from '../data/entities/TenantEntity'
import { FindOperator } from 'typeorm'

const differentTenantIdMock = `different-${tenantIdMock}`

describe('TenantController', () => {
  let controller: TenantController
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tenantServiceMock: jest.Mocked<TenantService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    tenantServiceMock = createMockInstance(TenantService)
    controller = new TenantController(loggerMock, tenantServiceMock)
  })

  describe('findAll', () => {
    it('success - default values', async () => {
      tenantServiceMock.getAll.mockResolvedValueOnce([[], 0])
      const query = {
        skip: 0,
        limit: MAX_PAGINATED_LIMIT,
      }
      const result = await controller.findAll(query)

      expect(result).toEqual({
        items: [],
        count: 0,
        skip: 0,
        limit: MAX_PAGINATED_LIMIT,
      })
      expect(tenantServiceMock.getAll).toHaveBeenCalledWith({
        skip: 0,
        take: MAX_PAGINATED_LIMIT,
        where: {},
        order: {
          createdAt: 'DESC',
        },
      })
    })

    it('success - query values', async () => {
      tenantServiceMock.getAll.mockResolvedValueOnce([
        [tenantMock as TenantEntity],
        1,
      ])
      const query: TenantQueryRequest = {
        skip: 1,
        limit: 100,
        name: 'name',
        products: { assets: true, payments: false },
        defaultNetworkKey: 'defaultNetworkKey',
        metadata: { value1: 'value1 ' },
      }
      const result = await controller.findAll(query)

      expect(result).toEqual({
        items: [tenantMock],
        count: 1,
        skip: 1,
        limit: 100,
      })
      expect(tenantServiceMock.getAll).toHaveBeenCalledWith({
        skip: query.skip,
        take: query.limit,
        where: {
          name: query.name,
          products: query.products,
          defaultNetworkKey: query.defaultNetworkKey,
          metadata: expect.any(FindOperator),
        },
        order: {
          createdAt: 'DESC',
        },
      })
    })
  })

  describe('findById', () => {
    it("success - user retrieves his own tenant without 'read_all' permission", async () => {
      await controller.findById(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        tenantIdMock,
      )

      expect(tenantServiceMock.getById).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.getById).toHaveBeenCalledWith(tenantIdMock)
    })
    it("success - user retrieves a different tenant with 'read_all' permission", async () => {
      await controller.findById(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'read_all:tenant',
        ]),
        differentTenantIdMock,
      )

      expect(tenantServiceMock.getById).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.getById).toHaveBeenCalledWith(
        differentTenantIdMock,
      )
    })
    it("(FAIL) throws when tenantId is different from user's tenantId", async () => {
      await expect(
        controller.findById(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          differentTenantIdMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(tenantServiceMock.getById).toHaveBeenCalledTimes(0)
    })
  })

  describe('create', () => {
    it('success', async () => {
      await controller.create(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        tenantMock,
      )

      expect(tenantServiceMock.create).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.create).toHaveBeenCalledWith(
        tenantMock,
        subjectMock,
      )
    })
  })

  describe('update', () => {
    it("success - user updates his own tenant without 'update_all' permission", async () => {
      await controller.update(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        tenantIdMock,
        tenantUpdateMock,
      )

      expect(tenantServiceMock.update).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.update).toHaveBeenCalledWith(
        tenantIdMock,
        tenantUpdateMock,
      )
    })
    it("success - user updates a different tenant with 'update_all' permission", async () => {
      await controller.update(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'update_all:tenant',
        ]),
        differentTenantIdMock,
        tenantUpdateMock,
      )

      expect(tenantServiceMock.update).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.update).toHaveBeenCalledWith(
        differentTenantIdMock,
        tenantUpdateMock,
      )
    })
    it("(FAIL) throws when tenantId is different from user's tenantId", async () => {
      await expect(
        controller.update(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          differentTenantIdMock,
          tenantUpdateMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(tenantServiceMock.update).toHaveBeenCalledTimes(0)
    })
  })

  describe('delete', () => {
    it("success - user deletes his own tenant without 'delete_all' permission", async () => {
      await controller.delete(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        tenantIdMock,
      )

      expect(tenantServiceMock.delete).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.delete).toHaveBeenCalledWith(tenantIdMock)
    })
    it("success - user deletes a different tenant with 'delete_all' permission", async () => {
      await controller.delete(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'delete_all:tenant',
        ]),
        differentTenantIdMock,
      )

      expect(tenantServiceMock.delete).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.delete).toHaveBeenCalledWith(
        differentTenantIdMock,
      )
    })
    it("(FAIL) throws when tenantId is different from user's tenantId", async () => {
      await expect(
        controller.delete(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          differentTenantIdMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)

      expect(tenantServiceMock.delete).toHaveBeenCalledTimes(0)
    })
  })
})
