import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  HttpCode,
  Query,
  Post,
  Delete,
  UseFilters,
} from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { Aum, Token } from 'src/types/token';

import {
  extractUsertypeFromContext,
  IUserContext,
  keys as UserContextKeys,
} from 'src/types/userContext';
import {
  ListAllTokensQueryInput,
  ListAllTokenOutput,
  RetrieveTokenInvestorsQueryInput,
  RetrieveTokenInvestorsParamInput,
  VerifierOutput,
  VerifierBodyInput,
  VerifierParamInput,
  NotaryParamInput,
  NotaryBodyInput,
  NotaryOutput,
  NavManagerParamInput,
  NavManagerBodyInput,
  NavManagerOutput,
  OwnershipParamInput,
  OwnershipBodyInput,
  OwnershipOutput,
  ListAllTokenInvestorsOutput,
  MAX_TOKENS_COUNT,
  MAX_INVESTORS_COUNT,
  ExtensionBodyInput,
  ExtensionParamInput,
  ExtensionOutput,
  AllowListParamInput,
  AllowListBodyInput,
  AllowListOutput,
  ListAllTokenAums,
  CurrentPriceParamInput,
  CurrentPriceOutput,
} from './token.dto';
import { User, UserType } from 'src/types/user';
import { EntityType } from 'src/types/entity';
import { RoleService } from '../v2Role/role.service';
import { FunctionName } from 'src/types/smartContract';
import { TokenUpdateService } from './token.service/updateToken';
import { TokenListingService } from './token.service/listAllTokens';
import { UserListingService } from '../v2User/user.service/listAllUsers';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { TokenRetrievalService } from 'src/modules/v2Token/token.service/retrieveToken';
import {
  addDate,
  dateAmountType,
  formatDateAsShortString,
  resetTime,
} from 'src/utils/date';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/essentials/token')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class TokenController {
  constructor(
    private readonly roleService: RoleService,
    private readonly tokenUpdateService: TokenUpdateService,
    private readonly tokenListingService: TokenListingService,
    private readonly userListingService: UserListingService,
    private readonly tokenRetrievalService: TokenRetrievalService,
  ) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllTokens(
    @UserContext() userContext: IUserContext,
    @Query() tokenQuery: ListAllTokensQueryInput,
  ): Promise<ListAllTokenOutput> {
    if (typeof tokenQuery.withBalances === 'string') {
      const withBalancesString: string = tokenQuery.withBalances;
      tokenQuery.withBalances = withBalancesString === 'false' ? false : true;
    }
    try {
      const offset = Number(tokenQuery.offset || 0);
      const limit: number = Math.min(
        Number(tokenQuery.limit || MAX_TOKENS_COUNT),
        MAX_TOKENS_COUNT,
      );

      const typeFunctionUser: UserType =
        extractUsertypeFromContext(userContext);

      let tokensList: {
        tokens: Array<Token>;
        deletedTokenIds?: Array<string>;
        total: number;
      };
      if (
        typeFunctionUser === UserType.SUPERADMIN ||
        typeFunctionUser === UserType.ADMIN
      ) {
        tokensList = await this.tokenListingService.listAllFullTokensAsAdmin(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          offset,
          limit,
          tokenQuery.withCycles,
        );
      } else {
        tokensList = await this.tokenListingService.listAllFullTokensAsUser(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          offset,
          limit,
          typeFunctionUser !== UserType.INVESTOR
            ? tokenQuery.investorId
            : undefined,
          tokenQuery.withBalances,
          tokenQuery.withCycles,
          tokenQuery.withSearch,
          tokenQuery.deployed,
        );
      }

      let messageToAppend = '';
      if (tokensList.deletedTokenIds?.length > 0) {
        messageToAppend = ` WARNING: the following tokens don't exist anymore but haven't been deleted properly, links pointing to them still exist (${JSON.stringify(
          tokensList.deletedTokenIds || [],
        )}).`;
      }

      const response = {
        tokens: tokensList.tokens,
        count: tokensList.tokens.length,
        total: tokensList.total,
        message: `${tokensList.tokens.length} token(s) listed successfully.${messageToAppend}`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing tokens',
        'listAllTokens',
        true,
        500,
      );
    }
  }

  @Get('/:tokenId/investor')
  @HttpCode(200)
  @Protected(true, [])
  async listAllTokenInvestors(
    @UserContext() userContext: IUserContext,
    @Query() tokenInvestorsQuery: RetrieveTokenInvestorsQueryInput,
    @Param() tokenInvestorsParam: RetrieveTokenInvestorsParamInput,
  ): Promise<ListAllTokenInvestorsOutput> {
    try {
      // In the case of a Syndicated Loan, investors can retrieve list of all token's investors
      // For all other types of assets, only issuers can retrieve list of all token's investors

      const {
        callerId: _callerId,
        offset: reqOffset,
        limit: reqLimit,
        userId: _userId,
        withSearch,
        ...tokenInvestors
      } = tokenInvestorsQuery;

      const offset = Number(reqOffset || 0);
      const limit: number = Math.min(
        Number(reqLimit || MAX_INVESTORS_COUNT),
        MAX_INVESTORS_COUNT,
      );

      const investorsList: {
        investors: Array<User>;
        total: number;
      } = await this.userListingService.listAllInvestorsLinkedToToken({
        ...tokenInvestors,
        tenantId: userContext[UserContextKeys.TENANT_ID],
        user: userContext[UserContextKeys.USER],
        tokenId: tokenInvestorsParam.tokenId,
        offset,
        limit,
        callerId: userContext[UserContextKeys.CALLER_ID],
        withSearch,
      });

      const response = {
        users: investorsList.investors,
        count: investorsList.investors.length,
        total: investorsList.total,
        message: `${investorsList.investors.length} user(s) listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "listing token's investors",
        'listAllTokenInvestors',
        true,
        500,
      );
    }
  }

  @Get('/:tokenId/aum')
  @HttpCode(200)
  @Protected(true, [])
  async listAllTokenAum(
    @UserContext() userContext: IUserContext,
    @Param() tokenInvestorsParam: RetrieveTokenInvestorsParamInput,
  ): Promise<ListAllTokenAums> {
    try {
      const aumList: {
        aums: Array<Aum>;
        total: number;
      } = await this.userListingService.listAllTokenAum(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER],
        tokenInvestorsParam.tokenId,
      );

      const aumMap: Record<string, Aum> = {};

      aumList.aums.forEach(
        (aum) => (aumMap[formatDateAsShortString(aum.t)] = aum),
      );

      const todayDate = resetTime(new Date());
      const tomorrow = addDate(todayDate, 1, dateAmountType.DAYS);
      let currentDate = addDate(tomorrow, -1, dateAmountType.YEARS); // We set current date to "1 year ago"
      let currentPrice: number =
        aumList.aums[0] && aumList.aums[0].t < currentDate
          ? aumList.aums[0].price
          : 0;
      let currentQuantity: number =
        aumList.aums[0] && aumList.aums[0].t < currentDate
          ? aumList.aums[0].quantity
          : 0;

      const finalAumList: Array<Aum> = [];
      while (currentDate < tomorrow) {
        const currentDateShortString = formatDateAsShortString(currentDate);
        const currentAum = aumMap[currentDateShortString];
        if (currentAum) {
          currentPrice = currentAum.price;
          currentQuantity = currentAum.quantity;
        }
        finalAumList.push({
          t: new Date(`${currentDateShortString}T00:00:00.000Z`),
          price: currentPrice,
          quantity: currentQuantity,
        });
        currentDate = addDate(currentDate, 1, dateAmountType.DAYS);
      }

      const response = {
        aums: finalAumList,
        total: finalAumList.length,
        message: `${finalAumList.length} history point(s) listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing token aum',
        'listAllTokenAum',
        true,
        500,
      );
    }
  }

  @Get('/:tokenId/total/price')
  @HttpCode(200)
  async retrieveCurrentTotalPrice(
    @UserContext() userContext: IUserContext,
    @Param() priceParam: CurrentPriceParamInput,
  ): Promise<CurrentPriceOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const currentTotalPrice =
        await this.tokenRetrievalService.retrieveCurrentTotalPrice(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          priceParam.tokenId,
        );

      const response = currentTotalPrice;

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieve current total price',
        'currentTotalPrice',
        true,
        500,
      );
    }
  }

  @Post('/:tokenId/allowlist')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async addAllowlisted(
    @UserContext() userContext: IUserContext,
    @Param() allowlistParam: AllowListParamInput,
    @Body() allowlistBody: AllowListBodyInput,
  ): Promise<AllowListOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: OwnershipOutput =
        await this.tokenUpdateService.allowlistOnChain(
          userContext[UserContextKeys.TENANT_ID],
          allowlistBody.idempotencyKey,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          typeFunctionUser,
          allowlistParam.tokenId,
          allowlistBody.submitterId,
          true,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding allowlisted',
        'addAllowlisted',
        true,
        500,
      );
    }
  }

  @Put('/:tokenId/transfer/ownership')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async transferContractOwnership(
    @UserContext() userContext: IUserContext,
    @Param() ownershipParam: OwnershipParamInput,
    @Body() ownershipBody: OwnershipBodyInput,
  ): Promise<OwnershipOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: OwnershipOutput =
        await this.tokenUpdateService.transferContractOwnership(
          userContext[UserContextKeys.TENANT_ID],
          ownershipBody.idempotencyKey,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          typeFunctionUser,
          ownershipParam.tokenId,
          ownershipBody.newOwnerAddress,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'transferring contract ownership',
        'transferContractOwnership',
        true,
        500,
      );
    }
  }

  @Put('/:tokenId/extension')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async setCustomTokenExtension(
    @UserContext() userContext: IUserContext,
    @Param() extensionParam: ExtensionParamInput,
    @Body() extensionBody: ExtensionBodyInput,
  ): Promise<ExtensionOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: ExtensionOutput =
        await this.tokenUpdateService.setCustomTokenExtension(
          userContext[UserContextKeys.TENANT_ID],
          extensionBody.idempotencyKey,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          typeFunctionUser,
          extensionParam.tokenId,
          extensionBody.customExtensionAddress,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'setting custom token extension',
        'setCustomTokenExtension',
        true,
        500,
      );
    }
  }

  @Put('/:tokenId/add/notary')
  @HttpCode(200)
  @Protected(true, [])
  async addNotaryForToken(
    @UserContext() userContext: IUserContext,
    @Param() notaryParam: NotaryParamInput,
    @Body() notaryBody: NotaryBodyInput,
  ): Promise<NotaryOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const functionName: FunctionName = FunctionName.KYC_ADD_NOTARY;

      const response: NotaryOutput =
        await this.roleService.addThirdPartyToEntityAsIssuer(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          functionName,
          notaryBody.notaryId,
          UserType.NOTARY,
          userContext[UserContextKeys.USER_ID],
          notaryParam.tokenId,
          EntityType.TOKEN,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding notary for token',
        'addNotaryForToken',
        true,
        500,
      );
    }
  }

  @Put('/:tokenId/add/kyc/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async addKycVerifierForToken(
    @UserContext() userContext: IUserContext,
    @Param() verifierParam: VerifierParamInput,
    @Body() verifierBody: VerifierBodyInput,
  ): Promise<VerifierOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const functionName: FunctionName = FunctionName.KYC_ADD_VERIFIER;

      const response: VerifierOutput =
        await this.roleService.addThirdPartyToEntityAsIssuer(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          functionName,
          verifierBody.verifierId,
          UserType.VERIFIER,
          userContext[UserContextKeys.USER_ID],
          verifierParam.tokenId,
          EntityType.TOKEN,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding KYC verifier for token',
        'addKycVerifierForToken',
        true,
        500,
      );
    }
  }

  @Put('/:tokenId/add/nav/manager')
  @HttpCode(200)
  @Protected(true, [])
  async addNavManagerForToken(
    @UserContext() userContext: IUserContext,
    @Param() navManagerParam: NavManagerParamInput,
    @Body() navManagerBody: NavManagerBodyInput,
  ): Promise<NavManagerOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const functionName: FunctionName = FunctionName.KYC_ADD_NAV_MANAGER;

      const response: NavManagerOutput =
        await this.roleService.addThirdPartyToEntityAsIssuer(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          functionName,
          navManagerBody.navManagerId,
          UserType.NAV_MANAGER,
          userContext[UserContextKeys.USER_ID],
          navManagerParam.tokenId,
          EntityType.TOKEN,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding NAV manger for token',
        'addNavManagerForToken',
        true,
        500,
      );
    }
  }

  @Delete('/:tokenId/allowlist')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async removeAllowlisted(
    @UserContext() userContext: IUserContext,
    @Param() allowlistParam: AllowListParamInput,
    @Body() allowlistBody: AllowListBodyInput,
  ): Promise<AllowListOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: OwnershipOutput =
        await this.tokenUpdateService.allowlistOnChain(
          userContext[UserContextKeys.TENANT_ID],
          allowlistBody.idempotencyKey,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER_ID],
          typeFunctionUser,
          allowlistParam.tokenId,
          allowlistBody.submitterId,
          false, // remove from allowlist
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'removing allowlisted',
        'removeAllowlisted',
        true,
        500,
      );
    }
  }
}
