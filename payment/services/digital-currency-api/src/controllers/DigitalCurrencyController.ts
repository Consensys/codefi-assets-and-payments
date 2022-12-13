import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
  UsePipes,
} from '@nestjs/common'
import { ApiOAuth2, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { DigitalCurrencyService } from '../services/DigitalCurrencyService'
import { AppToHttpFilter } from '@consensys/error-handler'
import { UseFilters } from '@nestjs/common'
import {
  CreateDigitalCurrencyRequest,
  DigitalCurrencyResponse,
  MintDigitalCurrencyRequest,
  AsyncActionResponse,
  TransferDigitalCurrencyRequest,
  EntityStatus,
  BurnDigitalCurrencyRequest,
} from '@consensys/ts-types'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import {
  BurnCurrencySchema,
  DeployCurrencySchema,
  MintCurrencySchema,
  TransferCurrencySchema,
} from '../validation/ApiRequestsSchema'
import { BaseExceptionResponse } from '../data/BaseExceptionResponse'
import {
  decodeToken,
  extractEntityIdFromToken,
  extractTenantIdFromToken,
  extractTokenFromRequest,
  Protected,
} from '@consensys/auth'

@Controller('digital-currencies')
@ApiTags('Digital Currencies')
@UseFilters(new AppToHttpFilter())
export class DigitalCurrencyController {
  constructor(private digitalCurrencyService: DigitalCurrencyService) {}

  @Post()
  @HttpCode(202)
  @ApiResponse({
    status: 202,
    description:
      'The request has been accepted for processing, but the processing has not been completed',
    type: DigitalCurrencyResponse,
  })
  @Protected(true, ['deploy:digital-currency'])
  @UsePipes(new JoiValidationPipe(DeployCurrencySchema))
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 403,
    description:
      '<b>errorCode</b> <br /><ul><li><code>UserTenantNotExist</code></li><li><code>UserCantActOnAddress</code></li></ul>',
  })
  @ApiOAuth2(['deploy:digital-currency'])
  async create(
    @Body() request: CreateDigitalCurrencyRequest,
    @Req() req: Request,
  ): Promise<DigitalCurrencyResponse> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const result = await this.digitalCurrencyService.create(
      request.name,
      request.symbol,
      request.decimals || 2,
      tenantId,
      subject,
      EntityStatus.Pending,
      entityId,
      request.ethereumAddress,
    )
    return result
  }

  @Put(':digitalCurrencyId/mint')
  @HttpCode(202)
  @ApiResponse({
    status: 202,
    description:
      'The request has been accepted for processing, but the processing has not been completed',
    type: AsyncActionResponse,
  })
  @ApiQuery({
    name: 'digitalCurrencyId',
    description:
      'Unique system generated identifier for the digital currency item',
  })
  @Protected(true, ['mint:digital-currency'])
  @UsePipes(new JoiValidationPipe(MintCurrencySchema))
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 403,
    description:
      '<b>errorCode</b> <br /><ul><li><code>UserTenantNotExist</code></li><li><code>MintUserIsNotDeployer</code></li><li><code>UserCantActOnAddress</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 503,
    description:
      '<b>errorCode</b> <br /><ul><li><code>CurrencyDoesNotHaveAddress</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 404,
    description:
      '<b>errorCode</b> <br /><ul><li><code>DigitalCurrencyNotFound</code></li></ul>',
  })
  @ApiOAuth2(['mint:digital-currency'])
  async mint(
    @Param(`digitalCurrencyId`) digitalCurrencyId: string,
    @Body() request: MintDigitalCurrencyRequest,
    @Req() req: Request,
  ): Promise<AsyncActionResponse> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const operationId = await this.digitalCurrencyService.mint(
      digitalCurrencyId,
      request.amount,
      request.to,
      tenantId,
      subject,
      entityId,
      request.ethereumAddress,
    )
    return {
      operationId,
    }
  }

  @Put(':digitalCurrencyId/transfer')
  @HttpCode(202)
  @ApiResponse({
    status: 202,
    description:
      'The request has been accepted for processing, but the processing has not been completed',
    type: AsyncActionResponse,
  })
  @ApiQuery({
    name: 'digitalCurrencyId',
    description:
      'Unique system generated identifier for the digital currency item',
  })
  @Protected(true, ['transfer:digital-currency'])
  @UsePipes(new JoiValidationPipe(TransferCurrencySchema))
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 403,
    description:
      '<b>errorCode</b> <br /><ul><li><code>UserTenantNotExist</code></li><li><code>UserCantActOnAddress</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 404,
    description:
      '<b>errorCode</b> <br /><ul><li><code>DigitalCurrencyNotFound</code></li><li><code>HolderNotFound</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 503,
    description:
      '<b>errorCode</b> <br /><ul><li><code>CurrencyDoesNotHaveAddress</code></li></ul>',
  })
  @ApiOAuth2(['transfer:digital-currency'])
  async transfer(
    @Param(`digitalCurrencyId`) digitalCurrencyId: string,
    @Body() body: TransferDigitalCurrencyRequest,
    @Req() req: Request,
  ): Promise<AsyncActionResponse> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const operationId = await this.digitalCurrencyService.transfer(
      digitalCurrencyId,
      body.amount,
      body.to,
      tenantId,
      subject,
      entityId,
      body.ethereumAddress,
    )
    return {
      operationId,
    }
  }

  @Put(':digitalCurrencyId/burn')
  @HttpCode(202)
  @ApiResponse({
    status: 202,
    description:
      'The request has been accepted for processing, but the processing has not been completed',
    type: AsyncActionResponse,
  })
  @ApiQuery({
    name: 'digitalCurrencyId',
    description:
      'Unique system generated identifier for the digital currency item',
  })
  @Protected(true, ['burn:digital-currency'])
  @UsePipes(new JoiValidationPipe(BurnCurrencySchema))
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 403,
    description:
      '<b>errorCode</b> <br /><ul><li><code>UserTenantNotExist</code></li><li><code>UserCantActOnAddress</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 422,
    description:
      '<b>errorCode</b> <br /><ul><li><code>HolderDoesNotHaveEnoughBalance</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 404,
    description:
      '<b>errorCode</b> <br /><ul><li><code>DigitalCurrencyNotFound</code></li><li><code>HolderNotFound</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 503,
    description:
      '<b>errorCode</b> <br /><ul><li><code>CurrencyDoesNotHaveAddress</code></li></ul>',
  })
  @ApiOAuth2(['burn:digital-currency'])
  async burn(
    @Param(`digitalCurrencyId`) digitalCurrencyId: string,
    @Body() request: BurnDigitalCurrencyRequest,
    @Req() req: Request,
  ): Promise<AsyncActionResponse> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const operationId = await this.digitalCurrencyService.burn(
      digitalCurrencyId,
      request.amount,
      tenantId,
      subject,
      entityId,
      request.ethereumAddress,
    )
    return {
      operationId,
    }
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: [DigitalCurrencyResponse],
  })
  @Protected(true, ['read:digital-currency'])
  @ApiOAuth2(['read:digital-currency'])
  async findAll(@Req() req: Request): Promise<DigitalCurrencyResponse[]> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    const result = await this.digitalCurrencyService.findAll(tenantId)
    return result
  }

  @Get(`:digitalCurrencyId`)
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: DigitalCurrencyResponse,
  })
  @ApiQuery({
    name: 'digitalCurrencyId',
    description:
      'Unique system generated identifier for the digital currency item',
  })
  @Protected(true, ['read:digital-currency'])
  @ApiOAuth2(['read:digital-currency'])
  async findById(
    @Param('digitalCurrencyId') digitalCurrencyId: string,
    @Req() req: Request,
  ): Promise<DigitalCurrencyResponse> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    const result = await this.digitalCurrencyService.findOneById(
      digitalCurrencyId,
      tenantId,
    )
    return result
  }
}
