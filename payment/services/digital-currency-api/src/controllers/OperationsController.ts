import { Controller, Get, Param, Query, Req, UseFilters } from '@nestjs/common'
import {
  ApiOAuth2,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import {
  OperationResponse,
  BalanceHistoryResponse,
  PeriodGranularity,
  OperationResponseGet,
} from '@consensys/ts-types'
import { OperationService } from '../services/OperationService'
import { OperationEntity } from '../data/entities/OperationEntity'
import { Request } from 'express'
import { Counted } from '../services/types'
import {
  decodeToken,
  extractTenantIdFromToken,
  extractTokenFromRequest,
  Protected,
} from '@consensys/auth'
import { AppToHttpFilter } from '@consensys/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'
import { BaseExceptionResponse } from '../data/BaseExceptionResponse'

@Controller(`operations`)
@ApiTags('Operations')
@UseFilters(new AppToHttpFilter())
export class OperationsController {
  constructor(private operationsService: OperationService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: [OperationResponseGet],
  })
  @Protected(true, ['readall:digital-currency-operations'])
  @ApiOAuth2(['readall:digital-currency-operations'])
  @ApiQuery({
    name: 'digitalCurrencyAddress',
    required: false,
    description: 'Filter by Digital Currency Address',
  })
  @ApiQuery({
    name: 'chainName',
    required: false,
    description:
      'Filter by Digital Currency chain name (system generated name for a ethereum network node)',
  })
  @ApiQuery({ name: 'skip', required: false, description: 'Pagination offset' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page limit' })
  async findAll(
    @Req() req: Request,
    @Query('digitalCurrencyAddress') digitalCurrencyAddress?: string,
    @Query('chainName') chainName?: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
  ): Promise<OperationResponseGet> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    let query = {}
    if (digitalCurrencyAddress) {
      query = {
        ...query,
        digitalCurrencyAddress,
      }
    }
    if (chainName) {
      query = {
        ...query,
        chainName,
      }
    }
    query = { ...query, tenantId }
    const result: Counted<OperationEntity> = await this.operationsService.find(
      query,
      skip,
      limit,
    )
    return {
      count: result.count,
      items: result.result,
      skip,
      limit,
    }
  }

  @Get(`:operationId`)
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: OperationResponse,
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 404,
    description: `<b>errorCode</b> <br /><ul><li><code>${LocalErrorName.OperationNotFoundException}</code></li><li><code>${LocalErrorName.OperationNotFoundException}</code></li></ul>`,
  })
  @ApiQuery({
    name: 'operationId',
    description: 'Unique system generated identifier for operation item',
  })
  @Protected(true, ['read:digital-currency-operations'])
  @ApiOAuth2(['read:digital-currency-operations'])
  async findById(
    @Param(`operationId`) operationId: string,
    @Req() req: Request,
  ): Promise<OperationResponse> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    const result = await this.operationsService.findOne({
      id: operationId,
      tenantId: tenantId,
    })
    return result
  }

  @Get('data/metrics')
  @ApiOperation({ deprecated: true, description: 'Use `/balance` instead.' })
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: BalanceHistoryResponse,
  })
  @ApiQuery({
    name: 'holderAddress',
    required: false,
    description: 'Filter by Holder Address',
  })
  @ApiQuery({
    name: 'digitalCurrencyAddress',
    required: false,
    description: 'Filter by Digital Currency Address',
  })
  @ApiQuery({
    name: 'chainName',
    required: false,
    description:
      'Filter by Digital Currency chain name (system generated name for a ethereum network node)',
  })
  @ApiQuery({
    name: 'periodGranularity',
    required: false,
    description: 'Filter by period (DAY, WEEK, MONTH and YEAR)',
    enum: PeriodGranularity,
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Filter by Date From',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'Filter by Date To',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Page index of the results to return. First page is 0',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results per page',
  })
  @Protected(true, ['read:digital-currency-operations'])
  @ApiOAuth2(['read:digital-currency-operations'])
  /**
   * @deprecated Use `/balance` instead.
   */
  async findBalanceHistoryByPeriod(
    @Query('holderAddress') holderAddress?: string,
    @Query('digitalCurrencyAddress') digitalCurrencyAddress?: string,
    @Query('chainName') chainName?: string,
    @Query('periodGranularity') periodGranularity?: PeriodGranularity,
    @Query('dateFrom') dateFrom?: number,
    @Query('dateTo') dateTo?: number,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
  ): Promise<BalanceHistoryResponse> {
    const result = await this.operationsService.findBalanceHistoryByPeriod(
      holderAddress,
      digitalCurrencyAddress,
      chainName,
      periodGranularity,
      new Date(+dateFrom),
      new Date(+dateTo),
      skip,
      limit,
    )
    return {
      count: result.length,
      items: result,
      skip: skip,
      limit: limit,
    }
  }
}
