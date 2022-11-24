import {
  Body,
  Controller,
  HttpCode,
  Get,
  Post,
  Param,
  Query,
} from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { ApiTags } from '@nestjs/swagger'
import { KYCService } from '../services/KYCService'
import UserInformationRequest from '../requests/UserInformationRequest'
import { UserId } from '../data/entities/types'

@ApiTags('Users')
@Controller('kyc-provider/onfido')
export class UserController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly kycService: KYCService,
  ) {}

  @Get('jwt-token/userId=:userId')
  @HttpCode(200)
  async getJwtToken(
    @Param('userId') userId: string,
    @Query('apiToken') apiToken?: string,
  ): Promise<string> {
    return await this.kycService.generateJwtToken(userId as UserId, apiToken)
  }

  @Get('submit-check/:userId')
  @HttpCode(200)
  async submitCheck(
    @Param('userId') userId: string,
    @Query('apiToken') apiToken?: string,
  ): Promise<string> {
    return await this.kycService.submitCheck(userId as UserId, apiToken)
  }

  @Post('create-applicant')
  @HttpCode(200)
  async createApplicant(
    @Body() request: UserInformationRequest,
    @Query('apiToken') apiToken?: string,
  ): Promise<void> {
    await this.kycService.processUserInfoUpdate(
      {
        ...request,
        dateOfBirth: new Date(request.dateOfBirth),
      },
      apiToken,
    )
  }
}
