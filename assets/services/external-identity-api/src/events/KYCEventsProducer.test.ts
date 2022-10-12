import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import KYCEventsProducer from './KYCEventsProducer'
import { checkResult, reportResult, userId } from '../utils/test-data'
import { Events } from '@codefi-assets-and-payments/messaging-events'
import {
  KYCResult,
  KYCScope,
} from '@codefi-assets-and-payments/messaging-events/dist'
import Mocked = jest.Mocked

describe('KYCEventsProducer', () => {
  let logger: Mocked<NestJSPinoLogger>
  let kafkaProducer: Mocked<KafkaProducer>
  let producer: KYCEventsProducer

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    kafkaProducer = createMockInstance(KafkaProducer)
    producer = new KYCEventsProducer(logger, kafkaProducer)
  })

  it('publish failed personal info submission event', async () => {
    await producer.publishFailedPersonalInfoSubmission(userId, {
      field: ['error'],
    })

    expect(kafkaProducer.send).toHaveBeenCalledWith(
      Events.externalKYCResultEvent,
      {
        errors: {
          field: ['error'],
        },
        message: 'Personal information is invalid',
        reportName: null,
        result: 'FAIL',
        scope: 'IDENTITY',
        userId: userId,
      },
    )
  })

  it('publish failed Onfido report submission event', async () => {
    await producer.publishFailedOnfidoReport(
      userId,
      reportResult(KYCResult.Fail),
    )

    expect(kafkaProducer.send).toHaveBeenCalledWith(
      Events.externalKYCResultEvent,
      {
        errors: {},
        message: 'Onfido report failed',
        reportName: 'report-name',
        result: 'FAIL',
        scope: KYCScope.Id,
        userId: userId,
      },
    )
  })

  it('publish passed Onfido check event', async () => {
    await producer.publishPassedOnfidoCheck(userId, checkResult(KYCResult.Pass))

    expect(kafkaProducer.send).toHaveBeenCalledWith(
      Events.externalKYCResultEvent,
      {
        errors: {},
        message: 'Onfido check passed',
        result: 'PASS',
        scope: KYCScope.All,
        userId: userId,
      },
    )
  })
})
