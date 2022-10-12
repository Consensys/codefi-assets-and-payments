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
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Request } from 'express'
import { ApiOAuth2, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  Protected,
  extractTokenFromRequest,
  decodeToken,
  extractTenantIdFromRequestAndHeader,
} from '@codefi-assets-and-payments/auth'
import { EntityService } from '../services/EntityService'
import { DeleteResult, FindManyOptions, In, Raw } from 'typeorm'
import { entityCreateRequestSchema } from '../validation/entityCreateRequestSchema'
import { entityUpdateRequestSchema } from '../validation/entityUpdateRequestSchema'
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler'
import { EntityEntity } from '../data/entities/EntityEntity'
import { LocalErrorName } from '../LocalErrorNameEnum'
import { errorApiResponse } from '../responses/error-api-response'
import {
  EntityPaginatedResponse,
  EntityResponse,
  EntityCreateRequest,
  EntityUpdateRequest,
  EntityQueryRequest,
} from '@codefi-assets-and-payments/ts-types'
import { entityQueryRequestSchema } from '../validation/entityQueryRequestSchema'
import {
  buildMetadataQuery,
  checkEntityMatchesRequest,
} from '../utils/controller'

@ApiTags('Entity')
@Controller('entity')
@UseFilters(new AppToHttpFilter())
export class EntityController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private entityService: EntityService,
  ) {
    logger.setContext(EntityController.name)
  }

  @Get()
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(422, [LocalErrorName.ControllerValidationException]),
  )
  @ApiOAuth2(['read_all:entity'])
  @Protected(true, ['read_all:entity'])
  async findAll(
    @Req() request: Request,
    @Query(new JoiValidationPipe(entityQueryRequestSchema))
    query: EntityQueryRequest,
  ): Promise<EntityPaginatedResponse> {
    const tenantId = extractTenantIdFromRequestAndHeader(request)

    const {
      skip,
      limit,
      ids,
      metadata,
      metadataWithOptions,
      includeWallets,
      ...filteredQuery
    } = query

    const filter: FindManyOptions<EntityEntity> = {
      skip,
      take: limit,
      where: {
        tenantId,
        ...filteredQuery,
        ...(ids ? { id: In(ids) } : {}),
        ...(metadata || metadataWithOptions
          ? {
              metadata: Raw(
                /* istanbul ignore next */
                (alias) =>
                  buildMetadataQuery(alias, metadata, metadataWithOptions),
                {
                  metadata,
                  ...metadataWithOptions,
                },
              ),
            }
          : {}),
      },
      order: {
        createdAt: 'DESC',
      },
    }

    const [items, count] = await this.entityService.getAll(
      filter,
      includeWallets,
    )

    return {
      items,
      count,
      skip,
      limit,
    }
  }

  @Get(':id')
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.EntityNotFoundException]))
  @ApiQuery({
    name: 'id',
    description: 'Unique identifier for the entity',
  })
  @ApiOAuth2(['read:entity'])
  @Protected(true, ['read:entity'])
  async findById(
    @Req() request: Request,
    @Param('id') entityId: string,
    @Query('includeWallets', new DefaultValuePipe(false), ParseBoolPipe)
    includeWallets: boolean,
  ): Promise<EntityResponse> {
    this.logger.info(entityId)

    const { tenantId } = checkEntityMatchesRequest(
      request,
      entityId,
      'read_all:entity',
    )

    return this.entityService.getById(tenantId, entityId, includeWallets)
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
  @ApiOAuth2(['create:entity'])
  @UsePipes(new JoiValidationPipe(entityCreateRequestSchema))
  @Protected(true, ['create:entity'])
  async create(
    @Req() request: Request,
    @Body() body: EntityCreateRequest,
  ): Promise<EntityResponse> {
    const authToken = extractTokenFromRequest(request)
    const decodedToken = decodeToken(authToken)
    const tenantId = extractTenantIdFromRequestAndHeader(request)
    this.logger.info(tenantId, body)
    return this.entityService.create({ ...body, tenantId }, decodedToken.sub)
  }

  @Put(':id')
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.EntityNotFoundException]))
  @ApiResponse(
    errorApiResponse(422, [
      LocalErrorName.ControllerValidationException,
      LocalErrorName.DefaultWalletDoesNotExistException,
    ]),
  )
  @ApiQuery({
    name: 'id',
    description: 'Unique identifier for the entity',
  })
  @ApiOAuth2(['update:entity', 'update_all:entity'])
  @UsePipes(new JoiValidationPipe(entityUpdateRequestSchema))
  @Protected(true, ['update:entity'])
  async update(
    @Req() request: Request,
    @Param('id') entityId: string,
    @Body() body: EntityUpdateRequest,
  ): Promise<EntityResponse> {
    this.logger.info(entityId, body)

    const { tenantId } = checkEntityMatchesRequest(
      request,
      entityId,
      'update_all:entity',
    )

    return this.entityService.update(tenantId, entityId, body)
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.EntityNotFoundException]))
  @ApiQuery({
    name: 'id',
    description: 'Unique identifier for the entity',
  })
  @ApiOAuth2(['delete:entity', 'delete_all:entity'])
  @Protected(true, ['delete:entity'])
  async delete(
    @Req() request: Request,
    @Param('id') entityId: string,
  ): Promise<DeleteResult> {
    this.logger.info(entityId)

    const { tenantId } = checkEntityMatchesRequest(
      request,
      entityId,
      'delete_all:entity',
    )

    return this.entityService.delete(tenantId, entityId)
  }
}
