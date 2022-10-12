import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Delete,
  Query,
  Body,
  HttpCode,
  UseFilters,
} from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import {
  ListAllWalletsOutput,
  ListAllWalletsParamInput,
  CreateWalletOutput,
  CreateWalletBodyInput,
  CreateWalletParamInput,
  CreateWalletQueryInput,
  RetrieveWalletParamInput,
  RetrieveWalletOutput,
  UpdateWalletOutput,
  UpdateWalletQueryInput,
  UpdateWalletParamInput,
  UpdateWalletBodyInput,
  DeleteWalletOutput,
  DeleteWalletParamInput,
} from './wallet.dto';
import { WalletService } from './wallet.service';
import { UserType } from 'src/types/user';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import {
  ApiBearerAuth,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';
import { ApiEntityCallService } from '../v2ApiCall/api.call.service/entity';
import { Wallet } from 'src/types/wallet';

@ApiTags('Wallets')
@ApiBearerAuth('access-token')
@Controller('v2/essentials/user/:userId/wallet')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOAuth2(['read:user:wallet'])
  @ApiOperation({ summary: 'List all wallets' })
  @Protected(true, [])
  async listAllWallets(
    @UserContext() userContext: IUserContext,
    @Param() walletParam: ListAllWalletsParamInput,
  ): Promise<ListAllWalletsOutput> {
    try {
      checkUserType(
        walletParam.userId !== userContext[UserContextKeys.USER_ID]
          ? UserType.ISSUER
          : UserType.INVESTOR,
        userContext[UserContextKeys.USER],
      );

      const response: ListAllWalletsOutput =
        await this.walletService.listAllWallets(
          userContext[UserContextKeys.TENANT_ID],
          walletParam.userId,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "listing user's wallets",
        'listAllWallets',
        true,
        500,
      );
    }
  }

  @Post()
  @HttpCode(201)
  @ApiOAuth2(['write:user:wallet'])
  @ApiOperation({ summary: 'Create (or register) new wallet' })
  @Protected(true, [])
  async createWallet(
    @UserContext() userContext: IUserContext,
    @Query() walletQuery: CreateWalletQueryInput,
    @Param() walletParam: CreateWalletParamInput,
    @Body() walletBody: CreateWalletBodyInput,
  ): Promise<CreateWalletOutput> {
    try {
      checkUserType(
        walletParam.userId !== userContext[UserContextKeys.USER_ID]
          ? UserType.ISSUER
          : UserType.INVESTOR,
        userContext[UserContextKeys.USER],
      );

      const response: CreateWalletOutput =
        await this.walletService.createWallet(
          userContext[UserContextKeys.TENANT_ID],
          walletParam.userId,
          walletBody.walletAddress,
          walletBody.walletType,
          walletBody.data,
          walletQuery.setAsDefault,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating a wallet',
        'createWallet',
        true,
        500,
      );
    }
  }

  @Get(':walletAddress')
  @HttpCode(200)
  @ApiOAuth2(['read:user:wallet'])
  @ApiOperation({ summary: 'Retrieve wallet' })
  @Protected(true, [])
  async retrieveWallet(
    @UserContext() userContext: IUserContext,
    @Param() walletParam: RetrieveWalletParamInput,
  ): Promise<RetrieveWalletOutput> {
    try {
      checkUserType(
        walletParam.userId !== userContext[UserContextKeys.USER_ID]
          ? UserType.ISSUER
          : UserType.INVESTOR,
        userContext[UserContextKeys.USER],
      );

      const wallet: Wallet = await this.apiEntityCallService.fetchWallet(
        userContext[UserContextKeys.TENANT_ID],
        walletParam.userId,
        walletParam.walletAddress,
      );

      const response: RetrieveWalletOutput = {
        wallet,
        message: `Wallet ${walletParam.walletAddress} retrieved successfully for user ${walletParam.userId}`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving a wallet',
        'retrieveWallet',
        true,
        500,
      );
    }
  }

  @Put(':walletAddress')
  @HttpCode(200)
  @ApiOAuth2(['write:user:wallet'])
  @ApiOperation({ summary: 'Update wallet' })
  @Protected(true, [])
  async updateWalletByUserIdAndWalletId(
    @UserContext() userContext: IUserContext,
    @Query() walletQuery: UpdateWalletQueryInput,
    @Param() walletParam: UpdateWalletParamInput,
    @Body() walletBody: UpdateWalletBodyInput,
  ): Promise<UpdateWalletOutput> {
    try {
      checkUserType(
        walletParam.userId !== userContext[UserContextKeys.USER_ID]
          ? UserType.ISSUER
          : UserType.INVESTOR,
        userContext[UserContextKeys.USER],
      );

      const response: UpdateWalletOutput =
        await this.walletService.updateWallet(
          userContext[UserContextKeys.TENANT_ID],
          walletParam.userId,
          walletParam.walletAddress,
          walletBody.data,
          walletQuery.setAsDefault,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating a wallet',
        'updateWallet',
        true,
        500,
      );
    }
  }

  @Delete(':walletAddress')
  @HttpCode(200)
  @ApiOAuth2(['delete:user:wallet'])
  @ApiOperation({ summary: 'Delete wallet' })
  @Protected(true, [])
  async deleteUserByUserIdAndWalletId(
    @UserContext() userContext: IUserContext,
    @Param() walletParam: DeleteWalletParamInput,
  ): Promise<DeleteWalletOutput> {
    try {
      checkUserType(
        walletParam.userId !== userContext[UserContextKeys.USER_ID]
          ? UserType.ADMIN
          : UserType.INVESTOR,
        userContext[UserContextKeys.USER],
      );

      await this.apiEntityCallService.deleteWallet(
        userContext[UserContextKeys.TENANT_ID],
        walletParam.userId,
        walletParam.walletAddress,
      );

      const response: DeleteWalletOutput = {
        message: `Wallet ${walletParam.walletAddress} deleted successfully for user ${walletParam.userId}`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting a wallet',
        'deleteWallet',
        true,
        500,
      );
    }
  }
}
