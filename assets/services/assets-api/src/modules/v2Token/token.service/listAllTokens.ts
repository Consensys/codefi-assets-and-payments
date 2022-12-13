import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import {
  WorkflowInstanceEnum,
  TokenIdentifierEnum,
} from 'src/old/constants/enum';

import { keys as UserKeys, User, UserType } from 'src/types/user';
import { Link } from 'src/types/workflow/workflowInstances/link';

import { EntityType } from 'src/types/entity';
import { keys as TokenKeys, Token } from 'src/types/token';

import { TokenRetrievalService } from './retrieveToken';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  keys as LinkKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import { NestJSPinoLogger } from '@consensys/observability';
import { LinkService } from 'src/modules/v2Link/link.service';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { Config } from 'src/types/config';
import { isTokenDiscoveryEnabledCheck } from 'src/utils/utils';
@Injectable()
export class TokenListingService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly tokenRetrievalService: TokenRetrievalService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly balanceService: BalanceService,
    private readonly linkService: LinkService,
    private readonly configService: ConfigService,
  ) {
    logger.setContext(TokenListingService.name);
  }

  /**
   * [List all tokens linked to a specifif user according to it's user ID]
   */
  async listAllFullTokensAsUser(
    tenantId: string,
    callerId: string,
    user: User,
    offset: number,
    limit: number,
    investorId: string,
    withBalances: boolean, // only available for one single investor (Reason: fetching balances takes too much time for multiple investors)
    withCycles: boolean,
    withSearch: string,
    deployed?: boolean,
  ): Promise<{
    tokens: Array<Token>;
    deletedTokenIds?: Array<string>;
    total: number;
  }> {
    try {
      const userType: UserType = user[UserKeys.USER_TYPE];

      // Fetch all user-token links
      const userTokenLinks: Array<Link> = (
        await this.linkService.listAllUserLinks(
          tenantId,
          user[UserKeys.USER_ID],
          user[UserKeys.USER_TYPE],
          EntityType.TOKEN, // entityType
          undefined, // entityId
          undefined, // assetClass
          undefined, // offset
          undefined, // limit
          false, // withMetadata
        )
      ).links;

      let tokensResponse: {
        tokens: Array<Token>;
        deletedTokenIds?: Array<string>;
        total: number;
      };

      if (
        userType === UserType.ISSUER ||
        userType === UserType.NOTARY ||
        userType === UserType.UNDERWRITER ||
        userType === UserType.BROKER ||
        userType === UserType.AGENT
      ) {
        if (!investorId) {
          tokensResponse = await this.listAllFullTokensAsUserBasedOnLinks(
            tenantId,
            callerId,
            offset,
            limit,
            userTokenLinks,
            user,
            withBalances,
            false, // formattedForIssuer
            withCycles,
            withSearch,
          );
        } else {
          // As the issuer, fetch tokens of a specific investor
          const investor: User = await this.apiEntityCallService.fetchEntity(
            tenantId,
            investorId,
            true,
          );

          const authorizedTokenIds: Array<string> = [];
          userTokenLinks.map((userTokenLink: Link) => {
            const currentTokenId = userTokenLink[LinkKeys.ENTITY_ID];
            if (authorizedTokenIds.indexOf(currentTokenId) < 0) {
              authorizedTokenIds.push(currentTokenId);
            }
          });

          // Fetch all investor's links
          const investorTokenLinks: Array<Link> =
            await this.workflowService.retrieveWorkflowInstances(
              tenantId,
              WorkflowInstanceEnum.entityTypeAndUserId,
              undefined, // userEntityLinkId
              undefined, // idempotencyKey
              investor[UserKeys.USER_ID],
              undefined, // entityId
              undefined, // objectId
              EntityType.TOKEN, // entityType
              WorkflowType.LINK,
              undefined, // otherWorkflowType
              false,
            );

          // Filter tokens to keep only those which are authorized for the user calling the endpoint
          const authorizedInvestorTokenLinks: Array<Link> =
            investorTokenLinks.filter((investorTokenLink: Link) => {
              return (
                authorizedTokenIds.indexOf(
                  investorTokenLink[LinkKeys.ENTITY_ID],
                ) >= 0
              );
            });

          // Broker filter: If the caller is a broker, make sure the link contains the correct brokerId
          const authorizedInvestorTokenLinks2: Array<Link> =
            userType === UserType.BROKER
              ? investorTokenLinks.filter(
                  (authorizedInvestorTokenLink: Link) => {
                    return (
                      authorizedInvestorTokenLink[LinkKeys.BROKER_ID] ===
                      user[UserKeys.USER_ID]
                    );
                  },
                )
              : authorizedInvestorTokenLinks;

          tokensResponse = await this.listAllFullTokensAsUserBasedOnLinks(
            tenantId,
            callerId,
            offset,
            limit,
            authorizedInvestorTokenLinks2,
            investor,
            withBalances,
            true, // formattedForIssuer
            withCycles,
          );
        }
      } else if (userType === UserType.INVESTOR) {
        tokensResponse = await this.listAllFullTokensAsUserBasedOnLinks(
          tenantId,
          callerId,
          offset,
          limit,
          userTokenLinks,
          user,
          withBalances,
          false, // formattedForIssuer
          withCycles,
          undefined, //with search
          deployed,
        );
      } else {
        ErrorService.throwError(`invalid user type: ${userType}`);
      }

      return tokensResponse;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all full tokens',
        'listAllFullTokensAsUser',
        false,
        500,
      );
    }
  }

  /**
   * [List all full tokens as admin]
   */
  async listAllFullTokensAsAdmin(
    tenantId: string,
    callerId: string,
    offset: number,
    limit: number,
    withCycles: boolean,
  ): Promise<{ tokens: Array<Token>; total: number }> {
    try {
      const tokensResponse =
        await this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.all,
          undefined, // tokenKey
          false, // shallReturnSingleToken
          offset,
          limit,
          false,
        );

      const tokensList: Array<Token> = await Promise.all(
        tokensResponse.tokens
          .map((rawToken: Token) => {
            return this.tokenRetrievalService
              .retrieveFullToken(
                tenantId,
                callerId,
                rawToken,
                undefined, // assetClassKey
                true, // withIssuer
                false, // withNotaries
                false, // withSingleUserDetail
                undefined, // singleUser
                false, // withVehicles
                false, // withBalances (On-chain data can not be pre-fetched without links)
                false, // withEthBalance
                withCycles,
                false, // formattedForIssuer
              )
              .catch((error) => {
                this.logger.error('Failed to retrieve full token', error);
                return null;
              });
          })
          .filter((token) => !!token),
      );

      return {
        tokens: tokensList,
        total: tokensResponse.total,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all full tokens as admin',
        'listAllFullTokensAsAdmin',
        false,
        500,
      );
    }
  }

  /**
   * [List all tokens based on links]
   */
  async listAllFullTokensAsUserBasedOnLinks(
    tenantId: string,
    callerId: string,
    offset: number,
    limit: number,
    userTokenLinks: Array<Link>,
    user: User,
    withBalances: boolean,
    formattedForIssuer: boolean,
    withCycles: boolean,
    withSearch?: string,
    deployed?: boolean,
  ): Promise<{
    tokens: Array<Token>;
    deletedTokenIds: Array<string>;
    total: number;
  }> {
    try {
      // We extract IDs by taking care of deduplicating them.
      // Indeed, in the case, where a user is both linked to a token overall + to an
      // asset class, there will be 2 links between him and the token.
      // Ex:
      // - an UNDERWRITER has been validated for a token
      // - an UNDERWRITER has been invited for the asset class of a token
      const tokenIds: Array<string> = [];
      const config: Config = await this.configService.retrieveTenantConfig(
        tenantId,
      );

      // deployed is set to true when we want to display to the investor all tokens deployed
      // and not just the ones he is linked to.
      if (isTokenDiscoveryEnabledCheck(config) && deployed) {
        const tokensResponse =
          await this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.all,
            undefined, // tokenKey
            false, // shallReturnSingleToken
            undefined,
            undefined,
            false,
          );
        tokensResponse.tokens = tokensResponse.tokens.filter((token: Token) => {
          return (
            token[TokenKeys.DATA][TokenKeys.DATA__NEXT_STATUS] == 'deployed'
          );
        });

        tokensResponse.tokens.forEach((token: Token) => {
          const currentTokenId = token[TokenKeys.TOKEN_ID];
          if (tokenIds.indexOf(currentTokenId) < 0) {
            tokenIds.push(currentTokenId);
          }
        });
      } else {
        // else do the regular flow
        userTokenLinks.map((userTokenLink: Link) => {
          const currentTokenId = userTokenLink[LinkKeys.ENTITY_ID];
          if (tokenIds.indexOf(currentTokenId) < 0) {
            tokenIds.push(currentTokenId);
          }
        });
      }

      const slicedTokenIds: Array<string> = tokenIds.slice(
        offset,
        Math.min(offset + limit, tokenIds.length),
      );

      // Retrieve raw tokens (as they are stored in database)
      const rawTokensList: Array<Token> =
        await this.apiMetadataCallService.retrieveTokensBatchInDB(
          tenantId,
          slicedTokenIds,
          true,
          withSearch,
        );
      if (withSearch) {
        const total = rawTokensList.pop() as unknown as number;
        return {
          tokens: rawTokensList[0] as unknown as Array<Token>,
          deletedTokenIds: [],
          total,
        };
      }

      const rawTokensMap: { [key: string]: Token } = {};
      rawTokensList.map((token: Token) => {
        // Create token map
        rawTokensMap[token[TokenKeys.TOKEN_ID]] = token;
      });

      // Optional - pre-list all token information and store them in cache (only for hybrid tokens)
      await this.balanceService.preListSuppliesForTokens(
        tenantId,
        callerId,
        rawTokensList,
      );

      // Optional - pre-list all user balances and store them in cache
      if (withBalances) {
        await this.balanceService.preListBalancesForUserTokenLinks(
          tenantId,
          callerId,
          rawTokensList,
          userTokenLinks,
        );
      }

      const deletedTokenIds: Array<string> = []; // This array shall always be empty. If it includes a tokenId, it means the token's been deleted from Metadata-Api, but the links pointing to it failed to be deleted.
      const tokensList: Array<Token> = (
        await Promise.all(
          slicedTokenIds.map((tokenId: string) => {
            const rawToken: Token = rawTokensMap[tokenId];
            if (!rawToken?.[TokenKeys.TOKEN_ID]) {
              deletedTokenIds.push(tokenId);
              this.logger.error(
                { tokenId },
                `shall never happen: token with id ${tokenId} was not found in DB with batch retrieval`,
              );
              return null;
            }
            return this.tokenRetrievalService
              .retrieveFullToken(
                tenantId,
                callerId,
                rawToken,
                undefined, // assetClassKey
                true, // withIssuer (even though no fully necessary, this allows the issuer to retrieve the address he's been using to deploy this token)
                true, // withNotaries
                true, // withSingleUserDetail (when user in an UNDERWRITER, he needs to retrieve his own balances, token actions, etc.)
                user, // singleUser
                false, // withVehicles
                withBalances,
                false, // withEthBalance
                withCycles,
                formattedForIssuer,
              )
              .catch((error) => {
                this.logger.error('Failed to retrieve full token', error);
                return null;
              });
          }),
        )
      ).filter((token) => !!token);
      return {
        tokens: tokensList,
        deletedTokenIds,
        total: tokenIds.length,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all full tokens based on links',
        'listAllFullTokensAsUserBasedOnLinks',
        false,
        500,
      );
    }
  }
}
