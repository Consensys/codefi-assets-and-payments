import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  HttpCode,
  Query,
  Body,
  Param,
  UseFilters,
} from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import {
  RetrieveNonfungibleTokenOutput,
  RetrieveNonfungibleTokenParamInput,
  RetrieveNonfungibleTokenQueryInput,
  CreateNonfungibleTokenBodyInput,
  UpdateNonfungibleTokenOutput,
  UpdateNonfungibleTokenBodyInput,
  UpdateNonfungibleTokenParamInput,
  MintNonfungibleTokenParamInput,
  MintNonfungibleTokenBodyInput,
  TranferNonfungibleTokenParamInput,
  TransferNonfungibleTokenBodyInput,
  BurnNonfungibleTokenParamInput,
  BurnNonfungibleTokenBodyInput,
} from './token.nonfungible.dto';
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
} from '../v2Transaction/transaction.token.dto';
import { TokenTxHelperService } from '../v2Transaction/transaction.service/token';
import { UserType } from 'src/types/user';
import { TokenCategory } from 'src/types/smartContract';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import {
  keys as UserContextKeys,
  IUserContext,
  extractUsertypeFromContext,
} from 'src/types/userContext';
import {
  ApiBearerAuth,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';

@ApiTags('Non-fungible tokens')
@ApiBearerAuth('access-token')
@Controller('v2/essentials/token/nonfungible')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class TokenNonfungibleController {
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
  @ApiOperation({ summary: 'Create a new non-fungible token' })
  @Protected(true, [])
  async createNonfungible(
    @Body() tokenBody: CreateNonfungibleTokenBodyInput,
    @UserContext() userContext: IUserContext,
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
        TokenCategory.NONFUNGIBLE,
        tokenBody.tokenStandard,
        tokenBody.name,
        tokenBody.symbol,
        tokenBody.chainId, // TO BE DEPRECATED (replaced by 'networkKey')
        tokenBody.networkKey,
        undefined, // classes (only for Nonfungible tokens)
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
        undefined, // [Optional] Address, the token contract ownership shall be transferred to,
        tokenBody.bypassSecondaryTradeIssuerApproval, // [Optional] Flag to bypass issuer's approval of secondary trade orders
        tokenBody.initialSupplies,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating nonfungible token',
        'createNonfungible',
        true,
        500,
      );
    }
  }

  @Get('/:tokenId')
  @HttpCode(200)
  @ApiOAuth2(['read:token'])
  @ApiOperation({ summary: 'Retrieve a non-fungible token' })
  @Protected(true, [])
  async retrieveNonfungible(
    @Query() tokenQuery: RetrieveNonfungibleTokenQueryInput,
    @Param() tokenParam: RetrieveNonfungibleTokenParamInput,
    @UserContext() userContext: IUserContext,
  ): Promise<RetrieveNonfungibleTokenOutput> {
    try {
      const typeFunctionUser: UserType =
        extractUsertypeFromContext(userContext);
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const nonfungibleToken: Token =
        await this.tokenRetrievalService.retrieveTokenIfLinkedToUser(
          userContext[UserContextKeys.TENANT_ID],
          TokenCategory.NONFUNGIBLE,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          tokenParam.tokenId,
          undefined, // assetClassKey
          tokenQuery.withVehicles,
          tokenQuery.withBalances,
          tokenQuery.withEthBalance,
          tokenQuery.withCycles,
        );

      const response: RetrieveNonfungibleTokenOutput = {
        token: nonfungibleToken,
        message: `Nonfungible token ${
          nonfungibleToken[TokenKeys.TOKEN_ID]
        } retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving nonfungible token',
        'retrieveNonfungible',
        true,
        500,
      );
    }
  }

  @Put('/:tokenId')
  @HttpCode(200)
  @ApiOAuth2(['write:token'])
  @ApiOperation({ summary: 'Update a non-fungible token' })
  @Protected(true, [])
  async updateNonfungible(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: UpdateNonfungibleTokenParamInput,
    @Body() tokenBody: UpdateNonfungibleTokenBodyInput,
  ): Promise<UpdateNonfungibleTokenOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const nonfungibleToken: Token = await this.tokenUpdateService.updateToken(
        userContext[UserContextKeys.TENANT_ID],
        TokenCategory.NONFUNGIBLE,
        userContext[UserContextKeys.USER_ID],
        tokenParam.tokenId,
        tokenBody.updatedParameters,
      );

      const response: UpdateNonfungibleTokenOutput = {
        token: nonfungibleToken,
        message: `Nonfungible token ${
          nonfungibleToken[TokenKeys.TOKEN_ID]
        } updated successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating nonfungible token',
        'updateNonfungible',
        true,
        500,
      );
    }
  }

  @Delete('/:tokenId')
  @HttpCode(200)
  @ApiOAuth2(['delete:token'])
  @ApiOperation({ summary: 'Delete a non-fungible token' })
  @Protected(true, [])
  async deleteNonfungible(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: UpdateNonfungibleTokenParamInput,
  ): Promise<DeleteTokenOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: DeleteTokenOutput =
        await this.tokenDeletionService.deleteToken(
          userContext[UserContextKeys.TENANT_ID],
          TokenCategory.NONFUNGIBLE,
          userContext[UserContextKeys.USER_ID],
          tokenParam.tokenId,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting nonfungible token',
        'deleteNonfungible',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/mint')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:mint'])
  @ApiOperation({ summary: 'Mint non-fungible tokens' })
  @Protected(true, [])
  async mint(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: MintNonfungibleTokenParamInput,
    @Body() tokenBody: MintNonfungibleTokenBodyInput,
  ): Promise<MintTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: MintTokenOutput = await this.tokenTxHelperService.mint(
        userContext[UserContextKeys.TENANT_ID],
        tokenBody.idempotencyKey,
        TokenCategory.NONFUNGIBLE,
        userContext[UserContextKeys.CALLER_ID],
        userContext[UserContextKeys.USER_ID],
        tokenParam.tokenId,
        tokenBody.recipientId,
        undefined, // tokenState
        undefined, // tokenClass
        tokenBody.identifier, // tokenIdentifier
        undefined, // amount
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
        'minting nonfungible token',
        'mint',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/transfer')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:transfer'])
  @ApiOperation({ summary: 'Transfer non-fungible tokens' })
  @Protected(true, [])
  async transfer(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: TranferNonfungibleTokenParamInput,
    @Body() tokenBody: TransferNonfungibleTokenBodyInput,
  ): Promise<TransferTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: TransferTokenOutput =
        await this.tokenTxHelperService.transfer(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.NONFUNGIBLE,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenParam.tokenId,
          tokenBody.recipientId,
          undefined, // tokenState
          undefined, // tokenClass
          tokenBody.identifier, // tokenIdentifier
          undefined, // amount
          tokenBody.forcePrice,
          tokenBody.data,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'transferring nonfungible token',
        'transfer',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/burn')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:burn'])
  @ApiOperation({ summary: 'Burn non-fungible tokens' })
  @Protected(true, [])
  async burn(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: BurnNonfungibleTokenParamInput,
    @Body() tokenBody: BurnNonfungibleTokenBodyInput,
  ): Promise<BurnTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: BurnTokenOutput = await this.tokenTxHelperService.burn(
        userContext[UserContextKeys.TENANT_ID],
        tokenBody.idempotencyKey,
        TokenCategory.NONFUNGIBLE,
        userContext[UserContextKeys.CALLER_ID],
        userContext[UserContextKeys.USER_ID],
        tokenParam.tokenId,
        undefined, // tokenState
        undefined, // tokenClass
        tokenBody.identifier, // tokenIdentifier
        undefined, // amount
        tokenBody.forcePrice,
        tokenBody.data,
        typeFunctionUser,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'burning nonfungible token',
        'burn',
        true,
        500,
      );
    }
  }
}
