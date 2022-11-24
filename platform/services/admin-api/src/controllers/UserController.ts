import {
  Controller,
  Post,
  HttpCode,
  Body,
  UsePipes,
  Delete,
  Param,
  UseFilters,
  Get,
  Put,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common'
import { Permissions } from '../guards/PermissionsDecorator'
import { InviteUserByEmailRequest } from '../requests/InviteUserByEmailRequest'
import { UserService } from '../services/UserService'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { inviteUserByEmailSchema } from '../validation/inviteUserByEmailSchema'
import { UserCreatedResponse } from '../responses/UserCreatedResponse'
import { AppToHttpFilter, UnauthorizedException } from '@consensys/error-handler'
import {
  ApiTags,
  ApiOAuth2,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger'
import { NestJSPinoLogger } from '@consensys/observability'
import { CreateUserRequest } from '../requests/CreateUserRequest'
import { createUserSchema } from '../validation/CreateUserSchema'
import { UpdateUserRequest } from '../requests/UpdateUserRequest'
import { UserUpdatedResponse } from '../responses/UserUpdatedResponse'
import { updateUserSchema } from '../validation/UpdateUserSchema'
import { PaginatedUserResponse } from '../responses/PaginatedUserResponse'
import {
  decodeTokenFromRequest,
  superTenantId,
  extractTenantIdFromToken,
  extractEntityIdFromToken,
  Protected
} from '@consensys/auth'
import { Request } from 'express'
import { superEntityId } from '@consensys/auth/dist/utils/authUtils'

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('user')
@UseFilters(new AppToHttpFilter())
export class UserController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private userService: UserService,
  ) {
    logger.setContext(UserController.name)
  }

  @Post('invite')
  @HttpCode(201)
  @UsePipes(new JoiValidationPipe(inviteUserByEmailSchema))
  @Permissions('write:invite')
  @ApiOAuth2(['write:invite'])
  @ApiOperation({ summary: 'Invite a user by email' })
  @Protected(true, [])
  async inviteUser(
    @Body() request: InviteUserByEmailRequest,
  ): Promise<UserCreatedResponse> {
    this.logger.info(`inviteUser. request: %o`, request)

    const response = await this.userService.createUser(request, {
      useInviteConnection: true,
    })

    return response
  }

  @Delete(`:id`)
  @Permissions('delete:user')
  @ApiOAuth2(['delete:user'])
  @ApiOperation({ summary: 'Delete a user by id' })
  @ApiParam({ name: 'id', description: 'User Id' })
  @Protected(true, [])
  async deleteUser(@Param('id') userId: string) {
    this.logger.info(`deleteUser. param.id: %o`, userId)
    await this.userService.deleteUserById(userId)
  }

  @Get(`:id`)
  @Permissions('read:user')
  @ApiOAuth2(['read:user'])
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', description: 'User Id' })
  @Protected(true, [])
  async getUserById(@Param('id') userId: string): Promise<UserCreatedResponse> {
    this.logger.info(`getUserById. param.id: %o`, userId)
    const response = await this.userService.getUserById(userId)
    return response
  }

  @Get(`email/:email`)
  @Permissions('read:user')
  @ApiOAuth2(['read:user'])
  @ApiOperation({ summary: 'Get a user by email' })
  @ApiParam({ name: 'email', description: 'User email' })
  @Protected(true, [])
  async getUsersByEmail(
    @Param('email') email: string,
  ): Promise<UserCreatedResponse[]> {
    this.logger.info(`getUsersByEmail. param.email: %o`, email)
    const response = await this.userService.getUsersByEmail(email)
    return response
  }

  @Get(`tenant/:tenantId/entity/:entityId`)
  @Permissions('read:user')
  @ApiOAuth2(['read:user'])
  @ApiOperation({ summary: 'Get all users belonging to an entity' })
  @ApiParam({
    name: 'tenantId',
    description: 'Unique identifier for the tenant',
  })
  @ApiParam({
    name: 'entityId',
    description: 'Unique identifier for the entity',
  })
  @Protected(true, [])
  async getUsersByEntity(
    @Req() request: Request,
    @Param('tenantId') tenantId: string,
    @Param('entityId') entityId: string,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
    @Query('limit', new DefaultValuePipe(100), new ParseIntPipe())
    limit: number,
  ): Promise<PaginatedUserResponse> {
    this.verifyTokenTenantAndEntity(request, tenantId, entityId)

    this.logger.info(
      { tenantId, entityId },
      'Processing request to retrieve users for an entity',
    )

    return await this.userService.getUsersByEntity(
      tenantId,
      entityId,
      limit,
      skip,
    )
  }

  @Post('')
  @HttpCode(201)
  @UsePipes(new JoiValidationPipe(createUserSchema))
  @Permissions('write:user')
  @ApiOAuth2(['write:user'])
  @ApiOperation({ summary: 'Create a user' })
  @Protected(true, [])
  async createUser(
    @Body() request: CreateUserRequest,
  ): Promise<UserCreatedResponse> {
    this.logger.info(`CreateUser. request: %o`, request)
    const response = await this.userService.createUser(request)
    return response
  }

  @Put(`:id`)
  @UsePipes(new JoiValidationPipe(updateUserSchema))
  @Permissions('write:user')
  @ApiOAuth2(['write:user'])
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User Id' })
  @Protected(true, [])
  async updateUser(
    @Body() request: UpdateUserRequest,
    @Param('id') id: string,
  ): Promise<UserUpdatedResponse> {
    this.logger.info(`UpdateUser. request: %o`, request)
    const response = await this.userService.updateUser(request, id)
    return response
  }

  private verifyTokenTenantAndEntity(
    request: Request,
    requiredTenantId: string,
    requiredEntityId: string,
  ) {
    const decodedToken = decodeTokenFromRequest(request)
    const tokenTenantId = extractTenantIdFromToken(decodedToken)
    const tokenEntityId = extractEntityIdFromToken(decodedToken)

    if (tokenTenantId !== superTenantId && tokenTenantId !== requiredTenantId) {
      throw new UnauthorizedException(
        'Invalid Tenant',
        `Tenant in access token (${tokenTenantId}) must match requested tenant (${requiredTenantId})`,
        {
          tokenTenantId,
          requiredTenantId,
        },
      )
    }

    if (tokenEntityId !== superEntityId && tokenEntityId !== requiredEntityId) {
      throw new UnauthorizedException(
        'Invalid Entity',
        `Entity in access token (${tokenEntityId}) must match requested entity (${requiredEntityId})`,
        {
          tokenEntityId,
          requiredEntityId,
        },
      )
    }
  }
}
