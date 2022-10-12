import { OnFidoController } from './OnFidoController'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import KYCResultsService from '../services/KYCResultsService'
import OnFidoKycWebhookRequest, {
  CheckActionType,
  KycActionType,
  ReportActionType,
} from './OnFidoKycWebhookRequest'
import Mocked = jest.Mocked
import { userId } from '../utils/test-data'

const testBody = 'str'
const testHmacSignature =
  '09a50c1e2db501c09bf742db8e5869d8f75874cc21fc0282cfcccb28e08db427'

const mockRequest: any = {
  rawBody: Buffer.from(testBody),
  header: jest.fn(),
}

describe('OnFidoController', () => {
  let logger: Mocked<NestJSPinoLogger>
  let kycResultsService: Mocked<KYCResultsService>
  let controller: OnFidoController

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    kycResultsService = createMockInstance(KYCResultsService)
    controller = new OnFidoController(
      logger,
      {
        onfido: {
          webhookToken: 'token',
        },
      } as any,
      kycResultsService,
    )

    mockRequest.header.mockImplementation((header) => {
      if (header === 'X-SHA2-Signature') {
        return testHmacSignature
      }

      return undefined
    })
  })

  it('process completed report', async () => {
    await controller.onfidoWebhook(
      createOnFidoRequest('report', ReportActionType.ReportCompleted),
      mockRequest,
    )

    expect(kycResultsService.onFidoReportCompleted).toHaveBeenCalledWith({
      completed_at_iso8601: '2020-06-16T09:04:34Z',
      href: 'href',
      id: 'id',
    })
    expect(kycResultsService.onFidoCheckCompleted).not.toHaveBeenCalled()
  })

  it('process completed check', async () => {
    await controller.onfidoWebhook(
      createOnFidoRequest('check', CheckActionType.CheckCompleted),
      mockRequest,
    )

    expect(kycResultsService.onFidoCheckCompleted).toHaveBeenCalledWith({
      completed_at_iso8601: '2020-06-16T09:04:34Z',
      href: 'href',
      id: 'id',
    })
    expect(kycResultsService.onFidoReportCompleted).not.toHaveBeenCalled()
  })

  it('ignore events of unexpected type', async () => {
    await controller.onfidoWebhook(
      createOnFidoRequest('check', CheckActionType.CheckStarted),
      mockRequest,
    )

    expect(kycResultsService.onFidoCheckCompleted).not.toHaveBeenCalled()
    expect(kycResultsService.onFidoReportCompleted).not.toHaveBeenCalled()
  })

  it('get reports by user id', async () => {
    await controller.getReports(userId)

    expect(kycResultsService.getReportResults).toHaveBeenCalledWith(userId)
  })
})

function createOnFidoRequest(
  type: string,
  action: KycActionType,
): OnFidoKycWebhookRequest {
  return {
    payload: {
      resource_type: type,
      action: action,
      object: {
        id: 'id',
        completed_at_iso8601: '2020-06-16T09:04:34Z',
        href: 'href', //`https://api.onfido.com/v3/${type}s/id`,
      },
    },
  }
}
