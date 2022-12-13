import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import { validClientGrantRequest, mockClientGrantId } from '../../test/mocks'
import { ClientGrantController } from './ClientGrantController'
import { ClientGrantService } from '../services/ClientGrantService'
import { Auth0Exception } from '../errors/Auth0Exception'

describe('ClientGrantController', () => {
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let controller: ClientGrantController
  let clientGrantServiceMock: jest.Mocked<ClientGrantService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    clientGrantServiceMock = createMockInstance(ClientGrantService)
    controller = new ClientGrantController(loggerMock, clientGrantServiceMock)
  })

  describe('clientGrantPost', () => {
    it('success', async () => {
      const validClientGrantReq = await validClientGrantRequest([
        'read:api',
        'write:api',
      ])
      await controller.clientGrant(validClientGrantReq)
      expect(clientGrantServiceMock.clientGrant).toHaveBeenCalledTimes(1)
      expect(clientGrantServiceMock.clientGrant).toHaveBeenCalledWith(
        validClientGrantReq.client_id,
        validClientGrantReq.audience,
        validClientGrantReq.scope,
      )
    })
  })

  describe('getClientGrants', () => {
    const clientId = 'clientId'
    const audience = 'audience'

    it('success', async () => {
      await controller.getClientGrants(clientId, audience)
      expect(clientGrantServiceMock.getClientGrant).toHaveBeenCalledTimes(1)
      expect(clientGrantServiceMock.getClientGrant).toHaveBeenCalledWith(
        clientId,
        audience,
      )
    })

    it('fails - throws', async () => {
      clientGrantServiceMock.getClientGrant.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(controller.getClientGrants()).rejects.toThrowError('boom')
    })
  })

  describe('delete client grant', () => {
    it('success', async () => {
      await controller.deleteClientGrantById(mockClientGrantId)
      expect(
        clientGrantServiceMock.deleteClientGrantById,
      ).toHaveBeenCalledTimes(1)
      expect(clientGrantServiceMock.deleteClientGrantById).toHaveBeenCalledWith(
        mockClientGrantId,
      )
    })

    it('fails - throws', async () => {
      clientGrantServiceMock.deleteClientGrantById.mockImplementationOnce(
        () => {
          throw new Auth0Exception({ message: 'boom' })
        },
      )
      await expect(
        controller.deleteClientGrantById(mockClientGrantId),
      ).rejects.toThrowError('boom')
    })
  })
})
