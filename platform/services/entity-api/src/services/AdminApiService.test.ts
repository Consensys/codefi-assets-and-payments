import { Commands } from '@codefi-assets-and-payments/messaging-events'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import { ProductsEnum } from '@codefi-assets-and-payments/ts-types'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import {
  clientNameMock,
  clientTypeMock,
  entityIdMock,
  initialAdminsMock,
  tenantIdMock,
} from '../../test/mocks'
import { AdminApiService } from './AdminApiService'

describe('AdminApiService', () => {
  let service: AdminApiService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let kafkaProducerMock: jest.Mocked<KafkaProducer>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    kafkaProducerMock = createMockInstance(KafkaProducer)

    service = new AdminApiService(loggerMock, kafkaProducerMock)
  })

  describe('createAdmins', () => {
    it.each([[[]], [undefined]])(
      '(OK) Returns when there are no admins (%j)',
      async (initialAdmins) => {
        const result = await service.createAdmins(
          initialAdmins,
          [],
          tenantIdMock,
          entityIdMock,
        )

        expect(result).toBeUndefined()
        expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
      },
    )

    it('(OK) sends one message for each admin (entityId: %s)', async () => {
      const roles = ['Role A', 'Role B']
      const result = await service.createAdmins(
        initialAdminsMock,
        roles,
        tenantIdMock,
        entityIdMock,
      )

      expect(result).toBeUndefined()
      for (const admin of initialAdminsMock) {
        expect(kafkaProducerMock.send).toHaveBeenCalledWith(
          Commands.userCreateCommand,
          {
            ...admin,
            appMetadata: JSON.stringify({}),
            applicationClientId: null,
            connection: null,
            password: null,
            emailVerified: false,
            roles,
            tenantId: tenantIdMock,
            entityId: entityIdMock,
          },
        )
      }
    })
  })

  describe('createClient', () => {
    it('(OK) sends client create command', async () => {
      const grantTypes = ['test1', 'test2']
      const result = await service.createClient(
        clientNameMock,
        clientTypeMock,
        grantTypes,
        tenantIdMock,
        entityIdMock,
      )

      expect(result).toBeUndefined()
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Commands.clientCreateCommand,
        {
          name: clientNameMock,
          description: clientNameMock,
          appType: clientTypeMock,
          isEmailOnly: false,
          clientMetadata: null,
          logoUri: null,
          callbacks: [],
          allowedLogoutUrls: [],
          webOrigins: [],
          allowedOrigins: [],
          grantTypes,
          jwtConfiguration: null,
          sso: null,
          initiateLoginUri: null,
          product: ProductsEnum.assets,
          tenantId: tenantIdMock,
          entityId: entityIdMock,
        },
      )
    })
  })
})
