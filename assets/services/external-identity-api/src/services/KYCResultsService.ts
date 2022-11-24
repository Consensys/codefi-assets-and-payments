import { UserEntity } from '../data/entities/UserEntity'
import { OnFidoKycObject } from '../controllers/OnFidoKycWebhookRequest'
import { NestJSPinoLogger } from '@consensys/observability'
import OnFidoClient from './onfido/OnFidoClient'
import { KYCResult } from '@consensys/messaging-events'
import KYCEventsProducer from '../events/KYCEventsProducer'
import UserDataAccess from '../repositories/UserDataAccess'
import ReportResult from './onfido/ReportResult'
import ReportResultDataAccess from '../repositories/ReportResultDataAccess'
import { OnfidoCheckId, OnfidoReportId, UserId } from '../data/entities/types'
import { ReportResultEntity } from '../data/entities/ReportResultEntity'
import { NotFoundException } from '@nestjs/common'

export default class KYCResultsService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly onfidoClient: OnFidoClient,
    private readonly userDataAccess: UserDataAccess,
    private readonly reportResultDataAccess: ReportResultDataAccess,
    private readonly kycEventsProducer: KYCEventsProducer,
  ) {}

  async onFidoReportCompleted(object: OnFidoKycObject): Promise<void> {
    const reportResult = await this.onfidoClient.getReportStatus(
      object.id as OnfidoReportId,
    )

    const check = await this.onfidoClient.getCheckStatus(reportResult.checkId)
    const user = await this.userDataAccess.getByApplicantId(check.applicantId)

    await this.saveReportResult(user, object, reportResult)

    if (reportResult.result === KYCResult.Fail) {
      await this.kycEventsProducer.publishFailedOnfidoReport(
        user.userId,
        reportResult,
      )
    }
  }

  async onFidoCheckCompleted(object: OnFidoKycObject): Promise<void> {
    const checkResult = await this.onfidoClient.getCheckStatus(
      object.id as OnfidoCheckId,
    )

    if (checkResult.result === KYCResult.Pass) {
      const user = await this.userDataAccess.getByApplicantId(
        checkResult.applicantId,
      )
      await this.kycEventsProducer.publishPassedOnfidoCheck(
        user.userId,
        checkResult,
      )
    }
  }

  private async saveReportResult(
    user: UserEntity,
    object: OnFidoKycObject,
    reportResult: ReportResult,
  ): Promise<void> {
    await this.reportResultDataAccess.create({
      userId: user.userId,
      reportId: reportResult.reportId,
      checkId: reportResult.checkId,
      name: reportResult.name,
      href: reportResult.href,
      completedAt: new Date(object.completed_at_iso8601),
      result: reportResult.result,
      scope: reportResult.scope,
    })
  }

  public async getReportResults(userId: UserId): Promise<ReportResultEntity[]> {
    const user = await this.userDataAccess.getByUserId(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return this.reportResultDataAccess.getAllReportsForUser(userId)
  }
}
