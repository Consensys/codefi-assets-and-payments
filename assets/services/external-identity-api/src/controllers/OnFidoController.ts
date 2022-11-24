import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { ApiTags } from '@nestjs/swagger'
import OnFidoKycWebhookRequest, {
  CheckActionType,
  ReportActionType,
} from './OnFidoKycWebhookRequest'
import KYCResultsService from '../services/KYCResultsService'
import { verifySHA256Signature } from '../validation/utils'
import RequestWithBody from '../utils/RequestWithBody'
import { ConfigType } from '../config'
import ReportResultResponse from '../responses/ReportResultResponse'
import { UserId } from '../data/entities/types'

@ApiTags('OnFido')
@Controller('kyc-provider/onfido')
export class OnFidoController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @Inject('Config')
    private readonly config: ConfigType,
    private kycResultsService: KYCResultsService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async onfidoWebhook(
    @Body() request: OnFidoKycWebhookRequest,
    @Req() req: RequestWithBody,
  ): Promise<void> {
    this.logger.info(
      {
        onfidoRequest: request,
      },
      'Received Onfido request',
    )

    verifySHA256Signature(
      req.rawBody,
      this.config.onfido.webhookToken,
      req.header('X-SHA2-Signature'),
    )

    const payload = request.payload

    switch (payload.action) {
      case ReportActionType.ReportCompleted:
        await this.kycResultsService.onFidoReportCompleted(payload.object)
        break

      case CheckActionType.CheckCompleted:
        await this.kycResultsService.onFidoCheckCompleted(payload.object)
        break

      default:
        this.logger.warn(
          { eventType: payload.action },
          `Unexpected Onfido event type`,
        )
    }
  }

  @Get('reports/:userId')
  @HttpCode(200)
  async getReports(
    @Param('userId') userId: string,
  ): Promise<ReportResultResponse[]> {
    return this.kycResultsService.getReportResults(userId as UserId)
  }
}
