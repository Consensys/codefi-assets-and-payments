import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import {
  tenantIdMock,
  subjectMock,
  entityIdMock,
  tenantIdMock2,
  entityIdMock2,
  entityClientCreateRequestMock,
} from '../../test/mocks'
import { craftRequestWithAuthHeaders } from '@consensys/auth'
import { EntityClientController } from './EntityClientController'
import { ClientService } from '../services/ClientService'
import { ClientType, EntityStatus } from '@consensys/ts-types'
import { UnauthorizedException } from '@consensys/error-handler'
import { ClientEntity } from '../data/entities/ClientEntity'

describe('EntityClientController', () => {
  let controller: EntityClientController
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let clientServiceMock: jest.Mocked<ClientService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    clientServiceMock = createMockInstance(ClientService)
    controller = new EntityClientController(loggerMock, clientServiceMock)
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
        entityIdMock,
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
          entityId: entityIdMock,
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
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'read_all:entity',
        ]),
        entityIdMock,
        {},
      )

      expect(clientServiceMock.getAll).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.getAll).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          tenantId: tenantIdMock,
          entityId: entityIdMock,
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

    it('(OK) does not throw if entity id does not match token but has read_all:entity permission', async () => {
      clientServiceMock.getAll.mockResolvedValueOnce([[], 0])

      await controller.findAll(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'read_all:entity',
        ]),
        entityIdMock2,
        {},
      )
    })

    it('(FAIL) throws if entity id does not match token and no read_all:entity permission', async () => {
      await expect(
        controller.findAll(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          tenantIdMock2,
          {},
        ),
      ).rejects.toThrowError(UnauthorizedException)
    })
  })

  describe('create', () => {
    it('(OK) calls client service', async () => {
      await controller.create(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'update_all:entity',
        ]),
        entityIdMock,
        entityClientCreateRequestMock,
      )

      expect(clientServiceMock.create).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.create).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        entityClientCreateRequestMock,
      )
    })

    it('(OK) does not throw if entity id does not match token but has update_all:entity permission', async () => {
      await controller.create(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock, [
          'update_all:entity',
        ]),
        entityIdMock2,
        entityClientCreateRequestMock,
      )

      expect(clientServiceMock.create).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.create).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock2,
        entityClientCreateRequestMock,
      )
    })

    it('(FAIL) throws if entity id does not match token and no update_all:entity permission', async () => {
      await expect(
        controller.create(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          entityIdMock2,
          entityClientCreateRequestMock,
        ),
      ).rejects.toThrowError(UnauthorizedException)
    })
  })
})
