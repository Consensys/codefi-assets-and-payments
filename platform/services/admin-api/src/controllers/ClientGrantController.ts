import {
  Controller,
  Post,
  UsePipes,
  Body,
  HttpCode,
  Delete,
  Param,
  Get,
  Query,
} from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { clientGrantSchema } from '../validation/ClientGrantSchema'
import { ClientGrantResponse } from '../responses/ClientGrantResponse'
import { ClientGrantRequest } from '../requests/ClientGrantRequest'
import { ClientGrantService } from '../services/ClientGrantService'
import { Permissions } from '../guards/PermissionsDecorator'
import { GetClientGrantResponse } from '../responses/GetClientGrantResponse'
import {
  ApiQuery,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger'
import { ApiTags, ApiOAuth2 } from '@nestjs/swagger'
import { Protected } from '@codefi-assets-and-payments/auth'

@ApiTags('Grants')
@ApiBearerAuth('access-token')
@Controller('client-grant')
export class ClientGrantController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly clientGrantService: ClientGrantService,
  ) {
    logger.setContext(ClientGrantController.name)
  }

  @Post()
  @HttpCode(201)
  @UsePipes(new JoiValidationPipe(clientGrantSchema))
  @Permissions('write:grant')
  @ApiOAuth2(['write:grant'])
  @ApiOperation({ summary: 'Create a client grant' })
  @Protected(true, [])
  async clientGrant(
    @Body() request: ClientGrantRequest,
  ): Promise<ClientGrantResponse> {
    this.logger.info(`clientGrant. request: %o`, request)
    const response = await this.clientGrantService.clientGrant(
      request.client_id,
      request.audience,
      request.scope,
    )
    return response
  }

  @Get()
  @Permissions('read:grant')
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'audience', required: false })
  @ApiOperation({ summary: 'Get a client grant' })
  @ApiQuery({ name: 'clientId', description: 'OAuth client ID' })
  @ApiQuery({ name: 'audience', description: 'Oauth audience' })
  @Protected(true, [])
  async getClientGrants(
    @Query('clientId') clientId?: string,
    @Query('audience') audience?: string,
  ): Promise<GetClientGrantResponse> {
    this.logger.info(`get client grants for client_id]${clientId}`)
    const response = await this.clientGrantService.getClientGrant(
      clientId,
      audience,
    )
    return response
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissions('delete:grant')
  @ApiOAuth2(['delete:grant'])
  @ApiOperation({ summary: 'Delete a client grant' })
  @ApiParam({ name: 'id', description: 'Client grant to delete' })
  @Protected(true, [])
  async deleteClientGrantById(@Param('id') clientGrantId: string) {
    this.logger.info(`deleteClientGrant. param.id: %o`, clientGrantId)
    const response = await this.clientGrantService.deleteClientGrantById(
      clientGrantId,
    )
    return response
  }
}
