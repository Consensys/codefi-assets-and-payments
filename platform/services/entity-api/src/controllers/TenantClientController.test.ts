import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import {
  tenantIdMock,
  subjectMock,
  entityIdMock,
  tenantIdMock2,
  entityClientCreateRequestMock,
} from '../../test/mocks'
import { craftRequestWithAuthHeaders } from '@consensys/auth'
import { TenantClientController } from './TenantClientController'
import { ClientService } from '../services/ClientService'
import { ClientType, EntityStatus } from '@consensys/ts-types'
import { UnauthorizedException } from '@consensys/error-handler'
import { ClientEntity } from '../data/entities/ClientEntity'

describe('TenantClientController', () => {
  let controller: TenantClientController
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let clientServiceMock: jest.Mocked<ClientService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    clientServiceMock = createMockInstance(ClientService)
    controller = new TenantClientController(loggerMock, clientServiceMock)
  })

  describe('findAll', () => {
    it('(OK) calls client service with provided query values', async () => {
      const resultItems = [
        { id: null, tenantId: null, entityId: null },
        { id: null, tenantId: null, entityId: null },
      ] as ClientEntity[]
      const resultCount = 37
      const query = {
        skip: 1,
        limit: 2,
        type: ClientType.SinglePage,
        status: EntityStatus.Pending,
      }

      clientServiceMock.getAll.mockResolvedValueOnce([resultItems, resultCount])

      const result = await controller.findAll(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        tenantIdMock,
        query,
      )

      expect(clientServiceMock.getAll).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.getAll).toHaveBeenCalledWith({
        skip: query.skip,
        take: query.limit,
        where: {
          type: query.type,
          status: query.status,
          tenantId: tenantIdMock,
        },
        order: {
          createdAt: 'DESC',
        },
      })
      expect(result).toEqual({
        items: [{}, {}],
        count: resultCount,
        limit: query.limit,
        skip: query.skip,
      })
    })

    it('(OK) calls client service with default values', async () => {
      const resultItems = [
        { id: null, tenantId: null, entityId: null },
        { id: null, tenantId: null, entityId: null },
      ] as ClientEntity[]
      const resultCount = 37

      clientServiceMock.getAll.mockResolvedValueOnce([resultItems, resultCount])

      const result = await controller.findAll(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        tenantIdMock,
        {},
      )

      expect(clientServiceMock.getAll).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.getAll).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          tenantId: tenantIdMock,
        },
        order: {
          createdAt: 'DESC',
        },
      })
      expect(result).toEqual({
        items: [{}, {}],
        count: resultCount,
        limit: undefined,
        skip: undefined,
      })
    })

    it('(OK) does not throw if tenant id does not match token but has read_all:tenant permission', async () => {
      clientServiceMock.getAll.mockResolvedValueOnce([[], 0])

      await controller.findAll(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'read_all:tenant',
        ]),
        tenantIdMock2,
        {},
      )
    })

    it('(FAIL) throws if tenant id does not match token and no read_all:tenant permission', async () => {
      await expect(
        controller.findAll(
          craftRequestWithAuthHeaders(
            tenantIdMock,
            entityIdMock,
            subjectMock,
            [],
          ),
          tenantIdMock2,
          {},
        ),
      ).rejects.toThrowError(UnauthorizedException)
    })
  })

  describe('create', () => {
    it('(OK) calls client service', async () => {
      await controller.create(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        tenantIdMock,
        entityClientCreateRequestMock,
      )

      expect(clientServiceMock.create).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.create).toHaveBeenCalledWith(
        tenantIdMock,
        undefined,
        entityClientCreateRequestMock,
      )
    })

    it('(OK) does not throw if tenant id does not match token but has update_all:tenant permission', async () => {
      await controller.create(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'update_all:tenant',
        ]),
        tenantIdMock2,
        entityClientCreateRequestMock,
      )

      expect(clientServiceMock.create).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.create).toHaveBeenCalledWith(
        tenantIdMock2,
        undefined,
        entityClientCreateRequestMock,
      )
    })

    it('(FAIL) throws if tenant id does not match token and no update_all:tenant permission', async () => {
      await expect(
        controller.create(
          craftRequestWithAuthHeaders(
            tenantIdMock,
            entityIdMock,
            subjectMock,
            [],
          ),
          tenantIdMock2,
          entityClientCreateRequestMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)
    })
  })
})
