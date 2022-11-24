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
import { entityClientQueryRequestSchema } from '../validation/entityClientQueryRequestSchema'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { entityClientCreateRequestSchema } from '../validation/entityClientCreateRequestSchema'
import { checkEntityMatchesRequest } from '../utils/controller'

@ApiTags('EntityClient')
@Controller('entity/:entityId/client')
@UseFilters(new AppToHttpFilter())
export class EntityClientController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private clientService: ClientService,
  ) {
    logger.setContext(EntityClientController.name)
  }

  @Get()
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.EntityNotFoundException]))
  @ApiResponse(
    errorApiResponse(422, [LocalErrorName.ControllerValidationException]),
  )
  @ApiOAuth2(['read:entity'])
  @Protected(true, ['read:entity'])
  async findAll(
    @Req() request: Request,
    @Param('entityId') entityId: string,
    @Query(new JoiValidationPipe(entityClientQueryRequestSchema))
    query: EntityClientQueryRequest,
  ): Promise<EntityClientPaginatedResponse> {
    const { tenantId } = checkEntityMatchesRequest(
      request,
      entityId,
      'read_all:entity',
    )

    const { skip, limit, ...filteredQuery } = query

    const filter: FindManyOptions<ClientEntity> = {
      skip,
      take: limit,
      where: { entityId, tenantId, ...filteredQuery },
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
  @ApiResponse(errorApiResponse(404, [LocalErrorName.EntityNotFoundException]))
  @ApiResponse(
    errorApiResponse(422, [LocalErrorName.ControllerValidationException]),
  )
  @ApiQuery({
    name: 'entityId',
    description: 'Id of the entity to create a client for',
  })
  @ApiOAuth2(['update:entity'])
  @Protected(true, ['update:entity'])
  async create(
    @Req() request: Request,
    @Param('entityId') entityId: string,
    @Body(new JoiValidationPipe(entityClientCreateRequestSchema))
    body: EntityClientCreateRequest,
  ) {
    const { tenantId } = checkEntityMatchesRequest(
      request,
      entityId,
      'update_all:entity',
    )

    this.logger.info(
      `Create entity client: ${JSON.stringify({
        entityId,
      })}`,
    )

    await this.clientService.create(tenantId, entityId, body)
  }
}
