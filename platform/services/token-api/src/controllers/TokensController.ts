import {
  Body,
  Controller,
  HttpCode,
  Param,
  Query,
  Get,
  Post,
  Put,
  Req,
  UsePipes,
  UseFilters,
} from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  Protected,
  decodeTokenFromRequest,
  extractTenantIdFromToken,
  extractTokenFromRequest,
  extractEntityIdFromToken,
} from '@consensys/auth'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import {
  TokenQueryRequestSchema,
  TokensDeploySchema,
  TokensMintSchema,
  TokensTransferSchema,
  TokensBurnSchema,
  TokensExecSchema,
  TokensRegisterSchema,
  TokensSetTokenURISchema,
} from '../validation/ApiRequestsSchema'
import { Request } from 'express'
import { TokensManagerService } from '../services/TokensManagerService'
import { TokensService } from '../services/TokensService'
import { TokenEntity } from '../data/entities/TokenEntity'
import {
  TokenType,
  TokensBurnRequest,
  TokensMintRequest,
  TokensTransferRequest,
  TokensExecRequest,
  TokensDeployRequest,
  TokensRegisterRequest,
  TokenQueryRequest,
  SetTokenURIRequest,
  TokenPaginatedResponse,
  NewTokenResponse,
  TokenOperationResponse,
} from '@consensys/ts-types'
import { AppToHttpFilter } from '@consensys/error-handler'
import { FindManyOptions } from 'typeorm'

@ApiTags('Tokens')
@Controller('tokens')
@UseFilters(new AppToHttpFilter())
export class TokensController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly tokensManagerService: TokensManagerService,
    private readonly tokensService: TokensService,
  ) {
    logger.setContext(TokensController.name)
  }

  @Get('')
  @HttpCode(200)
  @Protected(true, ['read:token'])
  @ApiOAuth2(['read:token'])
  @UsePipes(new JoiValidationPipe(TokenQueryRequestSchema))
  @ApiOperation({ summary: 'Retrieve tokens' })
  async findAll(
    @Query() query: TokenQueryRequest,
  ): Promise<TokenPaginatedResponse> {
    this.logger.info({ query }, 'Processing request to retrieve tokens')

    const { skip, limit, ...whereFilter } = query

    const filter: FindManyOptions<TokenEntity> = {
      skip,
      take: limit,
      where: whereFilter,
      order: {
        createdAt: 'DESC',
      },
    }

    const [items, count] = await this.tokensService.getAll(filter)

    return {
      items,
      count,
      skip: query.skip,
      limit: query.limit,
    }
  }

  @Post()
  @HttpCode(202)
  @Protected(true, ['deploy:token'])
  @ApiOAuth2(['deploy:token'])
  @UsePipes(new JoiValidationPipe(TokensDeploySchema))
  @ApiOperation({ summary: 'Create a new token' })
  async deploy(
    @Body() body: TokensDeployRequest,
    @Req() req: Request,
  ): Promise<NewTokenResponse> {
    const decodedToken = decodeTokenFromRequest(req) as any
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const authToken: string = extractTokenFromRequest(req)
    this.logger.info({ body }, 'Processing request to deploy token')
    return await this.tokensManagerService.deploy(
      {
        ...body,
        idempotencyKey: body.idempotencyKey,
      },
      tenantId,
      entityId,
      subject,
      authToken,
      undefined, // headers (not passed, as for now, we don't want a user to be allowed to act on tokens from other tenants)
    )
  }

  @Post('register')
  @HttpCode(202)
  @Protected(true, ['deploy:token'])
  @ApiOAuth2(['deploy:token'])
  @UsePipes(new JoiValidationPipe(TokensRegisterSchema))
  @ApiOperation({ summary: 'Register a new token' })
  async register(
    @Body() body: TokensRegisterRequest,
    @Req() req: Request,
  ): Promise<NewTokenResponse> {
    const decodedToken = decodeTokenFromRequest(req) as any
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const authToken: string = extractTokenFromRequest(req)
    this.logger.info({ body }, 'Processing request to register token')

    return await this.tokensManagerService.register(
      body,
      tenantId,
      entityId,
      subject,
      authToken,
      undefined,
    )
  }

  @Put(':tokenEntityId/mint')
  @HttpCode(202)
  @Protected(true, ['mint:token'])
  @ApiOAuth2(['mint:token'])
  @UsePipes(new JoiValidationPipe(TokensMintSchema))
  @ApiOperation({ summary: 'Minting a token' })
  async mint(
    @Body() body: TokensMintRequest,
    @Req() req: Request,
    @Param('tokenEntityId') tokenEntityId: string,
  ): Promise<TokenOperationResponse> {
    const decodedToken = decodeTokenFromRequest(req) as any
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const toAccount =
      body.type === TokenType.ERC721 ? body.to : body.config.from
    const value = body.type === TokenType.ERC721 ? body.tokenId : body.amount
    const authToken: string = extractTokenFromRequest(req)
    this.logger.info({ body }, 'Processing request to mint token')
    return await this.tokensManagerService.mint(
      body.type,
      toAccount,
      value,
      tenantId,
      subject,
      body.config,
      body.operationId,
      tokenEntityId,
      body.idempotencyKey,
      authToken,
      undefined, // headers (not passed, as for now, we don't want a user to be allowed to act on tokens from other tenants)
      entityId,
    )
  }

  @Put(':tokenEntityId/burn')
  @HttpCode(202)
  @Protected(true, ['burn:token'])
  @ApiOAuth2(['burn:token'])
  @UsePipes(new JoiValidationPipe(TokensBurnSchema))
  @ApiOperation({ summary: 'Burning a token' })
  async burn(
    @Body() body: TokensBurnRequest,
    @Req() req: Request,
    @Param('tokenEntityId') tokenEntityId: string,
  ): Promise<TokenOperationResponse> {
    const decodedToken = decodeTokenFromRequest(req) as any
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const authToken: string = extractTokenFromRequest(req)

    this.logger.info({ body }, 'Processing request to burn token')

    return await this.tokensManagerService.burn(
      body.amount || body.tokenId,
      body.config,
      tenantId,
      subject,
      body.operationId,
      tokenEntityId,
      body.idempotencyKey,
      authToken,
      undefined, // headers (not passed, as for now, we don't want a user to be allowed to act on tokens from other tenants)
      entityId,
    )
  }

  @Put(`:tokenEntityId/transfer`)
  @HttpCode(202)
  @Protected(true, ['transfer:token'])
  @ApiOAuth2(['transfer:token'])
  @UsePipes(new JoiValidationPipe(TokensTransferSchema))
  @ApiOperation({ summary: 'Transfer tokens' })
  async transfer(
    @Body() body: TokensTransferRequest,
    @Req() req: Request,
    @Param('tokenEntityId') tokenEntityId: string,
  ): Promise<TokenOperationResponse> {
    const decodedToken = decodeTokenFromRequest(req) as any
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const toAccount = body.type === TokenType.ERC721 ? body.to : body.account
    const value = body.type === TokenType.ERC721 ? body.tokenId : body.amount
    const authToken: string = extractTokenFromRequest(req)

    this.logger.info({ body }, 'Processing request to transfer token')

    return await this.tokensManagerService.transfer(
      body.type,
      value,
      toAccount,
      tenantId,
      subject,
      body.config,
      body.operationId,
      tokenEntityId,
      body.idempotencyKey,
      authToken,
      undefined, // headers (not passed, as for now, we don't want a user to be allowed to act on tokens from other tenants)
      entityId,
    )
  }

  @Put(`:tokenEntityId/exec`)
  @HttpCode(202)
  @Protected(true, ['exec:token'])
  @ApiOAuth2(['exec:token'])
  @UsePipes(new JoiValidationPipe(TokensExecSchema))
  @ApiOperation({ summary: 'Execute generic token function' })
  async exec(
    @Body() body: TokensExecRequest,
    @Req() req: Request,
    @Param('tokenEntityId') tokenEntityId: string,
  ): Promise<TokenOperationResponse> {
    const decodedToken = decodeTokenFromRequest(req)
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const authToken: string = extractTokenFromRequest(req)

    this.logger.info({ body }, 'Processing request to execute token function')

    return await this.tokensManagerService.exec(
      body.functionName,
      body.params,
      body.config,
      tenantId,
      subject,
      tokenEntityId,
      body.operationId,
      body.idempotencyKey,
      authToken,
      undefined, // headers (not passed, as for now, we don't want a user to be allowed to act on tokens from other tenants)
      entityId,
    )
  }

  @Put(`:tokenEntityId/setTokenURI`)
  @HttpCode(202)
  @Protected(true, ['set_uri:token'])
  @ApiOAuth2(['set_uri:token'])
  @UsePipes(new JoiValidationPipe(TokensSetTokenURISchema))
  @ApiOperation({ summary: 'Set token URI' })
  async setTokenURI(
    @Body() body: SetTokenURIRequest,
    @Req() req: Request,
    @Param('tokenEntityId') tokenEntityId: string,
  ): Promise<TokenOperationResponse> {
    const decodedToken = decodeTokenFromRequest(req) as any
    const tenantId = extractTenantIdFromToken(decodedToken)
    const entityId = extractEntityIdFromToken(decodedToken)
    const subject: string = decodedToken.sub
    const authToken: string = extractTokenFromRequest(req)

    this.logger.info({ body }, 'Processing request to set token URI')

    return await this.tokensManagerService.setTokenURI(
      body.tokenId,
      body.uri,
      body.config,
      tenantId,
      subject,
      tokenEntityId,
      body.operationId,
      body.idempotencyKey,
      authToken,
      undefined, // headers (not passed, as for now, we don't want a user to be allowed to act on tokens from other tenants)
      entityId,
    )
  }
}
