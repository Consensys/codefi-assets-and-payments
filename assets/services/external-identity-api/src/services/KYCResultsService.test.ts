import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import OnFidoClient from './onfido/OnFidoClient'
import UserDataAccess from '../repositories/UserDataAccess'
import {
  applicantId,
  checkId,
  checkResult,
  onfidoKycObject,
  reportId,
  reportResult,
  reportResultEntity,
  user,
  userId,
} from '../utils/test-data'
import KYCResultsService from './KYCResultsService'
import { KYCResult, KYCScope } from '@consensys/messaging-events/dist'
import KYCEventsProducer from '../events/KYCEventsProducer'
import Mocked = jest.Mocked
import ReportResultDataAccess from '../repositories/ReportResultDataAccess'

describe('KYCResultsService', () => {
  let logger: NestJSPinoLogger
  let onFidoClient: Mocked<OnFidoClient>
  let userRepository: Mocked<UserDataAccess>
  let reportResultDataAccess: Mocked<ReportResultDataAccess>
  let kycEventsProducer: Mocked<KYCEventsProducer>
  let service: KYCResultsService

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    onFidoClient = createMockInstance(OnFidoClient)
    userRepository = createMockInstance(UserDataAccess)
    reportResultDataAccess = createMockInstance(ReportResultDataAccess)
    kycEventsProducer = createMockInstance(KYCEventsProducer)
    service = new KYCResultsService(
      logger,
      onFidoClient,
      userRepository,
      reportResultDataAccess,
      kycEventsProducer,
    )
  })

  it('send an event for a failed report', async () => {
    onFidoClient.getReportStatus.mockResolvedValue(reportResult(KYCResult.Fail))

    onFidoClient.getCheckStatus.mockResolvedValue(checkResult(KYCResult.Fail))

    userRepository.getByApplicantId.mockResolvedValue(user())

    await service.onFidoReportCompleted(onfidoKycObject())

    expect(onFidoClient.getReportStatus).toHaveBeenCalledWith(
      'onfido-object-id',
    )
    expect(onFidoClient.getCheckStatus).toHaveBeenCalledWith(checkId)
    expect(userRepository.getByApplicantId).toHaveBeenCalledWith(applicantId)
    expect(kycEventsProducer.publishFailedOnfidoReport).toHaveBeenCalledWith(
      userId,
      {
        reportId,
        checkId,
        href: 'href',
        result: KYCResult.Fail,
        scope: KYCScope.Id,
        name: 'report-name',
      },
    )
  })

  it('does not send an event for a succeeded report', async () => {
    onFidoClient.getReportStatus.mockResolvedValue(reportResult(KYCResult.Pass))
    onFidoClient.getCheckStatus.mockResolvedValue(checkResult(KYCResult.Pass))
    userRepository.getByApplicantId.mockResolvedValue(user())

    await service.onFidoReportCompleted(onfidoKycObject())

    expect(kycEventsProducer.publishFailedOnfidoReport).not.toHaveBeenCalled()
  })

  it('report succeeded check', async () => {
    onFidoClient.getCheckStatus.mockResolvedValue(checkResult(KYCResult.Pass))

    userRepository.getByApplicantId.mockResolvedValue(user())

    await service.onFidoCheckCompleted(onfidoKycObject())

    expect(onFidoClient.getCheckStatus).toHaveBeenCalledWith('onfido-object-id')
    expect(userRepository.getByApplicantId).toHaveBeenCalledWith(applicantId)
    expect(kycEventsProducer.publishPassedOnfidoCheck).toHaveBeenCalledWith(
      userId,
      {
        applicantId,
        result: KYCResult.Pass,
      },
    )
  })

  it('do not report failed check', async () => {
    onFidoClient.getCheckStatus.mockResolvedValue(checkResult(KYCResult.Fail))

    userRepository.getByApplicantId.mockResolvedValue(user())

    await service.onFidoCheckCompleted(onfidoKycObject())

    expect(kycEventsProducer.publishPassedOnfidoCheck).not.toHaveBeenCalled()
  })

  it('get reports results for user by id', async () => {
    userRepository.getByUserId.mockResolvedValue(user())
    reportResultDataAccess.getAllReportsForUser.mockResolvedValue([
      reportResultEntity(),
    ])
    const reports = await service.getReportResults(userId)

    expect(reports).toEqual([reportResultEntity()])
    expect(reportResultDataAccess.getAllReportsForUser).toHaveBeenCalledWith(
      userId,
    )
  })

  it('get reports results for user by id', async () => {
    userRepository.getByUserId.mockResolvedValue(undefined)
    await expect(service.getReportResults(userId)).rejects.toThrow(
      'User not found',
    )
  })
})
