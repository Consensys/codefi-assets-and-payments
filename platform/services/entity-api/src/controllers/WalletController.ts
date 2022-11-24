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
  Query,
  ParseBoolPipe,
  UseFilters,
  DefaultValuePipe,
} from '@nestjs/common'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { NestJSPinoLogger } from '@consensys/observability'
import { Request } from 'express'
import { ApiOAuth2, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Protected } from '@consensys/auth'
import { WalletService } from '../services/WalletService'
import { DeleteResult, FindManyOptions, Raw } from 'typeorm'
import { walletCreateRequestSchema } from '../validation/walletCreateRequestSchema'
import { walletUpdateRequestSchema } from '../validation/walletUpdateRequestSchema'
import { EntityService } from '../services/EntityService'
import { AppToHttpFilter } from '@consensys/error-handler'
import { WalletEntity } from '../data/entities/WalletEntity'
import { LocalErrorName } from '../LocalErrorNameEnum'
import { errorApiResponse } from '../responses/error-api-response'
import {
  WalletPaginatedResponse,
  WalletResponse,
  WalletCreateRequest,
  WalletUpdateRequest,
  WalletQueryRequest,
} from '@consensys/ts-types'
import { walletQueryRequestSchema } from '../validation/walletQueryRequestSchema'
import { checkEntityMatchesRequest } from '../utils/controller'

@ApiTags('Wallet')
@Controller('entity/:entityId/wallet')
@UseFilters(new AppToHttpFilter())
export class WalletController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private walletService: WalletService,
    private entityService: EntityService,
  ) {
    logger.setContext(WalletController.name)
  }

  @Get()
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(
    errorApiResponse(422, [LocalErrorName.ControllerValidationException]),
  )
  @ApiQuery({
    name: 'entityId',
    description: 'Unique identifier for the entity',
  })
  @ApiOAuth2(['read:entity', 'read_all:entity'])
  @Protected(true, ['read:entity'])
  async findAll(
    @Req() request: Request,
    @Query(new JoiValidationPipe(walletQueryRequestSchema))
    query: WalletQueryRequest,
    @Param('entityId') entityId: string,
  ): Promise<WalletPaginatedResponse> {
    const { tenantId } = checkEntityMatchesRequest(
      request,
      entityId,
      'read_all:entity',
    )

    const { skip, limit, metadata, ...filteredQuery } = query

    const filter: FindManyOptions<WalletEntity> = {
      skip,
      take: limit,
      where: {
        tenantId,
        entityId,
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

    const [items, count] = await this.walletService.getAll(filter)

    return {
      items,
      count,
      skip: skip,
      limit: limit,
    }
  }

  @Get(':walletAddress')
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.WalletNotFoundException]))
  @ApiQuery({
    name: 'entityId',
    description: 'Unique identifier for the entity',
  })
  @ApiQuery({
    name: 'walletAddress',
    description: 'Ethereum address for the wallet',
  })
  @ApiOAuth2(['read:entity', 'read_all:entity'])
  @Protected(true, ['read:entity'])
  async findById(
    @Req() request: Request,
    @Param('entityId') entityId: string,
    @Param('walletAddress') walletAddress: string,
  ): Promise<WalletResponse> {
    const { tenantId } = checkEntityMatchesRequest(
      request,
      entityId,
      'read_all:entity',
    )

    this.logger.info(
      `Get Wallet ${JSON.stringify({
        entityId,
        tenantId,
        walletAddress,
      })}`,
    )

    return this.walletService.getById(tenantId, entityId, walletAddress)
  }

  @Post()
  @HttpCode(201)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.EntityNotFoundException]))
  @ApiResponse(
    errorApiResponse(422, [
      LocalErrorName.ControllerValidationException,
      LocalErrorName.OrchestrateWalletNotRegisteredException,
      LocalErrorName.NoWalletAddressProvidedException,
    ]),
  )
  @ApiQuery({
    name: 'entityId',
    description: 'Unique identifier for the entity',
  })
  @ApiQuery({
    name: 'setAsDefault',
    description: 'Makes the address the default one for the entity',
    required: false,
  })
  @ApiOAuth2(['update:entity', 'update_all:entity'])
  @UsePipes(new JoiValidationPipe(walletCreateRequestSchema))
  @Protected(true, ['update:entity'])
  async create(
    @Req() request: Request,
    @Query('setAsDefault', new DefaultValuePipe(false), ParseBoolPipe)
    setAsDefault: boolean,
    @Param('entityId') entityId: string,
    @Body() body: WalletCreateRequest,
  ): Promise<WalletResponse> {
    const { tenantId, decodedToken } = checkEntityMatchesRequest(
      request,
      entityId,
      'update_all:entity',
    )

    this.logger.info(
      `Create Wallet ${JSON.stringify({
        entityId,
        tenantId,
        body,
        setAsDefault,
      })}`,
    )

    return this.entityService.createWalletForEntity(
      tenantId,
      { ...body, entityId: entityId, createdBy: decodedToken.sub },
      setAsDefault,
    )
  }

  @Put(':walletAddress')
  @HttpCode(200)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(
    errorApiResponse(422, [LocalErrorName.ControllerValidationException]),
  )
  @ApiQuery({
    name: 'entityId',
    description: 'Unique identifier for the entity',
  })
  @ApiQuery({
    name: 'walletAddress',
    description: 'Ethereum address for the wallet',
  })
  @ApiQuery({
    name: 'setAsDefault',
    description: 'Makes the address the default one for the entity',
    required: false,
  })
  @ApiOAuth2(['update:entity', 'update_all:entity'])
  @UsePipes(new JoiValidationPipe(walletUpdateRequestSchema))
  @Protected(true, ['update:entity'])
  async update(
    @Req() request: Request,
    @Query('setAsDefault', new DefaultValuePipe(false), ParseBoolPipe)
    setAsDefault: boolean,
    @Param('entityId') entityId: string,
    @Param('walletAddress') walletAddress: string,
    @Body() body: WalletUpdateRequest,
  ): Promise<WalletResponse> {
    const { tenantId } = checkEntityMatchesRequest(
      request,
      entityId,
      'update_all:entity',
    )

    this.logger.info(
      `Update Wallet ${JSON.stringify({
        entityId,
        tenantId,
        body,
        setAsDefault,
      })}`,
    )

    return this.entityService.updateWalletForEntity(
      tenantId,
      entityId,
      walletAddress,
      body,
      setAsDefault,
    )
  }

  @Delete(':walletAddress')
  @HttpCode(204)
  @ApiResponse(
    errorApiResponse(403, [LocalErrorName.InsufficientPermissionsException]),
  )
  @ApiResponse(errorApiResponse(404, [LocalErrorName.EntityNotFoundException]))
  @ApiResponse(
    errorApiResponse(422, [LocalErrorName.DefaultWalletDeletedException]),
  )
  @ApiQuery({
    name: 'entityId',
    description: 'Unique identifier for the entity',
  })
  @ApiQuery({
    name: 'walletAddress',
    description: 'Ethereum address for the wallet',
  })
  @ApiOAuth2(['update:entity', 'update_all:entity'])
  @Protected(true, ['update:entity'])
  async delete(
    @Req() request: Request,
    @Param('entityId') entityId: string,
    @Param('walletAddress') walletAddress: string,
  ): Promise<DeleteResult> {
    const { tenantId } = checkEntityMatchesRequest(
      request,
      entityId,
      'update_all:entity',
    )

    this.logger.info(
      `Delete Wallet ${JSON.stringify({
        entityId,
        tenantId,
        walletAddress,
      })}`,
    )

    return this.walletService.delete(tenantId, entityId, walletAddress)
  }
}
