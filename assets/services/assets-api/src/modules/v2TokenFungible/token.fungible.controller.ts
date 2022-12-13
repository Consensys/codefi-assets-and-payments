import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  HttpCode,
  Param,
  UseFilters,
} from '@nestjs/common';

import {
  extractUsertypeFromContext,
  IUserContext,
  keys as UserContextKeys,
} from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

import {
  RetrieveFungibleTokenOutput,
  RetrieveFungibleTokenParamInput,
  RetrieveFungibleTokenQueryInput,
  CreateFungibleTokenBodyInput,
  UpdateFungibleTokenOutput,
  UpdateFungibleTokenBodyInput,
  UpdateFungibleTokenParamInput,
  MintFungibleTokenParamInput,
  MintFungibleTokenBodyInput,
  TranferFungibleTokenParamInput,
  TransferFungibleTokenBodyInput,
  BurnFungibleTokenParamInput,
  BurnFungibleTokenBodyInput,
} from './token.fungible.dto';
import { keys as TokenKeys, Token } from 'src/types/token';
import { TokenRetrievalService } from 'src/modules/v2Token/token.service/retrieveToken';
import { TokenCreationService } from 'src/modules/v2Token/token.service/createToken';
import {
  CreateTokenOutput,
  DeleteTokenOutput,
} from 'src/modules/v2Token/token.dto';
import { TokenUpdateService } from 'src/modules/v2Token/token.service/updateToken';
import { TokenDeletionService } from 'src/modules/v2Token/token.service/deleteToken';
import {
  MintTokenOutput,
  TransferTokenOutput,
  BurnTokenOutput,
} from 'src/modules/v2Transaction/transaction.token.dto';
import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import { UserType } from 'src/types/user';
import { TokenCategory } from 'src/types/smartContract';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import {
  ApiBearerAuth,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@ApiTags('Fungible tokens')
@ApiBearerAuth('access-token')
@Controller('v2/essentials/token/fungible')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class TokenFungibleController {
  constructor(
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly tokenCreationService: TokenCreationService,
    private readonly tokenRetrievalService: TokenRetrievalService,
    private readonly tokenUpdateService: TokenUpdateService,
    private readonly tokenDeletionService: TokenDeletionService,
  ) {}

  @Post()
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:token'])
  @ApiOperation({ summary: 'Create a new fungible token' })
  @Protected(true, [])
  async createFungible(
    @UserContext() userContext: IUserContext,
    @Body() tokenBody: CreateFungibleTokenBodyInput,
  ): Promise<CreateTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response = await this.tokenCreationService.createToken(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.CALLER_ID],
        userContext[UserContextKeys.USER_ID],
        typeFunctionUser,
        tokenBody.wallet,
        TokenCategory.FUNGIBLE,
        tokenBody.tokenStandard,
        tokenBody.name,
        tokenBody.symbol,
        tokenBody.chainId, // TO BE DEPRECATED (replaced by 'networkKey')
        tokenBody.networkKey,
        undefined, // classes (only for hybrid tokens)
        tokenBody.description,
        undefined, // certificateActivated (only for hybrid tokens)
        undefined, // certificateType (only for hybrid tokens)
        undefined, // unregulatedERC20transfersActivated (only for hybrid tokens)
        tokenBody.picture,
        tokenBody.bankDepositDetail,
        tokenBody.kycTemplateId,
        tokenBody.data,
        tokenBody.notaryId,
        tokenBody.sendNotification,
        tokenBody.tokenAddress, // token address in case token is already deployed
        undefined, // [Optional] Address of "custom" extension contract, the token contract will be linked to
        undefined, // [Optional] Address, the token contract ownership shall be transferred to
        tokenBody.bypassSecondaryTradeIssuerApproval, // [Optional] Flag to bypass issuer's approval of secondary trade orders
        tokenBody.initialSupplies,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating fungible token',
        'createFungible',
        true,
        500,
      );
    }
  }

  @Get('/:tokenId')
  @HttpCode(200)
  @ApiOAuth2(['read:token'])
  @ApiOperation({ summary: 'Retrieve a fungible token' })
  @Protected(true, [])
  async retrieveFungible(
    @UserContext() userContext: IUserContext,
    @Query() tokenQuery: RetrieveFungibleTokenQueryInput,
    @Param() tokenParam: RetrieveFungibleTokenParamInput,
  ): Promise<RetrieveFungibleTokenOutput> {
    try {
      const typeFunctionUser: UserType =
        extractUsertypeFromContext(userContext);
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const fungibleToken: Token =
        await this.tokenRetrievalService.retrieveTokenIfLinkedToUser(
          userContext[UserContextKeys.TENANT_ID],
          TokenCategory.FUNGIBLE,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          tokenParam.tokenId,
          undefined, // assetClassKey
          tokenQuery.withVehicles,
          tokenQuery.withBalances,
          tokenQuery.withEthBalance,
          tokenQuery.withCycles,
        );

      const response: RetrieveFungibleTokenOutput = {
        token: fungibleToken,
        message: `Fungible token ${
          fungibleToken[TokenKeys.TOKEN_ID]
        } retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving fungible token',
        'retrieveFungible',
        true,
        500,
      );
    }
  }

  @Put('/:tokenId')
  @HttpCode(200)
  @ApiOAuth2(['write:token'])
  @ApiOperation({ summary: 'Update a fungible token' })
  @Protected(true, [])
  async updateFungible(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: UpdateFungibleTokenParamInput,
    @Body() tokenBody: UpdateFungibleTokenBodyInput,
  ): Promise<UpdateFungibleTokenOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const fungibleToken: Token = await this.tokenUpdateService.updateToken(
        userContext[UserContextKeys.TENANT_ID],
        TokenCategory.FUNGIBLE,
        userContext[UserContextKeys.USER_ID],
        tokenParam.tokenId,
        tokenBody.updatedParameters,
      );

      const response: UpdateFungibleTokenOutput = {
        token: fungibleToken,
        message: `Fungible token ${
          fungibleToken[TokenKeys.TOKEN_ID]
        } updated successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating fungible token',
        'updateFungible',
        true,
        500,
      );
    }
  }

  @Delete('/:tokenId')
  @HttpCode(200)
  @ApiOAuth2(['delete:token'])
  @ApiOperation({ summary: 'Delete a fungible token' })
  @Protected(true, [])
  async deleteFungible(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: UpdateFungibleTokenParamInput,
  ): Promise<DeleteTokenOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: DeleteTokenOutput =
        await this.tokenDeletionService.deleteToken(
          userContext[UserContextKeys.TENANT_ID],
          TokenCategory.FUNGIBLE,
          userContext[UserContextKeys.USER_ID],
          tokenParam.tokenId,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting fungible token',
        'deleteFungible',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/mint')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:mint'])
  @ApiOperation({ summary: 'Mint fungible tokens' })
  @Protected(true, [])
  async mint(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: MintFungibleTokenParamInput,
    @Body() tokenBody: MintFungibleTokenBodyInput,
  ): Promise<MintTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: MintTokenOutput = await this.tokenTxHelperService.mint(
        userContext[UserContextKeys.TENANT_ID],
        tokenBody.idempotencyKey,
        TokenCategory.FUNGIBLE,
        userContext[UserContextKeys.CALLER_ID],
        userContext[UserContextKeys.USER_ID],
        tokenParam.tokenId,
        tokenBody.recipientId,
        undefined, // tokenState
        undefined, // tokenClass
        undefined, // tokenIdentifier
        tokenBody.quantity,
        tokenBody.forcePrice,
        tokenBody.data,
        typeFunctionUser,
        undefined, // scheduledAdditionalAction
        tokenBody.sendNotification,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'minting fungible token',
        'mint',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/transfer')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:transfer'])
  @ApiOperation({ summary: 'Transfer fungible tokens' })
  @Protected(true, [])
  async transfer(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: TranferFungibleTokenParamInput,
    @Body() tokenBody: TransferFungibleTokenBodyInput,
  ): Promise<TransferTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: TransferTokenOutput =
        await this.tokenTxHelperService.transfer(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.FUNGIBLE,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenParam.tokenId,
          tokenBody.recipientId,
          undefined, // tokenState
          undefined, // tokenClass
          undefined, // tokenIdentifier
          tokenBody.quantity,
          tokenBody.forcePrice,
          tokenBody.data,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'transferring fungible token',
        'transfer',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/burn')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:burn'])
  @ApiOperation({ summary: 'Burn fungible tokens' })
  @Protected(true, [])
  async burn(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: BurnFungibleTokenParamInput,
    @Body() tokenBody: BurnFungibleTokenBodyInput,
  ): Promise<BurnTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: BurnTokenOutput = await this.tokenTxHelperService.burn(
        userContext[UserContextKeys.TENANT_ID],
        tokenBody.idempotencyKey,
        TokenCategory.FUNGIBLE,
        userContext[UserContextKeys.CALLER_ID],
        userContext[UserContextKeys.USER_ID],
        tokenParam.tokenId,
        undefined, // tokenState
        undefined, // tokenClass
        undefined, // tokenIdentifier
        tokenBody.quantity,
        tokenBody.forcePrice,
        tokenBody.data,
        typeFunctionUser,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'burning fungible token',
        'burn',
        true,
        500,
      );
    }
  }
}
