import OnFidoClient from './OnFidoClient'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  applicantId,
  checkId,
  reportId,
  userPersonalInformation,
} from '../../utils/test-data'
// import InvalidPersonalInfoError from './InvalidPersonalInfoError'
import ReportName from './ReportName'
import { OnfidoKycResult } from './OnfidoKYCResult'
import { KYCResult, KYCScope } from '@consensys/messaging-events/dist'
import { BadRequestException } from '@nestjs/common'

const validationError = {
  responseBody: {
    error: {
      type: 'validation_error',
      fields: {
        firstName: ['first name error'],
        address: [
          {
            street: ['street error'],
          },
        ],
        id_numbers: [
          {
            value: ['Invalid SSN format'],
          },
        ],
      },
    },
  },
}

describe('OnFidoClient', () => {
  let logger: NestJSPinoLogger
  let onfido
  let onfidoClient: OnFidoClient

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    onfido = {
      applicant: {
        create: jest.fn(),
        update: jest.fn(),
      },
      sdkToken: {
        generate: jest.fn(),
      },
      report: {
        find: jest.fn(),
      },
      check: {
        find: jest.fn(),
        create: jest.fn(),
      },
    }
    // onfido = new mockedOnfido(null)
    onfidoClient = new OnFidoClient(logger, onfido as any)
  })

  it('creates Onfido applicant', async () => {
    onfido.applicant.create.mockResolvedValue({
      id: applicantId,
    })
    const resultApplicantId = await onfidoClient.createApplicant(
      userPersonalInformation(),
    )

    expect(applicantId).toEqual(resultApplicantId)
    expect(onfido.applicant.create).toHaveBeenCalledWith({
      address: {
        buildingName: 'building-name',
        buildingNumber: '5',
        country: 'GBR',
        flatNumber: '42',
        postcode: 'CF32 3QD',
        state: 'California',
        street: 'Caradon Hill',
        subStreet: 'Substreet',
        town: 'TYTHEGSTON',
      },
      dob: '1990-01-01',
      email: 'joe.doe@email.com',
      firstName: 'Joe',
      idNumbers: [
        {
          type: 'ssn',
          value: 'ssn',
        },
      ],
      lastName: 'Doe',
    })
  })

  it('extracts errors if creating an applicant fails', (done) => {
    onfido.applicant.create.mockRejectedValue(validationError)

    onfidoClient
      .createApplicant(userPersonalInformation())
      .then(() => {
        done.fail(new Error('Test should have failed'))
      })
      .catch((e) => {
        validateInvalidPersonaInfoError(e)
        done()
      })
  })

  it('updates Onfido applicant', async () => {
    onfido.applicant.update.mockResolvedValue(null)
    await onfidoClient.updateApplicant(applicantId, userPersonalInformation())

    expect(onfido.applicant.update).toHaveBeenCalledWith(applicantId, {
      firstName: 'Joe',
      lastName: 'Doe',
      email: 'joe.doe@email.com',
      dob: '1990-01-01',
      address: {
        buildingName: 'building-name',
        buildingNumber: '5',
        country: 'GBR',
        flatNumber: '42',
        postcode: 'CF32 3QD',
        state: 'California',
        street: 'Caradon Hill',
        subStreet: 'Substreet',
        town: 'TYTHEGSTON',
      },
      idNumbers: [
        {
          type: 'ssn',
          value: 'ssn',
        },
      ],
    })
  })

  it('extracts errors if updating an applicant fails', (done) => {
    onfido.applicant.update.mockRejectedValue(validationError)

    onfidoClient
      .updateApplicant(applicantId, userPersonalInformation())
      .then(() => {
        done.fail(new Error('Test should have failed'))
      })
      .catch((e) => {
        validateInvalidPersonaInfoError(e)
        done()
      })
  })

  it('process unexpected error when updating an applicant', async () => {
    onfido.applicant.update.mockRejectedValue(new Error('test error'))

    await expect(
      onfidoClient.updateApplicant(applicantId, userPersonalInformation()),
    ).rejects.toThrow('Failed to update an OnFido applicant: test error')
  })

  it('get check status', async () => {
    onfido.check.find.mockResolvedValue({
      id: checkId,
      applicantId,
      name: ReportName.IdentityEnhanced,
      result: OnfidoKycResult.Consider,
    } as any)

    const checkStatus = await onfidoClient.getCheckStatus(checkId)

    expect(onfido.check.find).toHaveBeenCalledWith(checkId)
    expect(checkStatus).toEqual({
      applicantId,
      result: KYCResult.Fail,
    })
  })

  it('process unexpected error when getting a check status', async () => {
    onfido.check.find.mockRejectedValue(new Error('test error'))

    await expect(onfidoClient.getCheckStatus(checkId)).rejects.toThrow(
      'Failed to get check by id: test error',
    )
  })

  it('get report status', async () => {
    onfido.report.find.mockResolvedValue({
      id: reportId,
      name: ReportName.IdentityEnhanced,
      href: 'href',
      result: OnfidoKycResult.Clear,
      checkId,
    } as any)

    const reportStatus = await onfidoClient.getReportStatus(reportId)

    expect(onfido.report.find).toHaveBeenCalledWith(reportId)
    expect(reportStatus).toEqual({
      checkId,
      reportId,
      name: ReportName.IdentityEnhanced,
      href: 'href',
      result: KYCResult.Pass,
      scope: KYCScope.Identity,
    })
  })

  it('initialize check for an applicant', async () => {
    onfido.check.create.mockResolvedValue({
      id: checkId,
    })
    const result = await onfidoClient.initializeCheckForApplicantId(applicantId)

    expect(onfido.check.create).toHaveBeenCalledWith({
      applicantId: 'applicant-id',
      asynchronous: true,
      reportNames: [
        // ReportName.IdentityEnhanced,
        // ReportName.WatchlistEnhanced,
        ReportName.FacialSimilarityPhoto,
        ReportName.FacialSimilarityVideo,
        ReportName.Document,
      ],
    })
    expect(result).toEqual(checkId)
  })

  it('process unexpected error when initializing a check', async () => {
    onfido.check.create.mockRejectedValue(new Error('test error'))

    await expect(
      onfidoClient.initializeCheckForApplicantId(applicantId),
    ).rejects.toThrow('Failed to initialize check for applicant: test error')
  })
})

function validateInvalidPersonaInfoError(e): void {
  expect(e).toBeInstanceOf(BadRequestException)
}
