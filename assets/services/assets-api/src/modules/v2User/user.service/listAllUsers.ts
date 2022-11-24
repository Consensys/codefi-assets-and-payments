import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import {
  TokenIdentifierEnum,
  WorkflowInstanceEnum,
} from 'src/old/constants/enum';

// APIs
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import { Link, LinkState } from 'src/types/workflow/workflowInstances/link';

import { UserRetrievalService } from './retrieveUser';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import { LinkService } from 'src/modules/v2Link/link.service';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  checkLinkStateValidForUserType,
  checkIfLinkedToAssetClassOrToken,
} from 'src/utils/checks/links';
import { NestJSPinoLogger } from '@consensys/observability';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { WorkflowInstanceService } from 'src/modules/v2WorkflowInstance/workflow.instance.service';
import { ConfigService } from 'src/modules/v2Config/config.service';

// Types
import { keys as ConfigKeys } from 'src/types/config';
import { FunctionRule, functionRules } from 'src/types/smartContract';
import { AssetType } from 'src/types/asset/template';
import { Action } from 'src/types/workflow/workflowInstances/action';
import { AssetDataKeys } from 'src/types/asset';
import { keys as ProjectKeys, Project } from 'src/types/project';
import {
  keys as LinkKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { EntityType } from 'src/types/entity';
import { keys as TokenKeys, Token, Aum } from 'src/types/token';
import { keys as UserKeys, User, UserType, EntityEnum } from 'src/types/user';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';
import web3Utils from 'web3-utils';

@Injectable()
export class UserListingService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly linkService: LinkService,
    private readonly userRetrievalService: UserRetrievalService,
    private readonly balanceService: BalanceService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly entityService: EntityService,
    private readonly workflowInstanceService: WorkflowInstanceService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * [List all users - sorted by user creation date]
   * Returns the list of all created users.
   *
   */
  async listAllUsers(
    tenantId: string,
    offset: number,
    limit: number,
    userTypes: Array<UserType>,
    withEntityLinks: boolean,
    entityType: EntityType,
    linkStates: Array<string>,
  ): Promise<{ users: Array<User>; total: number }> {
    try {
      if (
        entityType !== EntityType.PLATFORM &&
        entityType !== EntityType.ISSUER
      ) {
        ErrorService.throwError(
          `shall never happen: invalid entityType (${entityType}). entityType shall be chosen amongst ${EntityType.PLATFORM} and ${EntityType.ISSUER}, otherwise we have no guarantee the link is unique`,
        );
      }

      // Fetch users
      const allUsers: Array<User> =
        userTypes?.length > 0
          ? await this.apiEntityCallService.fetchFilteredEntities(
              tenantId,
              EntityEnum.userTypes,
              JSON.stringify(userTypes),
              true, // includeWallets
            )
          : await this.apiEntityCallService.fetchEntities(
              tenantId,
              {}, // filter
              true, // includeWallets
            );
      let slicedUsersWithLinks: Array<User>;
      let totalFilteredUsers: number;
      if (linkStates) {
        // ==> If linkStates are defined, we need to filter by linkState before paginating

        // Fetch user links [This piece of code is time-consuming - but we've got no other choice for now]
        const userIds: Array<string> = allUsers.map(
          (user: User) => user[UserKeys.USER_ID],
        );
        /********
         * When BATCH_SIZE > 175, the requests to fetch workflow instances fail with status code 431, which means the size of the request is too big
         ********/
        const BATCH_SIZE = 150;
        const nbBatches =
          Math.floor(userIds.length / BATCH_SIZE) +
          (userIds.length % BATCH_SIZE > 0 ? 1 : 0);
        const userBatches: Array<Array<string>> = [];
        for (let index = 0; index < nbBatches; index++) {
          userBatches.push([]);
        }
        for (let index = 0; index < userIds.length; index++) {
          const userBatchesIndex: number = Math.floor(index / BATCH_SIZE);
          userBatches[userBatchesIndex].push(userIds[index]);
        }
        this.logger.info(
          `Fetch ${Math.floor(
            userIds.length / BATCH_SIZE,
          )} batche(s) of ${BATCH_SIZE} links ${
            userIds.length % BATCH_SIZE > 0
              ? ` + 1 batch of ${
                  userBatches[userBatches.length - 1].length
                } links`
              : ''
          }`,
        );
        const allLinksBatches: Array<Array<Link>> = await Promise.all(
          userBatches.map((userBatch: Array<string>) =>
            this.workflowService.retrieveWorkflowInstances(
              tenantId,
              WorkflowInstanceEnum.entityTypeAndUserIds,
              undefined, // userEntityLinkId
              undefined, // idempotencyKey
              userBatch, // userId
              undefined, // entityId
              undefined, // objectId
              entityType, // entityType
              WorkflowType.LINK,
              undefined, // otherWorkflowType
              false,
            ),
          ),
        );
        const allLinks: Array<Link> = allLinksBatches.reduce(
          (a, b) => [...a, ...b],
          [],
        );
        this.logger.info(
          `Found ${allLinks.length} links for ${userIds.length} users`,
        );

        // Append links to users
        const linksObject: { [key: string]: Link } = {};
        allLinks.map((userEntityLink: Link) => {
          linksObject[userEntityLink[LinkKeys.USER_ID]] = userEntityLink;
        });
        const usersWithLinks: Array<User> = allUsers.map((user: User) => {
          return {
            ...user,
            [UserKeys.LINK]: linksObject[user[UserKeys.USER_ID]],
          };
        });

        // Filter users by linkState
        const filteredUsersWithLinks: Array<User> = usersWithLinks.filter(
          (user: User) => {
            if (linkStates.includes(LinkState.NONE) && !user[UserKeys.LINK]) {
              return true;
            } else if (
              user[UserKeys.LINK] &&
              user[UserKeys.LINK][LinkKeys.STATE] &&
              linkStates.includes(user[UserKeys.LINK][LinkKeys.STATE])
            ) {
              return true;
            }
            return false;
          },
        );

        // Paginate users filtered by linkState
        slicedUsersWithLinks = filteredUsersWithLinks.slice(
          offset,
          Math.min(offset + limit, allUsers.length),
        );

        totalFilteredUsers = filteredUsersWithLinks.length;
      } else {
        // ==> If linkStates are not defined, we can paginate before fetching links (more efficient)

        // Paginate users
        const slicedUsers: Array<User> = allUsers.slice(
          offset,
          Math.min(offset + limit, allUsers.length),
        );

        // Fetch user links
        let allLinks: Array<Link>;
        const linksObject: { [key: string]: Link } = {};
        if (withEntityLinks && slicedUsers.length > 0) {
          const slicedUserIds: Array<string> = slicedUsers.map(
            (user: User) => user[UserKeys.USER_ID],
          );
          allLinks = await this.workflowService.retrieveWorkflowInstances(
            tenantId,
            WorkflowInstanceEnum.entityTypeAndUserIds,
            undefined, // userEntityLinkId
            undefined, // idempotencyKey
            slicedUserIds, // userId
            undefined, // entityId
            undefined, // objectId
            entityType, // entityType
            WorkflowType.LINK,
            undefined, // otherWorkflowType
            false,
          );

          allLinks.map((userEntityLink: Link) => {
            linksObject[userEntityLink[LinkKeys.USER_ID]] = userEntityLink;
          });
        }

        // Append links to users
        slicedUsersWithLinks = withEntityLinks
          ? slicedUsers.map((user: User) => {
              return {
                ...user,
                [UserKeys.LINK]: linksObject[user[UserKeys.USER_ID]],
              };
            })
          : slicedUsers;

        totalFilteredUsers = allUsers.length;
      }

      return {
        users: slicedUsersWithLinks,
        total: totalFilteredUsers,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all users',
        'listAllUsers',
        false,
        500,
      );
    }
  }

  /**
   * [List all users linked to the issuer - sorted by user creation date]
   * Returns the list of all users linked to the issuer + the associated link.
   */
  async listAllUsersLinkedToIssuer(
    tenantId: string,
    issuerId: string,
    offset: number,
    limit: number,
    userTypes: Array<UserType>,
    linkStates: Array<string>,
  ): Promise<{ users: Array<User>; total: number }> {
    try {
      // Fetch user-issuer links
      const allUserIssuerLinks: Array<Link> =
        await this.linkService.listAllEntityLinks(
          tenantId,
          issuerId, // entityId
          EntityType.ISSUER, // entityType
        );

      if (allUserIssuerLinks.length === 0) {
        return {
          users: [],
          total: 0,
        };
      }

      // Filter links by linkState
      const filteredUserIssuerLinks: Array<Link> = linkStates
        ? allUserIssuerLinks.filter((userIssuerLink: Link) => {
            return linkStates.includes(userIssuerLink[LinkKeys.STATE]);
          })
        : allUserIssuerLinks;

      if (!userTypes) {
        // Paginate links filtered by linkState
        const slicedUserIssuerLinks: Array<Link> =
          filteredUserIssuerLinks.slice(
            offset,
            Math.min(offset + limit, filteredUserIssuerLinks.length),
          );

        // Fetch users
        const userIds: Array<string> = slicedUserIssuerLinks.map(
          (userIssuerLink: Link) => {
            return userIssuerLink[LinkKeys.USER_ID];
          },
        );
        const users: Array<User> =
          await this.apiEntityCallService.fetchEntitiesBatch(
            tenantId,
            userIds,
            true, // includeWallets
          );

        // Append links to users
        const linksObject: { [key: string]: Link } = {};
        slicedUserIssuerLinks.map((userIssuerLink: Link) => {
          linksObject[userIssuerLink[LinkKeys.USER_ID]] = userIssuerLink;
        });
        const slicedUsersWithLinks: Array<User> = users.map((user: User) => {
          return {
            ...user,
            [UserKeys.LINK]: linksObject[user[UserKeys.USER_ID]],
          };
        });

        return {
          users: slicedUsersWithLinks,
          total: filteredUserIssuerLinks.length,
        };
      }
      // Fetch users
      const userIds: Array<string> = filteredUserIssuerLinks.map(
        (userIssuerLink: Link) => {
          return userIssuerLink[LinkKeys.USER_ID];
        },
      );
      const users: Array<User> =
        await this.apiEntityCallService.fetchEntitiesBatch(
          tenantId,
          userIds,
          true, // includeWallets
        );
      const filteredUsers: Array<User> = users.filter((user: User) => {
        return userTypes.includes(user[UserKeys.USER_TYPE]);
      });

      // Paginate users filtered by userType & linkState
      const slicedUsers: Array<User> = filteredUsers.slice(
        offset,
        Math.min(offset + limit, filteredUsers.length),
      );

      // Append links to users
      const linksObject: { [key: string]: Link } = {};
      filteredUserIssuerLinks.map((userIssuerLink: Link) => {
        linksObject[userIssuerLink[LinkKeys.USER_ID]] = userIssuerLink;
      });
      const slicedUsersWithLinks: Array<User> = slicedUsers.map(
        (user: User) => {
          return {
            ...user,
            [UserKeys.LINK]: linksObject[user[UserKeys.USER_ID]],
          };
        },
      );

      return {
        users: slicedUsersWithLinks,
        total: filteredUsers.length,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all users linked to issuer',
        'listAllUsersLinkedToIssuer',
        false,
        500,
      );
    }
  }

  /**
   * [List all investors linked to the third party (verifier | notary | nav manager | broker)]
   * Returns the list of all investors linked to the third party + the associated link.
   */
  async listAllInvestorsLinkedToThirdParty(
    tenantId: string,
    thirdPartyId: string,
    offset: number,
    limit: number,
    thirdPartyType: UserType,
    userTypes: Array<UserType>,
    linkStates: Array<string>,
  ): Promise<{ users: Array<User>; total: number }> {
    try {
      if (
        thirdPartyType !== UserType.VERIFIER &&
        thirdPartyType !== UserType.NOTARY &&
        thirdPartyType !== UserType.UNDERWRITER &&
        thirdPartyType !== UserType.BROKER &&
        thirdPartyType !== UserType.AGENT
      ) {
        ErrorService.throwError(
          `invalid userType for a third party (${thirdPartyType})`,
        );
      }

      // Fetch thirdParty-entity links
      const allThirdPartyEntityLinks: Array<Link> = (
        await this.linkService.listAllUserLinks(
          tenantId,
          thirdPartyId,
          thirdPartyType,
          undefined, // entityType
          undefined, // entityId
          undefined, // assetClass
          undefined, // offset
          undefined, // limit
          true, // withMetadata
        )
      ).links;
      // For each entity linked to third party, fetch user-entity links
      const allUserEntityLinks: Array<Array<Link>> = await Promise.all(
        allThirdPartyEntityLinks.map((link: Link) => {
          return this.linkService.listAllEntityLinks(
            tenantId,
            link[LinkKeys.ENTITY_ID],
            link[LinkKeys.ENTITY_TYPE],
          );
        }),
      );
      // Merge all user-entity links
      const allUserEntityLinksAsArray: Array<Link> = allUserEntityLinks.reduce(
        (a: Array<Link>, b: Array<Link>) => {
          return [...a, ...b];
        },
        [],
      );

      // Filter investor-entity links
      let allInvestorEntityLinks: Array<Link> =
        allUserEntityLinksAsArray.filter((userEntityLink: Link) => {
          return checkLinkStateValidForUserType(
            userEntityLink[LinkKeys.STATE],
            UserType.INVESTOR,
            userEntityLink[LinkKeys.ENTITY_TYPE],
          );
        });

      // For BROKER, filtering out investors that were not onboarded by the broker.
      if (thirdPartyType === UserType.BROKER) {
        allInvestorEntityLinks = allInvestorEntityLinks.filter(
          (link) => link[LinkKeys.BROKER_ID] === thirdPartyId,
        );
      }

      // Filter links by linkState
      const filteredInvestorEntityLinks: Array<Link> = linkStates
        ? allInvestorEntityLinks.filter((investorEntityLink: Link) => {
            return linkStates.includes(investorEntityLink[LinkKeys.STATE]);
          })
        : allInvestorEntityLinks;

      // Create links map
      //  CAUTION: keep in mind that there can be multiple links for a given investor (he can potentially
      //  be linked to 2 different tokens controller by the same third party), which means some links
      //  are potentially overridden in the mapping process.
      const linksMap: {
        [userId: string]: Link;
      } = filteredInvestorEntityLinks.reduce(
        (map, investorEntityLink: Link) => ({
          ...map,
          [investorEntityLink[LinkKeys.USER_ID]]: investorEntityLink,
        }),
        {},
      );

      // Fetch investors
      const investorIds: Array<string> = Object.keys(linksMap);

      const investors: Array<User> =
        await this.apiEntityCallService.fetchEntitiesBatch(
          tenantId,
          investorIds,
          true, // includeWallets
        );

      const filteredInvestors: Array<User> = userTypes
        ? investors.filter((user: User) => {
            return userTypes.includes(user[UserKeys.USER_TYPE]);
          })
        : investors;

      // Paginate investors
      const slicedUsers: Array<User> = filteredInvestors.slice(
        offset,
        Math.min(offset + limit, filteredInvestors.length),
      );

      // Append links to users
      const slicedFilteredInvestorsWithLinks: Array<User> = slicedUsers.map(
        (investor: User) => {
          return {
            ...investor,
            [UserKeys.LINK]: linksMap[investor[UserKeys.USER_ID]],
          };
        },
      );

      return {
        users: slicedFilteredInvestorsWithLinks,
        total: filteredInvestors.length,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all investors linked to third party',
        'listAllInvestorsLinkedToThirdParty',
        false,
        500,
      );
    }
  }

  /**
   * [List all users linked to the investor]
   * Returns the list of all users linked to the investor + the associated link.
   */
  async listAllIssuersLinkedToUser(
    tenantId: string,
    investorId: string,
    offset: number,
    limit: number,
  ): Promise<{ users: Array<User>; total: number }> {
    try {
      // Fetch investor-issuer links
      const investorIssuerLinksResponse: {
        links: Array<Link>;
        total: number;
      } = await this.linkService.listAllUserLinks(
        tenantId,
        investorId,
        UserType.INVESTOR,
        EntityType.ISSUER, // entityType
        undefined, // entityId
        undefined, // assetClass
        offset, // offset
        limit, // limit
        true, // withMetadata
      );
      const slicedInvestorIssuerLinks: Array<Link> =
        investorIssuerLinksResponse.links;

      // Fetch issuers
      const issuerIds: Array<string> = slicedInvestorIssuerLinks.map(
        (investorIssuerLink: Link) => {
          return investorIssuerLink[LinkKeys.ENTITY_ID];
        },
      );
      const issuers: Array<User> =
        await this.apiEntityCallService.fetchEntitiesBatch(
          tenantId,
          issuerIds,
          true, // includeWallets
        );

      // Append links to users
      const linksObject: { [key: string]: Link } = {};
      slicedInvestorIssuerLinks.map((investorIssuerLink: Link) => {
        linksObject[investorIssuerLink[LinkKeys.ENTITY_ID]] =
          investorIssuerLink;
      });
      const slicedIssuersWithLinks: Array<User> = issuers.map(
        (issuer: User) => {
          return {
            ...issuer,
            [UserKeys.LINK]: linksObject[issuer[UserKeys.USER_ID]],
          };
        },
      );

      return {
        users: slicedIssuersWithLinks,
        total: investorIssuerLinksResponse.total,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all issuers linked to user',
        'listAllIssuersLinkedToUser',
        false,
        500,
      );
    }
  }

  private async retrieveTokenByUserAndTokenId({
    tenantId,
    user,
    tokenId,
  }: {
    tenantId: string;
    user: User;
    tokenId: string;
  }): Promise<Token> {
    // In the case of a Syndicated Loan or enableMarketplace has been enabled, investors can retrieve list of all token's investors
    // For all other types of assets, only issuers can retrieve list of all token's investors
    const config = await this.configService.retrieveTenantConfig(tenantId);

    const enableMarketplace =
      config[ConfigKeys.DATA][ConfigKeys.DATA__ENABLE_MARKETPLACE];

    if (user[UserKeys.USER_TYPE] === UserType.ISSUER) {
      // ISSUER is allowed to retrieve list of investors (no problem)
      const [, , token] = await this.entityService.retrieveEntityIfAuthorized(
        tenantId,
        user[UserKeys.USER_ID],
        'list all investors linked to token',
        tokenId,
        EntityType.TOKEN,
      );

      return token;
    }

    // By default users which are not ISSUERs are not allowed to retrieve list of investors (except for syndicated loans)
    const token = await this.apiMetadataCallService.retrieveTokenInDB(
      tenantId,
      TokenIdentifierEnum.tokenId,
      tokenId,
      true,
      undefined,
      undefined,
      true,
    );

    const assetType: AssetType =
      token?.[TokenKeys.ASSET_DATA]?.[AssetDataKeys.TYPE];

    if (assetType !== AssetType.SYNDICATED_LOAN && !enableMarketplace) {
      // Syndicated loans are an edge case, where even investors are allowed to retrieve the list of investors
      ErrorService.throwError(
        `User of type ${
          user[UserKeys.USER_TYPE]
        } is not allowed to retrieve list of investors (only an ${
          UserType.ISSUER
        } is allowed to do so)`,
      );
    }

    return token;
  }

  private async warmSuppliesAndBalancesForUserTokenLinksInMemoryCache({
    tenantId,
    callerId,
    token,
    investorTokenLinks,
    investorIdsSet,
  }: {
    tenantId: string;
    callerId: string;
    token: Token;
    investorTokenLinks: Array<Link>;
    investorIdsSet: Set<string>;
  }): Promise<void> {
    // Optional - pre-list all token information and store them in cache (only for hybrid tokens)
    await this.balanceService.preListSuppliesForTokens(tenantId, callerId, [
      token,
    ]);

    // Optional - slice links (otherwise we would fetch a too important amount of balances)
    const investorAssetClassLinks: Array<Link> = investorTokenLinks.filter(
      (investorAssetClassLink: Link) =>
        investorIdsSet.has(investorAssetClassLink[LinkKeys.USER_ID]),
    );

    // Optional - pre-list all token balances and store them in cache
    await this.balanceService.preListBalancesForUserTokenLinks(
      tenantId,
      callerId,
      [token],
      investorAssetClassLinks,
    );
  }

  private getFullUser({
    token,
    ...fullUserOptions
  }: {
    tenantId: string;
    callerId: string;
    userId: string;
    token: Token;
    entityType: EntityType;
    assetClassKey?: string;
    withVehicles?: boolean;
    withBalances?: boolean;
  }): Promise<User | undefined> {
    return this.userRetrievalService.retrieveFullUser({
      ...fullUserOptions,
      entityId: token[TokenKeys.TOKEN_ID],
    });
  }

  private filterInvestorTokenLinks(
    allUserTokenLinks: Array<Link>,
    user: User,
    assetClassKey: string,
  ): Array<Link> {
    return allUserTokenLinks.filter((userTokenLink: Link) => {
      // Filter investor-token links
      const isLinkStateValidForUserType = checkLinkStateValidForUserType(
        userTokenLink[LinkKeys.STATE],
        UserType.INVESTOR,
        userTokenLink[LinkKeys.ENTITY_TYPE],
      );

      if (user[UserKeys.USER_TYPE] === UserType.BROKER) {
        // Broker filter: If the caller is a broker, make sure the link contains the correct brokerId
        return (
          isLinkStateValidForUserType &&
          userTokenLink[LinkKeys.BROKER_ID] === user[UserKeys.USER_ID]
        );
      }

      // Filter links for asset class (when relevant)
      const isLinkedToAssetClassOrToken = checkIfLinkedToAssetClassOrToken(
        userTokenLink,
        assetClassKey,
      );

      return isLinkStateValidForUserType && isLinkedToAssetClassOrToken;
    });
  }

  /**
   * [List all investors linked to the token]
   *
   * This function is used to retrieve a token's investors in Metadata DB by:
   * 1) retrieving the list of user-entity-links for the token.
   * 2) Filtering the user-entity-link to retrieve the token's investors IDs.
   * 3) retrieving the investors in Metadata DB thanks to the investors IDs.
   *
   */
  async listAllInvestorsLinkedToToken(investorsLinkedToTokenOptions: {
    tenantId: string;
    callerId: string;
    user: User;
    tokenId: string;
    offset: number;
    limit: number;
    assetClassKey?: string;
    withVehicles?: boolean;
    withBalances?: boolean;
    withSearch?: string;
  }): Promise<{
    investors: Array<User>;
    total: number;
  }> {
    try {
      const {
        tenantId,
        callerId,
        user,
        tokenId,
        offset,
        limit,
        withSearch,
        ...InvestorsTokenfilters
      } = investorsLinkedToTokenOptions;

      const token = await this.retrieveTokenByUserAndTokenId({
        tenantId,
        user,
        tokenId,
      });

      // if withSearch is provided, get filtered users before obtaining their token links
      let queriedUsers: User[] = [];
      if (withSearch) {
        const filter = {
          [web3Utils.isAddress(withSearch) ? 'defaultWallet' : 'name']:
            withSearch,
        };
        queriedUsers = await this.apiEntityCallService.fetchEntities(
          tenantId,
          filter,
          false,
        );
      }

      // Fetch user-token links
      const allUserTokenLinks: Array<Link> =
        await this.linkService.listAllEntityLinks(
          tenantId,
          token[TokenKeys.TOKEN_ID], // entityId
          EntityType.TOKEN, // entityType
          queriedUsers.length ? queriedUsers.map((user) => user.id) : undefined,
        );

      if (allUserTokenLinks.length === 0) {
        return {
          investors: [],
          total: 0,
        };
      }

      const investorTokenLinks: Array<Link> = this.filterInvestorTokenLinks(
        allUserTokenLinks,
        user,
        InvestorsTokenfilters.assetClassKey,
      );

      // We extract IDs by taking care of deduplicating them.
      // Indeed, in the case, where a user is both linked to a token overall + to an
      // asset class, there will be 2 links between him and the token.
      const investorIdsSet: Set<string> = new Set();

      investorTokenLinks.forEach((investorAssetClassLink: Link) => {
        investorIdsSet.add(investorAssetClassLink[LinkKeys.USER_ID]);
      });

      const paginate = <T>(investors: T[]): T[] =>
        [...investors].slice(
          offset,
          Math.min(offset + limit, investors.length),
        );

      if (InvestorsTokenfilters.withBalances) {
        await this.warmSuppliesAndBalancesForUserTokenLinksInMemoryCache({
          tenantId,
          callerId,
          token,
          investorTokenLinks,
          investorIdsSet,
        });
      }

      const slicedInvestorIds = paginate([...investorIdsSet]);

      // For each user, retrieve user infos
      const investorsList: Array<User> = await Promise.all(
        slicedInvestorIds.map((userId: string) =>
          this.getFullUser({
            tenantId,
            callerId,
            userId,
            token,
            entityType: EntityType.TOKEN,
            ...InvestorsTokenfilters,
          }),
        ),
      );

      return {
        investors: investorsList,
        total: investorIdsSet.size,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all investors linked to token',
        'listAllInvestorsLinkedToToken',
        false,
        500,
      );
    }
  }

  /**
   * [List all token aum]
   */
  async listAllTokenAum(
    tenantId: string,
    user: User,
    tokenId: string,
  ): Promise<{
    aums: Array<Aum>;
    total: number;
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
          undefined, // TODO: V2 filters
        );

      const aums: Array<Aum> = [];
      let prevPrice = 0;
      let prevQuantity = 0;
      let prevDate = '';
      allTokenActions
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        .forEach((action: Action) => {
          const priceImpact = functionRules[action.name]
            ? functionRules[action.name][FunctionRule.PRICE_IMPACT]
            : 0;
          const newQuantity = prevQuantity + action.quantity * priceImpact;
          const newPrice = prevPrice + action.price * priceImpact;
          const actionDate = new Date(action.createdAt)
            .toISOString()
            .split('T')[0];
          if (prevDate === actionDate) {
            aums[aums.length - 1].price = newPrice;
            aums[aums.length - 1].quantity = newQuantity;
          } else {
            aums.push({
              t: new Date(actionDate),
              price: newPrice,
              quantity: newQuantity,
            });
          }

          prevPrice = newPrice;
          prevQuantity = newQuantity;
          prevDate = actionDate;
        });

      return {
        aums,
        total: aums.length,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all investors linked to token',
        'listAllTokenAum',
        false,
        500,
      );
    }
  }

  /**
   * [List all investors linked to the project]
   *
   * This function is used to retrieve a project's investors in Metadata DB by:
   * 1) retrieving the list of user-entity-links for the project.
   * 2) Filtering the user-entity-link to retrieve the project's investors IDs.
   * 3) retrieving the investors in Metadata DB thanks to the investors IDs.
   *
   */
  async listAllInvestorsLinkedToProject(
    tenantId: string,
    offset: number,
    limit: number,
    project: Project,
    withVehicles: boolean,
  ): Promise<{
    investors: Array<User>;
    total: number;
  }> {
    try {
      // Fetch user-project links
      const allUserProjectLinks: Array<Link> =
        await this.linkService.listAllEntityLinks(
          tenantId,
          project[ProjectKeys.PROJECT_ID], // entityId
          EntityType.PROJECT, // entityType
        );

      if (allUserProjectLinks.length === 0) {
        return {
          investors: [],
          total: 0,
        };
      }

      // Filter investor-project links
      const investorProjectLinks: Array<Link> = allUserProjectLinks.filter(
        (userProjectLink: Link) => {
          return checkLinkStateValidForUserType(
            userProjectLink[LinkKeys.STATE],
            UserType.INVESTOR,
            userProjectLink[LinkKeys.ENTITY_TYPE],
          );
        },
      );

      // We extract IDs by taking care of deduplicating them (even though duplicated links shall never happen for projects).
      const investorIds: Array<string> = [];
      investorProjectLinks.map((investorProjectLink: Link) => {
        const currentInvestorId = investorProjectLink[LinkKeys.USER_ID];
        if (investorIds.indexOf(currentInvestorId) < 0) {
          investorIds.push(currentInvestorId);
        }
      });

      const slicedInvestorIds: Array<string> = investorIds.slice(
        offset,
        Math.min(offset + limit, investorIds.length),
      );

      // For each user, retrieve user infos
      const investorsList: Array<User> = await Promise.all(
        slicedInvestorIds.map((investorId: string) => {
          return this.userRetrievalService.retrieveFullUser({
            tenantId,
            userId: investorId,
            entityId: project[ProjectKeys.PROJECT_ID],
            entityType: EntityType.PROJECT,
            withVehicles,
          });
        }),
      );

      return {
        investors: investorsList,
        total: investorIds.length,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all investors linked to project',
        'listAllInvestorsLinkedToProject',
        false,
        500,
      );
    }
  }

  /**
   * [List all users linked to the entity]
   *
   * This function is used to retrieve users of a given type linked to an entity in Metadata DB by:
   * 1) retrieving the list of user-entity-links for the entity.
   * 2) Filtering the user-entity-link to keep only those of the correct type.
   * 3) retrieving the notaries in Metadata DB thanks to the user IDs.
   *
   */
  async listAllThirdPartiesLinkedToEntity(
    tenantId: string,
    userType: UserType,
    entityId: string,
  ): Promise<Array<User>> {
    try {
      // Fetch user-entity links
      const allUserEntityLinks: Array<Link> =
        await this.linkService.listAllEntityLinks(
          tenantId,
          entityId, // entityId
          undefined, // entityType
        );

      if (allUserEntityLinks.length === 0) {
        return [];
      }

      const filteredThirdPartyEntityLinks: Array<Link> =
        allUserEntityLinks.filter((thirdPartyEntityLink: Link) => {
          return checkLinkStateValidForUserType(
            thirdPartyEntityLink[LinkKeys.STATE],
            userType,
            thirdPartyEntityLink[LinkKeys.ENTITY_TYPE],
          );
        });

      // Fetch third parties
      const thirdPartiesIds: Array<string> = filteredThirdPartyEntityLinks.map(
        (thirdPartyEntityLink: Link) => {
          return thirdPartyEntityLink[LinkKeys.USER_ID];
        },
      );
      const thirdParties: Array<User> =
        await this.apiEntityCallService.fetchEntitiesBatch(
          tenantId,
          thirdPartiesIds,
          true, // includeWallets
        );
      const filteredThirdParties: Array<User> = thirdParties.filter(
        (user: User) => user[UserKeys.USER_TYPE] === userType,
      );

      // Append links to users
      const linksObject: { [key: string]: Link } = {};
      filteredThirdPartyEntityLinks.map((thirdPartyEntityLink: Link) => {
        linksObject[thirdPartyEntityLink[LinkKeys.USER_ID]] =
          thirdPartyEntityLink;
      });
      const thirdPartiesWithLinks: Array<User> = filteredThirdParties.map(
        (user: User) => {
          return {
            ...user,
            [UserKeys.LINK]: linksObject[user[UserKeys.USER_ID]],
          };
        },
      );

      return thirdPartiesWithLinks;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all third parties linked to entity',
        'listAllThirdPartiesLinkedToEntity',
        false,
        500,
      );
    }
  }
}
