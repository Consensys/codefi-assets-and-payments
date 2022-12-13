import {
  ApiTags,
  ApiOAuth2,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger'
import {
  Controller,
  Post,
  Body,
  HttpCode,
  UsePipes,
  Param,
  Get,
  Delete,
} from '@nestjs/common'
import { CreateRoleRequest } from '../requests/CreateRoleRequest'
import { RoleService } from '../services/RoleService'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { createRoleSchema } from '../validation/CreateRoleSchema'
import { Permissions } from '../guards/PermissionsDecorator'
import { RoleResponse } from '../responses/RoleResponse'
import { RolePermissionRequest } from '../requests/RolePermissionRequest'
import { RolePermissionResponse } from '../responses/RolePermissionResponse'
import { NestJSPinoLogger } from '@consensys/observability'
import { Protected } from '@consensys/auth'

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('role')
export class RoleController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private roleService: RoleService,
  ) {
    logger.setContext(RoleController.name)
  }

  @Get(`:id`)
  @Permissions('read:role')
  @ApiOAuth2(['read:role'])
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @Protected(true, [])
  async getRoleById(@Param('id') roleId: string): Promise<RoleResponse> {
    this.logger.info(`getRoleById. param.id: %o`, roleId)
    const response = await this.roleService.getRoleById(roleId)
    return response
  }

  @Post()
  @HttpCode(201)
  @UsePipes(new JoiValidationPipe(createRoleSchema))
  @Permissions('write:role')
  @ApiOAuth2(['write:role'])
  @ApiOperation({ summary: 'Create a role' })
  @Protected(true, [])
  async createRole(@Body() request: CreateRoleRequest): Promise<RoleResponse> {
    this.logger.info(`createRole. request: %o`, request)
    const response = await this.roleService.createRole(request)
    return response
  }

  @Post(`:id/permissions`)
  @HttpCode(201)
  @Permissions('write:role')
  @ApiOAuth2(['write:role'])
  @ApiOperation({ summary: 'Assign permission to role' })
  @Protected(true, [])
  async assignPermissionsToRole(
    @Param('id') roleId: string,
    @Body() permissions: RolePermissionRequest[],
  ) {
    this.logger.info(`assignPermissionsToRole. param.id: %o`, roleId)
    await this.roleService.assignPermissionsToRole(roleId, permissions)
  }

  @Delete(`:id/permissions`)
  @HttpCode(201)
  @Permissions('delete:role')
  @ApiOAuth2(['delete:role'])
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiParam({
    name: 'roleId',
    description: 'Role from which to remove permission',
  })
  @Protected(true, [])
  async removePermissionsToRole(
    @Param('id') roleId: string,
    @Body() permissions: RolePermissionRequest[],
  ) {
    this.logger.info(`removePermissionsToRole. param.id: %o`, roleId)
    await this.roleService.removePermissionsToRole(roleId, permissions)
  }

  @Get(':id/permissions')
  @Permissions('read:role')
  @ApiOAuth2(['read:role'])
  @ApiOperation({ summary: 'Get permissions assigned to role' })
  @Protected(true, [])
  async getRolePermissions(
    @Param('id') roleId: string,
  ): Promise<RolePermissionResponse[]> {
    this.logger.info(`getRolePermissions. param.id: %o`, roleId)
    const response = await this.roleService.getPermissionsAssignedToRole(roleId)
    return response
  }
}
