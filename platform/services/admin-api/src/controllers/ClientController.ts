import {
  Controller,
  Post,
  UsePipes,
  Body,
  HttpCode,
  UseFilters,
  Get,
  Query,
  Delete,
  Param,
  Put,
} from '@nestjs/common'
import { EntityNotFoundException } from '@codefi-assets-and-payments/error-handler'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { createClientSchema } from '../validation/CreateClientSchema'
import { CreateClientRequest } from '../requests/CreateClientRequest'
import { ClientService } from '../services/ClientService'
import { ClientResponse } from '../responses/ClientResponse'
import { Permissions } from '../guards/PermissionsDecorator'
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler'
import {
  ApiTags,
  ApiOAuth2,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger'
import { ClientGetAllResponse } from '../responses/ClientGetAllResponse'
import { UpdateClientRequest } from '../requests/UpdateClientRequest'
import { ErrorName } from '../enums/ErrorName'
import { Protected } from '@codefi/auth'

@ApiTags('Clients')
@ApiBearerAuth('access-token')
@Controller('client')
@UseFilters(new AppToHttpFilter())
export class ClientController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly clientService: ClientService,
  ) {
    logger.setContext(ClientController.name)
  }

  @Post()
  @HttpCode(201)
  @UsePipes(new JoiValidationPipe(createClientSchema))
  @Permissions('write:client')
  @ApiOAuth2(['write:client'])
  @ApiOperation({ summary: 'Create an auth0 application' })
  @Protected(true, [])
  async createClient(
    @Body() request: CreateClientRequest,
  ): Promise<ClientResponse> {
    this.logger.info(
      `createClient. request: %o (tenantId=${request.tenantId})`,
      request,
    )
    return this.clientService.createClient(request, request.isEmailOnly)
  }

  @Get(`:id`)
  @Permissions('read:client')
  @ApiOAuth2(['read:client'])
  @ApiOperation({ summary: 'Retrieve a Client by ID' })
  @ApiQuery({ name: 'id', required: true, description: 'ID of the client' })
  @Protected(true, [])
  async getClient(@Param('id') clientId: string): Promise<ClientResponse> {
    this.logger.info(`get client by client_id: ${clientId}`)
    try {
      const response = await this.clientService.getClient(clientId)
      return response
    } catch (e) {
      this.logger.error('Error get client', e)
      throw new EntityNotFoundException(
        ErrorName.EntityNotFoundException,
        `client ${clientId} not found`,
        { clientId, message: e.message },
      )
    }
  }

  @Get()
  @Permissions('read:client')
  @ApiOAuth2(['read:client'])
  @ApiOperation({ summary: 'Retrieve all Clients' })
  @ApiQuery({ name: 'skip', required: false, description: 'Pagination offset' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Page limit',
  })
  @Protected(true, [])
  async getAllClients(
    @Query('skip') skip: number,
    @Query('limit') limit: number,
    @Query('connection') connection: string,
  ): Promise<ClientGetAllResponse> {
    this.logger.info(`getAll. skip: ${skip} , limit: ${limit}`)
    const result = await this.clientService.getAllClients(
      limit,
      skip,
      connection,
    )
    return {
      count: result.length,
      items: result,
      skip,
      limit,
    }
  }

  @Delete(`:id`)
  @HttpCode(201)
  @Permissions('delete:client')
  @ApiOAuth2(['delete:client'])
  @ApiOperation({ summary: 'Delete an Application Client' })
  @ApiParam({ name: 'id', description: 'The clientId to delete' })
  @Protected(true, [])
  async deleteClientById(@Param('id') clientId: string) {
    this.logger.info(`deleteClientById. clientId: ${clientId}`)
    await this.clientService.deleteClientById(clientId)
  }

  @Put(`:id`)
  @Permissions('write:client')
  @ApiOAuth2(['write:client'])
  @ApiOperation({ summary: 'Update an Application Client' })
  @ApiParam({ name: 'id', description: 'The client to update' })
  @UsePipes(new JoiValidationPipe(createClientSchema))
  @Protected(true, [])
  async updateClient(
    @Body() request: UpdateClientRequest,
    @Param('id') id: string,
  ): Promise<ClientResponse> {
    this.logger.info(`updateClient.clientId: ${id}`)
    const result = await this.clientService.updateClient(request, id)
    return result
  }
}
