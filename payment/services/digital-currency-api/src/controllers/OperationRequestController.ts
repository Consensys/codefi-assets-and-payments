import {
  Body,
  Controller,
  Get,
  HttpCode,
  MethodNotAllowedException,
  Param,
  Post,
  Query,
  Req,
  UseFilters,
  UsePipes,
} from '@nestjs/common'
import { ApiOAuth2, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { OperationRequestService } from '../services/OperationRequestService'
import {
  OperationRequestResolveSchema,
  OperationRequestSchema,
} from '../validation/ApiRequestsSchema'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler'
import {
  AsyncActionResponse,
  OperationRequestRequest,
  OperationRequestResolve,
  OperationRequestResponse,
  OperationRequestResponseGet,
} from '@codefi-assets-and-payments/ts-types'
import config from '../config'
import { BaseExceptionResponse } from '../data/BaseExceptionResponse'
import {
  decodeToken,
  extractEntityIdFromToken,
  extractTenantIdFromToken,
  extractTokenFromRequest,
  Protected,
} from '@codefi-assets-and-payments/auth'

@Controller(`operations-request`)
@ApiTags('Operations Request')
@UseFilters(new AppToHttpFilter())
export class OperationsRequestController {
  constructor(
    private readonly operationRequestService: OperationRequestService,
  ) {}

  @Post('request/:tokenId')
  @HttpCode(202)
  @Protected(true, ['write:operations_request'])
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: OperationRequestResponse,
  })
  @ApiQuery({
    name: 'tokenId',
    description: 'Unique system generated identifier for digital currency item',
  })
  @UsePipes(new JoiValidationPipe(OperationRequestSchema))
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 403,
    description:
      '<b>errorCode</b> <br /><ul><li><code>UserTenantNotExist</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 422,
    description:
      '<b>errorCode</b> <br /><ul><li><code>HolderDoesNotHaveEnoughBalance</code></li></ul>',
  })
  @ApiOAuth2(['write:operations_request'])
  async createRequest(
    @Param(`tokenId`) tokenId: string,
    @Body() request: OperationRequestRequest,
    @Req() req: Request,
  ): Promise<OperationRequestResponse> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub

    const opRequestCreated: OperationRequestResponse =
      await this.operationRequestService.createPendingRequest(
        request.type,
        request.requesterAddress,
        request.amount,
        request.issuerAddress,
        tokenId,
        tenantId,
        entityId,
        subject,
      )

    return opRequestCreated
  }

  @Post('resolve/:requestId')
  @HttpCode(202)
  @Protected(true, ['write:operations_resolve'])
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: AsyncActionResponse,
  })
  @ApiQuery({
    name: 'requestId',
    description:
      'Unique system generated identifier for operation request item',
  })
  @UsePipes(new JoiValidationPipe(OperationRequestResolveSchema))
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 400,
    description:
      '<b>errorCode</b> <br /><ul><li><code>FundsMismatch</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 403,
    description:
      '<b>errorCode</b> <br /><ul><li><code>UserTenantNotExist</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 422,
    description:
      '<b>errorCode</b> <br /><ul><li><code>HolderDoesNotHaveEnoughBalance</code></li><li><code>OperationRequestAlreadyResolved</code></li></ul>',
  })
  @ApiResponse({
    type: BaseExceptionResponse,
    status: 404,
    description:
      '<b>errorCode</b> <br /><ul><li><code>DigitalCurrencyNotFound</code></li><li><code>OperationRequestNotFound</code></li><li><code>LegalEntityNotFound</code></li><li><code>LegalEntityNotFound</code></li><li><code>OperationNotFound</code></li></ul>',
  })
  @ApiOAuth2(['write:operations_resolve'])
  async resolveRequest(
    @Param(`requestId`) requestId: string,
    @Body() requestResolve: OperationRequestResolve,
    @Req() req: Request,
  ): Promise<AsyncActionResponse> {
    const decodedToken = decodeToken(extractTokenFromRequest(req))
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)

    const subject: string = decodedToken.sub

    const operationId = await this.operationRequestService.resolveRequestState(
      requestId,
      requestResolve.state,
      tenantId,
      entityId,
      subject,
    )
    return {
      operationId,
    }
  }

  @Get()
  @HttpCode(202)
  @ApiResponse({
    status: 200,
    description: 'Standard response for successful HTTP requests',
    type: [OperationRequestResponse],
  })
  @ApiQuery({ name: 'skip', required: false, description: 'Pagination offset' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page limit' })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Operation Request State',
  })
  @ApiQuery({
    name: 'digitalCurrencyAddress',
    required: false,
    description: 'Digital currency ethereum address',
  })
  @ApiQuery({
    name: 'requester',
    required: false,
    description: 'Operation request requested by ethereum address',
  })
  @Protected(true, ['read:digital-currency'])
  @ApiOAuth2(['read:digital-currency'])
  async getAll(
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
    @Query('state') state?: string,
    @Query('digitalCurrencyAddress') digitalCurrencyAddress?: string,
    @Query('requester') requester?: string,
  ): Promise<OperationRequestResponseGet> {
    const result = await this.operationRequestService.getAll(
      skip,
      limit,
      state,
      digitalCurrencyAddress,
      requester,
    )
    return {
      count: result.count,
      items: result.result,
      limit,
      skip,
    }
  }
}
