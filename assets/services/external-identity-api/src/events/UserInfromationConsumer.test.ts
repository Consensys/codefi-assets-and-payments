import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import Mocked = jest.Mocked
import { UserInformationConsumer } from './UserInformationConsumer'
import { userPersonalInformation } from '../utils/test-data'
import { KYCService } from '../services/KYCService'

describe('TestConsumer', () => {
  let logger: Mocked<NestJSPinoLogger>
  let service: Mocked<KYCService>
  let consumer: UserInformationConsumer

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    service = createMockInstance(KYCService)
    consumer = new UserInformationConsumer(logger, service)
  })

  it('process messages', async () => {
    await consumer.onMessage(
      {
        ...userPersonalInformation(),
        dateOfBirth: '1970-01-02',
      },
      null,
      'topic',
      0,
    )

    expect(service.processUserInfoUpdate).toHaveBeenCalledWith({
      ...userPersonalInformation(),
      dateOfBirth: new Date('1970-01-02'),
    })
  })
})
