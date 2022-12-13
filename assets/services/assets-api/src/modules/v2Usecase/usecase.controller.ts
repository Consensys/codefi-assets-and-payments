import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  HttpCode,
  UseFilters,
  Param,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppToHttpFilter } from '@consensys/error-handler';

import ErrorService from 'src/utils/errorService';
import { keys as UserContextKeys, IUserContext } from 'src/types/userContext';
import { UsecaseService } from './usecase.service';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { checkUserType } from 'src/utils/checks/userType';
import { UserType } from 'src/types/user';
import { DEFAULT_TENANT_ID } from 'src/types/clientApplication';

@ApiTags('Usecases')
@Controller('v2/usecases')
@UseFilters(new AppToHttpFilter())
export class UserController {
  constructor(private readonly usecaseService: UsecaseService) {}

  @Get('/:usecase')
  @HttpCode(200)
  @ApiOperation({ summary: 'Fetch usecase' })
  async fetchUsecase(
    @UserContext() userContext: IUserContext,
    @Param('usecase') usecase: string,
  ) {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);
      return this.usecaseService.getUsecase(DEFAULT_TENANT_ID, usecase);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'fetch usecase',
        'fetchUsecase',
        true,
        500,
      );
    }
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'List all usecases' })
  async listAllUsecases(@UserContext() userContext: IUserContext) {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);
      return this.usecaseService.listAllUsecases(DEFAULT_TENANT_ID);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing usecases',
        'listAllUsecases',
        true,
        500,
      );
    }
  }

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Create a usecase' })
  async createUsecase(@UserContext() userContext: IUserContext, @Body() body) {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);
      return this.usecaseService.createUsecase(
        DEFAULT_TENANT_ID,
        body.useCaseName,
        body.defaultConfiguration,
        body.useCaseKeys,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating a usecase',
        'createUsecase',
        true,
        500,
      );
    }
  }

  @Put('/:usecase')
  @HttpCode(200)
  @ApiOperation({ summary: 'Edit a usecase' })
  async editUsecase(
    @UserContext() userContext: IUserContext,
    @Param('usecase') usecase: string,
    @Body() body,
  ) {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);
      return this.usecaseService.editUsecase(
        DEFAULT_TENANT_ID,
        usecase,
        body.defaultConfiguration,
        body.useCaseKeys,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'editing a usecase',
        'editUsecase',
        true,
        500,
      );
    }
  }

  @Delete('/:usecase')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a usecase' })
  async deleteUsecase(
    @UserContext() userContext: IUserContext,
    @Param('usecase') usecase: string,
  ) {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);
      return this.usecaseService.deleteUsecase(DEFAULT_TENANT_ID, usecase);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting a usecase',
        'deleteUsecase',
        true,
        500,
      );
    }
  }
}
