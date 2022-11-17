import {
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
  Get,
  Param,
} from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { ResourceServerApiService } from '../services/ResourceServerApiService'
import { CreateApiRequest, Scope } from '../requests/ResourceServerApiRequest'
import { CreateApiResponse } from '../responses/ResourceServerApiResponse'
import { createApiSchema } from '../validation/CreateResourceApiSchema'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { Permissions } from '../guards/PermissionsDecorator'
import {
  ApiTags,
  ApiOAuth2,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger'
import { Protected } from '@codefi/auth'

@ApiTags('APIs')
@ApiBearerAuth('access-token')
@Controller('api')
export class ResourceServerApiController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly resourceServerApiService: ResourceServerApiService,
  ) {
    logger.setContext(ResourceServerApiController.name)
  }

  @Post()
  @HttpCode(201)
  @UsePipes(new JoiValidationPipe(createApiSchema))
  @Permissions('write:api')
  @ApiOAuth2(['write:api'])
  @ApiOperation({ summary: 'Create an API' })
  @Protected(true, [])
  async createApi(
    @Body() request: CreateApiRequest,
  ): Promise<CreateApiResponse> {
    this.logger.info(`createApi. request: %o`, request)
    return await this.resourceServerApiService.createApi(
      request.name,
      request.identifier,
      request.scopes,
      request.token_lifetime,
      request.rbac,
    )
  }

  @Get(`:id/scopes`)
  @Permissions('read:api')
  @ApiOperation({ summary: 'Retrieve permissions (scopes) for this API' })
  @ApiParam({ name: 'id', description: 'The API/Resource Server id' })
  @Protected(true, [])
  async getApiScopes(@Param('id') resourceServerId: string): Promise<Scope[]> {
    return this.resourceServerApiService.getResourceServerScopes(
      resourceServerId,
    )
  }

  @Get(`/scopes`)
  @Permissions('read:api')
  @ApiOperation({ summary: 'Get the default API scopes' })
  @Protected(true, [])
  async getDefaultApiScopes(): Promise<Scope[]> {
    return this.resourceServerApiService.getResourceServerScopes()
  }
}
