import { EventsService } from './EventsService'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import createMockInstance from 'jest-create-mock-instance'
import {
  userCreatedEventMock,
  clientCreatedEventMock,
  tenantCreatedEventMock,
  userUpdatedEventMock,
} from '../../test/mocks'
import { Events } from '@codefi-assets-and-payments/messaging-events'
import cfg from '../config'

describe('EventsService', () => {
  let service: EventsService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let kafkaProducerMock: jest.Mocked<KafkaProducer>

  beforeEach(() => {
    cfg().kafka.enabled = true
    loggerMock = createMockInstance(NestJSPinoLogger)
    kafkaProducerMock = createMockInstance(KafkaProducer)
    service = new EventsService(loggerMock, kafkaProducerMock)
  })

  describe('emitUserCreatedEvent', () => {
    it('success', async () => {
      await service.emitUserCreatedEvent(userCreatedEventMock)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(1)
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.userCreatedEvent,
        userCreatedEventMock,
      )
    })

    it('kafka disabled does not send event', async () => {
      cfg().kafka.enabled = false
      await service.emitUserCreatedEvent(userCreatedEventMock)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('emitUserUpdatedEvent', () => {
    it('success', async () => {
      await service.emitUserUpdatedEvent(userUpdatedEventMock)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(1)
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.userUpdatedEvent,
        userUpdatedEventMock,
      )
    })

    it('kafka disabled does not send event', async () => {
      cfg().kafka.enabled = false
      await service.emitUserCreatedEvent(userCreatedEventMock)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('emitClientCreatedEvent', () => {
    it('success', async () => {
      await service.emitClientCreatedEvent(clientCreatedEventMock)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(1)
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.clientCreatedEvent,
        clientCreatedEventMock,
      )
    })

    it('kafka disabled does not send event', async () => {
      cfg().kafka.enabled = false
      await service.emitClientCreatedEvent(clientCreatedEventMock)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('emitTenantCreatedEvent', () => {
    it('success', async () => {
      await service.emitTenantCreatedEvent(tenantCreatedEventMock)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(1)
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.tenantCreatedEvent,
        tenantCreatedEventMock,
      )
    })

    it('kafka disabled does not send event', async () => {
      cfg().kafka.enabled = false
      await service.emitTenantCreatedEvent(tenantCreatedEventMock)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })
})
