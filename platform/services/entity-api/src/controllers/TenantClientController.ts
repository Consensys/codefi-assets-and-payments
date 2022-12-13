import {
  Controller,
  HttpCode,
  Param,
  Post,
  UseFilters,
  Req,
  Get,
  Query,
  Body,
} from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { ApiOAuth2, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Protected } from '@consensys/auth'
import { AppToHttpFilter } from '@consensys/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'
import { errorApiResponse } from '../responses/error-api-response'
import {
  EntityClientCreateRequest,
  EntityClientPaginatedResponse,
  EntityClientQueryRequest,
} from '@consensys/ts-types'
import { Request } from 'express'
import { ClientEntity } from '../data/entities/ClientEntity'
import { FindManyOptions } from 'typeorm'
import { ClientService } from '../services/ClientService'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { entityClientQueryRequestSchema } from '../validation/entityClientQueryRequestSchema'
import { entityClientCreateRequestSchema } from '../validation/entityClientCreateRequestSchema'
import { checkTenantMatchesRequest } from '../utils/controller'

@ApiTags('TenantClient')
@Controller('tenant/:tenantId/client')
@UseFilters(new AppToHttpFilter())
export class TenantClientController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private clientService: ClientService,
  ) {
    logger.setContext(TenantClientController.name)
  }

  @Get()
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.TenantNotFoundException]))
  @ApiResponse(
    errorApiResponse(422, [LocalErrorName.ControllerValidationException]),
  )
  @ApiOAuth2(['read:tenant'])
  @Protected(true, ['read:tenant'])
  async findAll(
    @Req() request: Request,
    @Param('tenantId') tenantId: string,
    @Query(new JoiValidationPipe(entityClientQueryRequestSchema))
    query: EntityClientQueryRequest,
  ): Promise<EntityClientPaginatedResponse> {
    checkTenantMatchesRequest(request, tenantId, 'read_all:tenant')

    const { skip, limit, ...filteredQuery } = query

    const filter: FindManyOptions<ClientEntity> = {
      skip,
      take: limit,
      where: { tenantId, ...filteredQuery },
      order: {
        createdAt: 'DESC',
      },
    }

    const [items, count] = await this.clientService.getAll(filter)

    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      items: items.map(({ id, tenantId, entityId, ...item }) => item),
      count,
      skip,
      limit,
    }
  }

  @Post()
  @HttpCode(201)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.TenantNotFoundException]))
  @ApiResponse(
    errorApiResponse(422, [LocalErrorName.ControllerValidationException]),
  )
  @ApiQuery({
    name: 'tenantId',
    description: 'Id of the tenant to create a client for',
  })
  @ApiOAuth2(['update:tenant'])
  @Protected(true, ['update:tenant'])
  async create(
    @Req() request: Request,
    @Param('tenantId') tenantId: string,
    @Body(new JoiValidationPipe(entityClientCreateRequestSchema))
    body: EntityClientCreateRequest,
  ) {
    checkTenantMatchesRequest(request, tenantId, 'update_all:tenant')

    this.logger.info(
      `Create tenant client: ${JSON.stringify({
        tenantId,
      })}`,
    )

    await this.clientService.create(tenantId, undefined, body)
  }
}
