import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { ValidationErrors } from '../services/onfido/InvalidPersonalInfoError'
import {
  IExternalKYCResult,
  KYCScope,
} from '@codefi-assets-and-payments/messaging-events'
import { Events } from '@codefi-assets-and-payments/messaging-events'
import ReportResult from '../services/onfido/ReportResult'
import CheckResult from '../services/onfido/CheckResult'
import { UserId } from '../data/entities/types'

@Injectable()
export default class KYCEventsProducer {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  async publishFailedPersonalInfoSubmission(
    userId: UserId,
    validationErrors: ValidationErrors,
  ): Promise<void> {
    this.logger.info(
      {
        userId,
        errors: validationErrors,
      },
      'Sending invalid personal info event',
    )
    await this.sendAndLog({
      userId,
      message: 'Personal information is invalid',
      result: 'FAIL' as any,
      scope: 'IDENTITY' as any,
      reportName: null,
      errors: validationErrors,
    })
  }

  async publishFailedOnfidoReport(
    userId: UserId,
    reportResult: ReportResult,
  ): Promise<void> {
    this.logger.info(
      {
        userId,
        reportResult,
      },
      'Sending failed Onfido report result',
    )
    await this.sendAndLog({
      userId,
      message: 'Onfido report failed',
      result: reportResult.result,
      scope: reportResult.scope,
      reportName: reportResult.name,
      errors: {},
    })
  }

  async publishPassedOnfidoCheck(
    userId: UserId,
    checkResult: CheckResult,
  ): Promise<void> {
    this.logger.info(
      {
        userId,
        checkResult,
      },
      'Sending passed Onfido check result',
    )
    await this.sendAndLog({
      userId,
      message: 'Onfido check passed',
      result: checkResult.result,
      scope: KYCScope.All,
      errors: {},
    })
  }

  private async sendAndLog(kycResult: IExternalKYCResult): Promise<void> {
    const result = await this.kafkaProducer.send<IExternalKYCResult>(
      Events.externalKYCResultEvent,
      kycResult,
    )

    this.logger.info(
      {
        result,
      },
      'Published external KYC result event',
    )
  }
}
