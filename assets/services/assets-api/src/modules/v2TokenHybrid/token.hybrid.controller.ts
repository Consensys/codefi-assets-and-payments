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

import {
  extractUsertypeFromContext,
  keys as UserContextKeys,
} from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

import {
  RetrieveHybridTokenOutput,
  RetrieveHybridTokenParamInput,
  RetrieveHybridTokenQueryInput,
  CreateHybridTokenBodyInput,
  UpdateHybridTokenOutput,
  UpdateHybridTokenBodyInput,
  UpdateHybridTokenParamInput,
  MintHybridTokenParamInput,
  MintHybridTokenBodyInput,
  TransferHybridTokenBodyInput,
  TranferHybridTokenParamInput,
  BurnHybridTokenParamInput,
  BurnHybridTokenBodyInput,
  ForceTranferHybridTokenParamInput,
  ForceTransferHybridTokenBodyInput,
  ForceBurnHybridTokenBodyInput,
  ForceBurnHybridTokenParamInput,
  UpdateStateHybridTokenBodyInput,
  UpdateStateHybridTokenParamInput,
  UpdateClassHybridTokenBodyInput,
  UpdateClassHybridTokenParamInput,
  HoldHybridTokenParamInput,
  HoldHybridTokenBodyInput,
  HoldHybridTokenOutput,
  ForceHoldHybridTokenParamInput,
  ForceHoldHybridTokenBodyInput,
  ForceHoldHybridTokenOutput,
  ExecuteHoldHybridTokenOutput,
  ExecuteHoldHybridTokenParamInput,
  ExecuteHoldHybridTokenBodyInput,
  ReleaseHoldHybridTokenOutput,
  ReleaseHoldHybridTokenBodyInput,
  ReleaseHoldHybridTokenParamInput,
  ForceUpdateStateHybridTokenBodyInput,
  ForceUpdateStateHybridTokenParamInput,
  RetrieveHybridTokenSymbolParamInput,
} from './token.hybrid.dto';
import { keys as TokenKeys, Token } from 'src/types/token';
import { keys as UserKeys } from 'src/types/user';
import { TokenRetrievalService } from 'src/modules/v2Token/token.service/retrieveToken';
import { TokenCreationService } from 'src/modules/v2Token/token.service/createToken';
import {
  CreateTokenOutput,
  DeleteTokenOutput,
} from 'src/modules/v2Token/token.dto';
import { TokenUpdateService } from 'src/modules/v2Token/token.service/updateToken';
import { TokenDeletionService } from 'src/modules/v2Token/token.service/deleteToken';
import { TokenTxHelperService } from '../v2Transaction/transaction.service/token';
import {
  MintTokenOutput,
  TransferTokenOutput,
  BurnTokenOutput,
  ForceTransferTokenOutput,
  ForceBurnTokenOutput,
  UpdateStateTokenOutput,
  UpdateClassTokenOutput,
  ForceUpdateStateTokenOutput,
} from '../v2Transaction/transaction.token.dto';
import { UserType } from 'src/types/user';
import { setToLowerCase } from 'src/utils/case';
import { TokenCategory } from 'src/types/smartContract';
import { checkUserType } from 'src/utils/checks/userType';
import { IUserContext } from 'src/types/userContext';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import {
  ApiBearerAuth,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ApiMetadataCallService } from '../v2ApiCall/api.call.service/metadata';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';

@ApiTags('Hybrid tokens')
@ApiBearerAuth('access-token')
@Controller('v2/essentials/token/hybrid')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class TokenHybridController {
  constructor(
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly tokenCreationService: TokenCreationService,
    private readonly tokenRetrievalService: TokenRetrievalService,
    private readonly tokenUpdateService: TokenUpdateService,
    private readonly tokenDeletionService: TokenDeletionService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  @Post()
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:token'])
  @ApiOperation({ summary: 'Create a new hybrid token' })
  @Protected(true, [])
  async createHybrid(
    @UserContext() userContext: IUserContext,
    @Body() tokenBody: CreateHybridTokenBodyInput,
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
        TokenCategory.HYBRID,
        tokenBody.tokenStandard,
        tokenBody.name,
        tokenBody.symbol,
        tokenBody.chainId, // TO BE DEPRECATED (replaced by 'networkKey')
        tokenBody.networkKey,
        tokenBody.classes,
        tokenBody.description,
        tokenBody.certificateActivated, // DEPRECATED (replaced by certificateType)
        tokenBody.certificateType,
        tokenBody.unregulatedERC20transfersActivated,
        tokenBody.picture,
        tokenBody.bankDepositDetail,
        tokenBody.kycTemplateId,
        tokenBody.data,
        tokenBody.notaryId,
        tokenBody.sendNotification,
        tokenBody.tokenAddress, // [Optional] token address in case token is already deployed
        tokenBody.customExtensionAddress, // [Optional] Address of "custom" extension contract, the token contract will be linked to
        tokenBody.initialOwnerAddress, // [Optional] Address, the token contract ownership shall be transferred to
        tokenBody.bypassSecondaryTradeIssuerApproval, // [Optional] Flag to bypass issuer's approval of secondary trade orders
        tokenBody.initialSupplies,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating hybrid token',
        'createHybrid',
        true,
        500,
      );
    }
  }

  @Get('/:tokenId')
  @HttpCode(200)
  @ApiOAuth2(['read:token'])
  @ApiOperation({ summary: 'Retrieve a hybrid token' })
  @Protected(true, [])
  async retrieveHybrid(
    @UserContext() userContext: IUserContext,
    @Query() tokenQuery: RetrieveHybridTokenQueryInput,
    @Param() tokenParam: RetrieveHybridTokenParamInput,
  ): Promise<RetrieveHybridTokenOutput> {
    if (typeof tokenQuery.withBalances === 'string') {
      const withBalancesString: string = tokenQuery.withBalances;
      tokenQuery.withBalances = withBalancesString === 'false' ? false : true;
    }
    try {
      const typeFunctionUser: UserType =
        extractUsertypeFromContext(userContext);
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const hybridToken: Token =
        await this.tokenRetrievalService.retrieveTokenIfLinkedToUser(
          userContext[UserContextKeys.TENANT_ID],
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          tokenParam.tokenId,
          setToLowerCase(tokenQuery.assetClass),
          tokenQuery.withVehicles,
          tokenQuery.withBalances,
          tokenQuery.withEthBalance,
          tokenQuery.withCycles,
        );

      if (
        tokenQuery.withAssetData &&
        hybridToken &&
        hybridToken[TokenKeys.ISSUER]
      ) {
        hybridToken[TokenKeys.DATA][TokenKeys.DATA__ASSET_DATA_DEPRECATED] =
          await this.apiMetadataCallService.fetchAssetData(
            hybridToken[TokenKeys.TENANT_ID],
            hybridToken[TokenKeys.ISSUER][UserKeys.USER_ID],
            hybridToken[TokenKeys.ASSET_TEMPLATE_ID],
            hybridToken[TokenKeys.TOKEN_ID],
          );
      }

      const response: RetrieveHybridTokenOutput = {
        token: hybridToken,
        message: `Hybrid token ${
          hybridToken[TokenKeys.TOKEN_ID]
        } retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving hybrid token',
        'retrieveHybrid',
        true,
        500,
      );
    }
  }

  @Get('/symbol/:symbol')
  @HttpCode(200)
  @ApiOAuth2(['read:token'])
  @ApiOperation({ summary: 'Retrieve a hybrid token' })
  @Protected(true, [])
  async retrieveHybridBySymbol(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: RetrieveHybridTokenSymbolParamInput,
  ): Promise<RetrieveHybridTokenOutput> {
    try {
      const typeFunctionUser: UserType =
        extractUsertypeFromContext(userContext);
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const hybridToken: Token =
        await this.tokenRetrievalService.retrieveTokenBySymbol(
          userContext[UserContextKeys.TENANT_ID],
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          tokenParam.symbol,
        );

      const response: RetrieveHybridTokenOutput = {
        token: hybridToken,
        message: `Hybrid token ${
          hybridToken[TokenKeys.TOKEN_ID]
        } retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving hybrid token',
        'retrieveHybrid',
        true,
        500,
      );
    }
  }

  @Put('/:tokenId')
  @HttpCode(200)
  @ApiOAuth2(['write:token'])
  @ApiOperation({ summary: 'Update a hybrid token' })
  @Protected(true, [])
  async updateHybrid(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: UpdateHybridTokenParamInput,
    @Body() tokenBody: UpdateHybridTokenBodyInput,
  ): Promise<UpdateHybridTokenOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const hybridToken: Token = await this.tokenUpdateService.updateToken(
        userContext[UserContextKeys.TENANT_ID],
        TokenCategory.HYBRID,
        userContext[UserContextKeys.USER_ID],
        tokenParam.tokenId,
        tokenBody.updatedParameters,
      );

      const response: UpdateHybridTokenOutput = {
        token: hybridToken,
        message: `Hybrid token ${
          hybridToken[TokenKeys.TOKEN_ID]
        } updated successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating hybrid token',
        'updateHybrid',
        true,
        500,
      );
    }
  }

  @Delete('/:tokenId')
  @HttpCode(200)
  @ApiOAuth2(['delete:token'])
  @ApiOperation({ summary: 'Delete a hybrid token' })
  @Protected(true, [])
  async deleteHybrid(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: UpdateHybridTokenParamInput,
  ): Promise<DeleteTokenOutput> {
    try {
      const typeFunctionUser: UserType =
        extractUsertypeFromContext(userContext);
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: DeleteTokenOutput =
        await this.tokenDeletionService.deleteToken(
          userContext[UserContextKeys.TENANT_ID],
          TokenCategory.HYBRID,
          userContext[UserContextKeys.USER_ID],
          tokenParam.tokenId,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting hybrid token',
        'deleteHybrid',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/mint')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:mint'])
  @ApiOperation({ summary: 'Mint hybrid tokens' })
  @Protected(true, [])
  async mint(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: MintHybridTokenParamInput,
    @Body() tokenBody: MintHybridTokenBodyInput,
  ): Promise<MintTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: MintTokenOutput = await this.tokenTxHelperService.mint(
        userContext[UserContextKeys.TENANT_ID],
        tokenBody.idempotencyKey,
        TokenCategory.HYBRID,
        userContext[UserContextKeys.CALLER_ID],
        userContext[UserContextKeys.USER_ID],
        tokenParam.tokenId,
        tokenBody.recipientId,
        tokenBody.state,
        tokenBody.class.toLowerCase(),
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
        'minting hybrid token',
        'mint',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/transfer')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:transfer'])
  @ApiOperation({ summary: 'Transfer hybrid tokens' })
  @Protected(true, [])
  async transfer(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: TranferHybridTokenParamInput,
    @Body() tokenBody: TransferHybridTokenBodyInput,
  ): Promise<TransferTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: TransferTokenOutput =
        await this.tokenTxHelperService.transfer(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenParam.tokenId,
          tokenBody.recipientId,
          tokenBody.state,
          tokenBody.class.toLowerCase(),
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
        'transferring hybrid token',
        'transfer',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/burn')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:burn'])
  @ApiOperation({ summary: 'Burn hybrid tokens' })
  @Protected(true, [])
  async burn(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: BurnHybridTokenParamInput,
    @Body() tokenBody: BurnHybridTokenBodyInput,
  ): Promise<BurnTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: BurnTokenOutput = await this.tokenTxHelperService.burn(
        userContext[UserContextKeys.TENANT_ID],
        tokenBody.idempotencyKey,
        TokenCategory.HYBRID,
        userContext[UserContextKeys.CALLER_ID],
        userContext[UserContextKeys.USER_ID],
        tokenParam.tokenId,
        tokenBody.state,
        tokenBody.class.toLowerCase(),
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
        'burning hybrid token',
        'burn',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/force/transfer')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:force:transfer'])
  @ApiOperation({ summary: 'Force transfer of hybrid tokens' })
  @Protected(true, [])
  async forceTransfer(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: ForceTranferHybridTokenParamInput,
    @Body() tokenBody: ForceTransferHybridTokenBodyInput,
  ): Promise<ForceTransferTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: ForceTransferTokenOutput =
        await this.tokenTxHelperService.forceTransfer(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenBody.investorId,
          tokenBody.recipientId,
          tokenParam.tokenId,
          tokenBody.state,
          tokenBody.class.toLowerCase(),
          undefined, // tokenIdentifier
          tokenBody.quantity,
          tokenBody.forcePrice,
          tokenBody.data,
          typeFunctionUser,
          tokenBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'forcing transfer of hybrid token',
        'forceTransfer',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/force/burn')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:force:burn'])
  @ApiOperation({ summary: 'Force burn of hybrid tokens' })
  @Protected(true, [])
  async forceBurn(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: ForceBurnHybridTokenParamInput,
    @Body() tokenBody: ForceBurnHybridTokenBodyInput,
  ): Promise<ForceBurnTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: ForceBurnTokenOutput =
        await this.tokenTxHelperService.forceBurn(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenBody.investorId,
          tokenParam.tokenId,
          tokenBody.state,
          tokenBody.class.toLowerCase(),
          undefined, // tokenIdentifier
          tokenBody.quantity,
          tokenBody.forcePrice,
          tokenBody.data,
          typeFunctionUser,
          tokenBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'forcing burn of hybrid token',
        'forceBurn',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/update/state')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:update:state'])
  @ApiOperation({ summary: 'Update state of hybrid tokens' })
  @Protected(true, [])
  async updateState(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: UpdateStateHybridTokenParamInput,
    @Body() tokenBody: UpdateStateHybridTokenBodyInput,
  ): Promise<UpdateStateTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: UpdateStateTokenOutput =
        await this.tokenTxHelperService.updateState(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenParam.tokenId,
          tokenBody.state,
          tokenBody.class.toLowerCase(),
          tokenBody.destinationState,
          tokenBody.quantity,
          tokenBody.forcePrice,
          tokenBody.data,
          typeFunctionUser,
          tokenBody.emailRemarks,
          tokenBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating state of hybrid token',
        'updateState',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/force/update/state')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:force:update:state'])
  @ApiOperation({ summary: 'Force update state of hybrid tokens' })
  @Protected(true, [])
  async forceUpdateState(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: ForceUpdateStateHybridTokenParamInput,
    @Body() tokenBody: ForceUpdateStateHybridTokenBodyInput,
  ): Promise<ForceUpdateStateTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: UpdateStateTokenOutput =
        await this.tokenTxHelperService.forceUpdateState(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenBody.investorId,
          tokenParam.tokenId,
          tokenBody.state,
          tokenBody.class.toLowerCase(),
          tokenBody.destinationState,
          tokenBody.quantity,
          tokenBody.forcePrice,
          tokenBody.data,
          typeFunctionUser,
          false, //sendNotification
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'forcing update state of hybrid token',
        'forceUpdateState',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/update/class')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:update:class'])
  @ApiOperation({ summary: 'Update class of hybrid tokens' })
  @Protected(true, [])
  async updateClass(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: UpdateClassHybridTokenParamInput,
    @Body() tokenBody: UpdateClassHybridTokenBodyInput,
  ): Promise<UpdateClassTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: UpdateClassTokenOutput =
        await this.tokenTxHelperService.updateClass(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenBody.investorId,
          tokenParam.tokenId,
          tokenBody.state,
          tokenBody.class.toLowerCase(),
          tokenBody.destinationClass.toLowerCase(),
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
        'updating class of hybrid token',
        'updateClass',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/hold')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:hold'])
  @ApiOperation({ summary: 'Create a token hold' })
  @Protected(true, [])
  async hold(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: HoldHybridTokenParamInput,
    @Body() tokenBody: HoldHybridTokenBodyInput,
  ): Promise<HoldHybridTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: HoldHybridTokenOutput =
        await this.tokenTxHelperService.hold(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenBody.recipientId,
          tokenParam.tokenId,
          tokenBody.state,
          tokenBody.class.toLowerCase(),
          undefined, // tokenIdentifier
          tokenBody.quantity,
          tokenBody.forcePrice,
          Number(tokenBody.nbHoursBeforeExpiration),
          tokenBody.secretHash,
          tokenBody.data,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating hybrid token hold',
        'hold',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/force/hold')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:force:hold'])
  @ApiOperation({ summary: 'Force creation of a token hold' })
  @Protected(true, [])
  async forceHold(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: ForceHoldHybridTokenParamInput,
    @Body() tokenBody: ForceHoldHybridTokenBodyInput,
  ): Promise<ForceHoldHybridTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: HoldHybridTokenOutput =
        await this.tokenTxHelperService.forceHold(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenBody.investorId,
          tokenBody.recipientId,
          tokenParam.tokenId,
          tokenBody.state,
          tokenBody.class.toLowerCase(),
          undefined, // tokenIdentifier
          tokenBody.quantity,
          tokenBody.forcePrice,
          Number(tokenBody.nbHoursBeforeExpiration),
          tokenBody.secretHash,
          tokenBody.data,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'forcing creation of hybrid token hold',
        'forceHold',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/execute/hold')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:execute:hold'])
  @ApiOperation({ summary: 'Execute a token hold' })
  @Protected(true, [])
  async executeHold(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: ExecuteHoldHybridTokenParamInput,
    @Body() tokenBody: ExecuteHoldHybridTokenBodyInput,
  ): Promise<ExecuteHoldHybridTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: ExecuteHoldHybridTokenOutput =
        await this.tokenTxHelperService.executeHold(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenParam.tokenId,
          tokenBody.holdId,
          tokenBody.htlcSecret,
          tokenBody.forcePrice,
          tokenBody.data,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'executing token hold',
        'executeHold',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/transaction/release/hold')
  @HttpCode(202) // blockchain transaction
  @ApiOAuth2(['write:transaction:release:hold'])
  @ApiOperation({ summary: 'Release a token hold' })
  @Protected(true, [])
  async releaseHold(
    @UserContext() userContext: IUserContext,
    @Param() tokenParam: ReleaseHoldHybridTokenParamInput,
    @Body() tokenBody: ReleaseHoldHybridTokenBodyInput,
  ): Promise<ReleaseHoldHybridTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: ReleaseHoldHybridTokenOutput =
        await this.tokenTxHelperService.releaseHold(
          userContext[UserContextKeys.TENANT_ID],
          tokenBody.idempotencyKey,
          TokenCategory.HYBRID,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          tokenParam.tokenId,
          tokenBody.holdId,
          tokenBody.data,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'releasing token hold',
        'releaseHold',
        true,
        500,
      );
    }
  }
}
