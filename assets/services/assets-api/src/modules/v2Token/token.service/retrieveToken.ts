import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import ErrorService from 'src/utils/errorService';

import { CycleEnum, TokenIdentifierEnum } from 'src/old/constants/enum';

import { keys as UserKeys, User, UserType } from 'src/types/user';
import { keys as TokenKeys, Token } from 'src/types/token';

import { TokenHelperService } from './index';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { UserHelperService } from 'src/modules/v2User/user.service';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import { UserTokenData } from 'src/types/userEntityData';
import { UserRetrievalService } from 'src/modules/v2User/user.service/retrieveUser';

import { Link } from 'src/types/workflow/workflowInstances/link';
import { EntityType } from 'src/types/entity';
import { UserListingService } from 'src/modules/v2User/user.service/listAllUsers';
import { LinkService } from 'src/modules/v2Link/link.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { checkTokenBelongsToExpectedCategory } from 'src/utils/checks/tokenSandard';
import { TokenCategory } from 'src/types/smartContract';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import { AssetCycleInstance } from 'src/types/asset/cycle';
import { Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { Visibility } from 'src/types/clientApplication';
import { Action } from 'src/types/workflow/workflowInstances/action';
import { WorkflowType } from 'src/types/workflow/workflowInstances';
import { WorkflowInstanceService } from 'src/modules/v2WorkflowInstance/workflow.instance.service';
import { isTokenDiscoveryEnabledCheck } from 'src/utils/utils';

@Injectable()
export class TokenRetrievalService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly tokenHelperService: TokenHelperService,
    private readonly userListingService: UserListingService,
    private readonly userRetrievalService: UserRetrievalService,
    private readonly userHelperService: UserHelperService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly balanceService: BalanceService,
    private readonly configService: ConfigService,
    private readonly workflowInstanceService: WorkflowInstanceService,
  ) {
    this.logger.setContext(TokenRetrievalService.name);
  }

  /**
   * [Retrieve full token]
   *
   * Full token includes:
   *  - raw token, as stored in database
   *  - data stored in deployement workflow instance
   *  - additional data read from smart contract (total supplies, partitions)
   *  - NAV if any
   *  - issuer
   *  - notary
   *  - investors linked to token
   *  - "user-related data" of user calling the API, e.g. list of token actions, list of orders, list of balances
   *
   */
  retrieveFullToken = async (
    tenantId: string,
    callerId: string,
    rawToken: Token,
    assetClassKey: string,
    withIssuer: boolean,
    withNotaries: boolean,
    withSingleUserDetail: boolean,
    singleUser: User, // only relevant if 'withSingleUserDetail' === 'true'
    withVehicles: boolean, // only relevant if 'withSingleUserDetail' === 'true'
    withBalances: boolean, // only relevant if 'withSingleUserDetail' === 'true'
    withEthBalance: boolean, // only relevant if 'withSingleUserDetail' === 'true'
    withCycles: boolean, // only relevant if 'withCycles' === 'true'
    formattedForIssuer: boolean, // only relevant if 'withSingleUserDetail' === 'true'
  ): Promise<Token> => {
    try {
      const tokenId: string = rawToken[TokenKeys.TOKEN_ID];
      let token: Token = await this.tokenHelperService.appendWorflowDataToToken(
        tenantId,
        rawToken,
      );
      // Ensure all asset classes are always lowercase
      token[TokenKeys.ASSET_CLASSES] = token[TokenKeys.ASSET_CLASSES].map(
        (assetclass: string) => {
          return assetclass.toLowerCase();
        },
      );

      // Append additional on-chain data
      token = await this.tokenHelperService.appendAdditionalOnChainDataForToken(
        tenantId,
        callerId,
        token,
      );

      // Append issuer
      if (withIssuer) {
        const issuer: User =
          await this.linkService.retrieveIssuerLinkedToEntityIfExisting(
            tenantId,
            tokenId,
            EntityType.TOKEN,
          );
        const issuerWallet: Wallet = issuer
          ? this.walletService.extractWalletFromUserEntityLink(
              issuer,
              issuer[UserKeys.LINK],
            )
          : undefined;

        token[TokenKeys.ISSUER] = issuer
          ? this.userHelperService.formatIssuer(
              issuer,
              issuerWallet[WalletKeys.WALLET_ADDRESS],
            )
          : undefined;

        // Append owner
        if (
          token[TokenKeys.OWNER] &&
          token[TokenKeys.OWNER][TokenKeys.OWNER_ADDRESS]
        ) {
          const ownerWallet = token[TokenKeys.OWNER][TokenKeys.OWNER_ADDRESS];
          token[TokenKeys.OWNER][TokenKeys.OWNER_OWNERSHIP_TRANSFERRED] =
            issuerWallet
              ? ownerWallet !== issuerWallet[WalletKeys.WALLET_ADDRESS]
              : undefined;
        }
      }
      // Append notaries
      if (withNotaries) {
        const notaries: Array<User> =
          await this.userListingService.listAllThirdPartiesLinkedToEntity(
            tenantId,
            UserType.NOTARY,
            tokenId,
          );
        token[TokenKeys.NOTARIES] = notaries;
      }

      // Append user's token-related data
      if (withSingleUserDetail) {
        const userRelatedData: UserTokenData =
          await this.userRetrievalService.retrieveUserTokenRelatedData(
            tenantId,
            callerId,
            singleUser,
            token,
            assetClassKey,
            withVehicles,
            withBalances,
            withEthBalance, // withEthBalance
          );
        if (formattedForIssuer) {
          // FIXME: This special format needs to be deprecated on FE side
          if (
            token[TokenKeys.INVESTORS] &&
            token[TokenKeys.INVESTORS].length > 0
          ) {
            ErrorService.throwError(
              'shall never happen: investors list will is about to be overwritten',
            );
          }
          token[TokenKeys.INVESTORS] = [
            {
              ...singleUser,
              [UserKeys.TOKEN_RELATED_DATA]: {
                ...userRelatedData,
              },
            },
          ];
        } else {
          token[TokenKeys.USER_RELATED_DATA] = userRelatedData;
        }
      }

      // Append cycles
      if (withCycles) {
        const cycles: Array<AssetCycleInstance> =
          await this.apiMetadataCallService.retrieveCycle(
            tenantId,
            CycleEnum.assetId,
            tokenId,
            undefined,
            undefined,
            false,
          );

        token[TokenKeys.CYCLES] = cycles;
      }

      return token;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving full token',
        'retrieveFullToken',
        false,
        500,
      );
    }
  };

  /**
   * [Retrieve token, but only if user is linked to it]
   */
  retrieveTokenIfLinkedToUser = async (
    tenantId: string,
    tokenCategory: TokenCategory,
    callerId: string,
    user: User,
    tokenId: string,
    assetClassKey: string,
    withVehicles: boolean,
    withBalances: boolean,
    withEthBalance: boolean,
    withCycles: boolean,
  ): Promise<Token> => {
    try {
      const userType: UserType = user[UserKeys.USER_TYPE];

      const [rawToken, tenantConfig]: [Token, Config] = await Promise.all([
        await this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tokenId,
          true,
          undefined,
          undefined,
          true,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      let userTokenLinks: Array<Link>;
      if (userType === UserType.SUPERADMIN || userType === UserType.ADMIN) {
        // Bypasss link check ==> SUPERADMIN and ADMIN can access everything
        //                     or tokenVisibility is set to 'PUBLIC'
      } else {
        // Check if user is linked to token

        // Fetch user-token link
        userTokenLinks = await this.linkService.listAllUserEntityLinks(
          tenantId,
          user[UserKeys.USER_ID],
          userType,
          tokenId,
          EntityType.TOKEN,
          assetClassKey,
          false, // exhaustive list
          false, // strictList
        );

        if (tenantConfig.data.tokenVisibility !== Visibility.PUBLIC) {
          // Verify the user is correctly linked to the token he wants to retrieve
          // "correctly linked" means link is unique and correctly typed

          //Added this to by pass if enableTokendiscover is true
          const config = await this.configService.retrieveTenantConfig(
            tenantId,
          );
          if (!isTokenDiscoveryEnabledCheck(config)) {
            this.linkService.checkLinkIsUnique(
              userTokenLinks,
              userType,
              user[UserKeys.USER_ID],
              EntityType.TOKEN,
              tokenId,
            );
          }
        }
      }

      // Optional - pre-list all token information and store them in cache (only for hybrid tokens)
      await this.balanceService.preListSuppliesForTokens(tenantId, callerId, [
        rawToken,
      ]);

      // Optional - pre-list all user balances and store them in cache
      if (withBalances) {
        await this.balanceService.preListBalancesForUserTokenLinks(
          tenantId,
          callerId,
          [rawToken],
          userTokenLinks,
        );
      }

      const token = await this.retrieveFullToken(
        tenantId,
        callerId,
        rawToken,
        assetClassKey,
        true, // withIssuer
        true, // withNotaries
        true, // withSingleUserDetail (investor needs to retrieve his own balances, token actions, etc.)
        user, // singleUser
        withVehicles,
        withBalances,
        withEthBalance,
        withCycles,
        false, // formattedForIssuer
      );

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      return token;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token if linked to user',
        'retrieveTokenIfLinkedToUser',
        false,
        500,
      );
    }
  };

  async retrieveCurrentTotalPrice(
    tenantId: string,
    user: User,
    tokenId: string,
  ): Promise<{
    price: number;
    quantity: number;
  }> {
    try {
      const allTokenActions: Array<Action> =
        await this.workflowInstanceService.listAllWorkflowInstances(
          tenantId,
          WorkflowType.ACTION,
          WorkflowType.ORDER, // otherWorkflowType
          user,
          tokenId,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined, // TODO: v2 filters
        );

      let prevPrice = 0;
      let prevQuantity = 0;
      allTokenActions.forEach((action: Action) => {
        const priceImpact = action.state === 'paid' ? 1 : 0;
        const newQuantity = prevQuantity + action.quantity * priceImpact;
        const newPrice = prevPrice + action.price * priceImpact;

        prevPrice = newPrice;
        prevQuantity = newQuantity;
      });

      return {
        price: prevPrice,
        quantity: prevQuantity,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieve current total price',
        'retrieveCurrentTotalPrice',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve token by symbol]
   */
  retrieveTokenBySymbol = async (
    tenantId: string,
    tokenCategory: TokenCategory,
    callerId: string,
    user: User,
    symbol: string,
  ): Promise<Token> => {
    try {
      const userType: UserType = user[UserKeys.USER_TYPE];

      const [rawToken, tenantConfig]: [Token, Config] = await Promise.all([
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.symbol,
          symbol,
          true,
          undefined,
          undefined,
          true,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const token = await this.retrieveFullToken(
        tenantId,
        callerId,
        rawToken,
        undefined,
        true, // withIssuer
        false, // withNotaries
        false, // withSingleUserDetail (investor needs to retrieve his own balances, token actions, etc.)
        user, // singleUser
        false,
        false,
        false,
        false,
        false, // formattedForIssuer
      );

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      return token;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token by symbol',
        'retrieveTokenBySymbol',
        false,
        500,
      );
    }
  };
}
