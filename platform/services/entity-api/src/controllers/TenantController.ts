import { decodeTokenFromRequest, Protected } from '@consensys/auth'
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Delete,
  UsePipes,
  Req,
  UseFilters,
  Query,
} from '@nestjs/common'
import { ApiOAuth2, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { NestJSPinoLogger } from '@consensys/observability'
import { DeleteResult, FindManyOptions, Raw } from 'typeorm'
import { TenantService } from '../services/TenantService'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { tenantCreateRequestSchema } from '../validation/tenantCreateRequestSchema'
import { AppToHttpFilter } from '@consensys/error-handler'
import { tenantUpdateRequestSchema } from '../validation/tenantUpdateRequestSchema'
import { TenantEntity } from '../data/entities/TenantEntity'
import { LocalErrorName } from '../LocalErrorNameEnum'
import { errorApiResponse } from '../responses/error-api-response'
import {
  TenantPaginatedResponse,
  TenantResponse,
  TenantCreateRequest,
  TenantUpdateRequest,
  TenantQueryRequest,
} from '@consensys/ts-types'
import { tenantQueryRequestSchema } from '../validation/tenantQueryRequestSchema'
import { checkTenantMatchesRequest } from '../utils/controller'

@ApiTags('Tenant')
@Controller('tenant')
@UseFilters(new AppToHttpFilter())
export class TenantController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private tenantService: TenantService,
  ) {
    logger.setContext(TenantController.name)
  }

  @Get()
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(422, [LocalErrorName.ControllerValidationException]),
  )
  @ApiOAuth2(['read_all:tenant'])
  @Protected(true, ['read_all:tenant'])
  async findAll(
    @Query(new JoiValidationPipe(tenantQueryRequestSchema))
    query: TenantQueryRequest,
  ): Promise<TenantPaginatedResponse> {
    const { skip, limit, metadata, ...filteredQuery } = query

    const filter: FindManyOptions<TenantEntity> = {
      skip,
      take: limit,
      where: {
        ...filteredQuery,
        ...(metadata
          ? {
              metadata: Raw((alias) => `${alias} @> :metadata`, {
                metadata,
              }),
            }
          : {}),
      },
      order: {
        createdAt: 'DESC',
      },
    }

    const [items, count] = await this.tenantService.getAll(filter)

    return {
      items,
      count,
      skip: skip,
      limit: limit,
    }
  }

  @Get(':id')
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.TenantNotFoundException]))
  @ApiQuery({
    name: 'id',
    description: 'Unique identifier for the tenant',
  })
  @ApiOAuth2(['read:tenant', 'read_all:tenant'])
  @Protected(true, ['read:tenant'])
  async findById(
    @Req() request: Request,
    @Param('id') tenantId: string,
  ): Promise<TenantResponse> {
    this.logger.info(tenantId)
    checkTenantMatchesRequest(request, tenantId, 'read_all:tenant')
    return this.tenantService.getById(tenantId)
  }

  @Post()
  @HttpCode(201)
  @ApiResponse(
    errorApiResponse(422, [
      LocalErrorName.ControllerValidationException,
      LocalErrorName.DefaultWalletDoesNotExistException,
      LocalErrorName.OrchestrateWalletNotRegisteredException,
      LocalErrorName.NoWalletAddressProvidedException,
    ]),
  )
  @ApiOAuth2(['create:tenant'])
  @UsePipes(new JoiValidationPipe(tenantCreateRequestSchema))
  @Protected(true, ['create:tenant'])
  async create(
    @Req() request: Request,
    @Body() body: TenantCreateRequest,
  ): Promise<TenantResponse> {
    this.logger.info(body)
    const decodedToken = decodeTokenFromRequest(request)
    return this.tenantService.create(body, decodedToken.sub)
  }

  @Put(':id')
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.TenantNotFoundException]))
  @ApiResponse(
    errorApiResponse(422, [LocalErrorName.ControllerValidationException]),
  )
  @ApiQuery({
    name: 'id',
    description: 'Unique identifier for the tenant',
  })
  @ApiOAuth2(['update:tenant', 'update_all:tenant'])
  @UsePipes(new JoiValidationPipe(tenantUpdateRequestSchema))
  @Protected(true, ['update:tenant'])
  async update(
    @Req() request: Request,
    @Param('id') tenantId: string,
    @Body() body: TenantUpdateRequest,
  ): Promise<TenantResponse> {
    this.logger.info(tenantId, body)
    checkTenantMatchesRequest(request, tenantId, 'update_all:tenant')
    return this.tenantService.update(tenantId, body)
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.TenantNotFoundException]))
  @ApiQuery({
    name: 'id',
    description: 'Unique identifier for the tenant',
  })
  @ApiOAuth2(['delete:tenant', 'delete_all:tenant'])
  @Protected(true, ['delete:tenant'])
  async delete(
    @Req() request: Request,
    @Param('id') tenantId: string,
  ): Promise<DeleteResult> {
    this.logger.info(tenantId)
    checkTenantMatchesRequest(request, tenantId, 'delete_all:tenant')
    return this.tenantService.delete(tenantId)
  }
}
