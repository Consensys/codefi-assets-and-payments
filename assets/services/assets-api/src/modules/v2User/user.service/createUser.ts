import { Injectable } from '@nestjs/common';

import { NestJSPinoLogger } from '@consensys/observability';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import ErrorService from 'src/utils/errorService';

import {
  TokenIdentifierEnum,
  ProjectEnum,
  TemplateEnum,
} from 'src/old/constants/enum';

import { LinkService } from 'src/modules/v2Link/link.service';

import {
  keys as UserKeys,
  UserNature,
  UserType,
  User,
  linkingFunctionForUserType,
  isE2eTestUserData,
  isAdministratorUserType,
  checkValidUserType,
  checkValidUserNature,
  EntityEnum,
} from 'src/types/user';
import { ApiAdminCallService } from 'src/modules/v2ApiCall/api.call.service/admin';
import { keys as TokenKeys, Token } from 'src/types/token';
import { CreateUserOutput, CreateInitialUsersOutput } from '../user.dto';
import { CreateLinkOutput } from 'src/types/workflow/workflowInstances/link';
import { EntityType } from 'src/types/entity';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { Wallet } from 'src/types/wallet';
import { UserVehiclesListingService } from './listAllUserVehicles';
import { KYCTemplateService } from 'src/modules/v2KYCTemplate/kyc.template.service';
import { keys as KycTemplateKeys } from 'src/types/kyc/template';
import { setToLowerCaseExceptFirstLetter } from 'src/utils/case';
import { checkEmailAddress } from 'src/utils/email';
import { FunctionName } from 'src/types/smartContract';
import { keys as LinkKeys } from 'src/types/workflow/workflowInstances';
import { sleep } from 'src/utils/sleep';
import { Project } from 'src/types/project';
import { DEFAULT_COMPANY_NAME, TenantType } from 'src/types/clientApplication';
import {
  Auth0User,
  craftAuth0TenantId,
  craftAuth0UserPassword,
} from 'src/types/authentication';
import { ConfigService } from '../../v2Config/config.service';
import { getTenantDataFromConfig } from 'src/utils/config';
import { keys as ConfigKeys, Config, TENANT_FLAG } from 'src/types/config';
import config from 'src/config';
import { NetworkService } from 'src/modules/v2Network/network.service';
import { keys as NetworkKeys } from 'src/types/network';
import { ApiKycCallService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';
import { getTenantRolesForUserType, rolesMatch } from 'src/utils/tenantRoles';
import { generateCode } from 'src/utils/codeGenerator';
import { EntityCreateRequest } from '@consensys/ts-types';

const domainName = config().domainName;
const defaultTenantId: string = config().defaultInitializationTenantId;
const defaultTenantShortAlias: string =
  config().defaultInitializationTenantShortAlias;
const superAdminEmail: string = config().superAdminEmail;
@Injectable()
export class UserCreationService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly kycTemplateService: KYCTemplateService,
    private readonly userVehiclesListingService: UserVehiclesListingService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly configService: ConfigService,
    private readonly networkService: NetworkService,
    private readonly apiKycCallService: ApiKycCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  /**
   * [Create user]
   *  - [OPTIONAL] _ctxStorage: key to store output in context (ctx) if required
   */
  async createUser(
    tenantId: string,
    email: string,
    firstName: string,
    lastName: string,
    authId: string, // Used to store the ID of the first auth0 user, created in Auth0
    userType: UserType,
    superUserId: string,
    userNature: UserNature,
    docuSignId: string,
    kycTemplateId: string,
    auth0UserCreate: boolean,
    auth0UserPassword: string,
    data: any,
  ): Promise<User> {
    try {
      let auth0User: Auth0User;

      if (authId) {
        // CASE 1: User already exists in Auth0
        auth0User = await this.apiAdminCallService.retrieveUsersInAuth0ById(
          tenantId, // no used for now
          authId,
        );
        if (!auth0User?.userId) {
          ErrorService.throwError(
            `invalid 'authId': user with authId ${authId} was not found in Auth0`,
          );
        }
      } else if (auth0UserCreate) {
        // CASE 2: User shall be created or retrieved in Auth0
        auth0User = await this.createOrRetrieveUserInAuth0(
          tenantId, // tenantId
          email,
          auth0UserPassword,
          firstName,
          lastName,
          getTenantRolesForUserType(userType),
          false, // auth0UserRetrieveIfExisting,
          isE2eTestUserData(data),
        );
      } else {
        // CASE 3: No user in Auth0
      }

      checkValidUserType(userType);
      checkValidUserNature(userNature);
      const entityCreateRequest: EntityCreateRequest = {
        name: `${firstName} ${lastName}`,
        metadata: {
          ...data,
          [UserKeys.AUTH_ID]: auth0User?.userId || undefined, // Optional, only required when there is a corresponding user in Auth0
          [UserKeys.FIRST_CONNECTION_CODE]: generateCode(), // Required when user signs up through Auth0 for the first time
          [UserKeys.SUPER_USER_ID]: superUserId, // Only required for vehicles
          [UserKeys.USER_TYPE]: userType,
          [UserKeys.USER_NATURE]: userNature,
          [UserKeys.EMAIL]: email,
          // [UserKeys.PHONE]: '', // Deprecated parameter to be removed
          // [UserKeys.PREFIX]: '', // Deprecated parameter to be removed
          [UserKeys.FIRST_NAME]: firstName ? firstName : 'FirstName',
          [UserKeys.LAST_NAME]: lastName ? lastName : 'LastName',
          // [UserKeys.WALLETS]: [],
          // [UserKeys.PICTURE]: '',
          [UserKeys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID]: docuSignId, // Deprecated parameter to be removed
          [UserKeys.DATA__KYC_TEMPLATE_ID]: kycTemplateId,
        },
      };

      const user: User = await this.apiEntityCallService.createEntity(
        tenantId,
        entityCreateRequest,
      );

      try {
        if (auth0User?.userId) {
          // If user exists in auth0, we shall add (tenantId, userId) in its metadata
          await this.apiAdminCallService.updateUserInAuth0ById(
            user[UserKeys.TENANT_ID],
            auth0User?.userId, // authId
            user[UserKeys.USER_ID],
            getTenantRolesForUserType(user[UserKeys.USER_TYPE]), // tenantRoles
          );
        }
      } catch (error) {
        // We have to delete the user in case the wallet creation failed (otherwise, it can not be recreated properly, because the email is already taken)
        this.logger.info(
          { error },
          `Wallet creation failed, ..deleting user with id ${
            user[UserKeys.USER_ID]
          } (error: ${error?.message})`,
        );
        await this.apiEntityCallService.deleteEntity(
          user[UserKeys.TENANT_ID],
          user[UserKeys.USER_ID],
        );
        this.logger.info(
          {},
          `User with id ${
            user[UserKeys.USER_ID]
          } deleted successfully after wallet creation problems`,
        );
      }

      return user;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating user',
        'createUser',
        false,
        500,
      );
    }
  }

  /**
   * [Create linked vehicle]
   *  - [OPTIONAL] _ctxStorage: key to store output in context (ctx) if required
   */
  async createLinkedVehicle(
    tenantId: string,
    firstName: string,
    lastName: string,
    superUserId: string,
    userNature: UserNature,
    projectId: string,
    tokenId: string,
    assetClassKey: string,
    data: any,
  ): Promise<CreateUserOutput> {
    try {
      const _userNature: UserNature = userNature
        ? userNature
        : UserNature.LEGAL;

      if (!superUserId) {
        ErrorService.throwError('missing input data (superUserId)');
      }

      const superUser: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        superUserId,
        true,
      );
      if (superUser.userType !== UserType.INVESTOR) {
        ErrorService.throwError(
          `cannot create vehicle for a user with type ${superUser.userType}`,
        );
      }

      const allVehicles: Array<User> =
        await this.userVehiclesListingService.listAllUsersVehicles(
          tenantId,
          superUserId,
        );

      let newUser = true;
      let vehicleUser: User;
      allVehicles.map((vehicle) => {
        if (vehicle.firstName === firstName && vehicle.lastName === lastName) {
          vehicleUser = vehicle;
          newUser = false;
        }
      });

      if (newUser) {
        vehicleUser = await this.createUser(
          tenantId,
          undefined, // email (not required for vehicles)
          firstName,
          lastName,
          undefined, // authId (ID of user in Auth0 - undefined here because a vehicle is not controlled by a user in Auth0)
          UserType.VEHICLE,
          superUserId,
          _userNature,
          undefined, // docuSignId (for issuers only)
          undefined, // kycTemplateId (for issuers only)
          false, // auth0UserCreate (vehicles have no user created in Auth0)
          undefined, // auth0UserPassword (only required if auth0UserCreate is set to 'true')
          data,
        );
      }

      let project: Project;
      if (projectId) {
        project = await this.apiMetadataCallService.retrieveProject(
          tenantId,
          ProjectEnum.projectId,
          projectId,
          true,
        );

        // Retrieve default wallet
        const wallet: Wallet = this.walletService.extractWalletFromUser(
          vehicleUser,
          undefined,
        );

        const linkResponse: CreateLinkOutput =
          await this.linkService.createUserEntityLinkIfRequired(
            tenantId,
            UserType.ISSUER, // Exception: not "typeFunctionUser" here because only an ISSUER shall be able to invite an investor, and "typeFunctionUser" = INVESTOR
            undefined, // idFunctionUser
            vehicleUser,
            FunctionName.KYC_INVITE,
            EntityType.PROJECT,
            project, // entityProject
            undefined, // entityIssuer
            undefined, // entityToken
            undefined, // assetClassKey
            wallet,
          );
        vehicleUser = {
          ...vehicleUser,
          [UserKeys.LINK]: linkResponse.link,
        };
      }

      let token: Token;
      if (tokenId) {
        token = await this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tokenId,
          true,
          undefined,
          undefined,
          true,
        );

        // Retrieve default wallet
        const wallet: Wallet = this.walletService.extractWalletFromUser(
          vehicleUser,
          undefined,
        );

        const linkResponse: CreateLinkOutput =
          await this.linkService.createUserEntityLinkIfRequired(
            tenantId,
            UserType.ISSUER, // Exception: not "typeFunctionUser" here because only an ISSUER shall be able to invite an investor, and "typeFunctionUser" = INVESTOR
            undefined, // idFunctionUser
            vehicleUser,
            FunctionName.KYC_INVITE,
            EntityType.TOKEN,
            undefined, // entityProject
            undefined, // entityIssuer
            token, // entityToken
            assetClassKey,
            wallet,
          );
        vehicleUser = {
          ...vehicleUser,
          [UserKeys.LINK]: linkResponse.link,
        };
      }

      return {
        user: vehicleUser,
        newUser,
        message: `Vehicle ${vehicleUser[UserKeys.USER_ID]} successfully ${
          newUser ? 'created' : 'retrieved'
        } ${tokenId ? `and linked to token ${token[TokenKeys.TOKEN_ID]}` : ''}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating linked vehicle',
        'createLinkedVehicle',
        false,
        500,
      );
    }
  }

  /**
   * [Create notary]
   *  - [OPTIONAL] _ctxStorage: key to store output in context (ctx) if required
   */
  async createLinkedUser(
    tenantId: string,
    email: string,
    firstName: string,
    lastName: string,
    authId: string, // Optional parameter, used to specify id of user in Auth0, in case user already exists in Auth0
    userNature: UserNature,
    docuSignId: string,
    kycTemplateId: string,
    userType: UserType,
    entityType: EntityType,
    entityId: string,
    assetClassKey: string,
    auth0UserCreate: boolean,
    auth0UserPassword: string,
    data: any,
  ): Promise<CreateUserOutput> {
    try {
      const config: Config = await this.configService.retrieveTenantConfig(
        tenantId,
      );

      if (!email) {
        ErrorService.throwError('missing input data (email)');
      }
      const _userNature: UserNature = userNature || UserNature.NATURAL;

      let _docuSignId: string;
      let _kycTemplateId: string;

      if (isAdministratorUserType(userType)) {
        _docuSignId = docuSignId ? docuSignId : process.env.DEFAULT_DOCUSIGN_ID;

        // Define the KYC template that will be used by default at tenant level, and save it in config's data
        _kycTemplateId = (
          await this.kycTemplateService.retrieveKycTemplateIfExistingOrRetrieveTenantKycTemplate(
            tenantId,
            kycTemplateId,
            config,
          )
        )?.[KycTemplateKeys.TEMPLATE_ID];
      }

      const users: Array<User> =
        await this.apiEntityCallService.fetchFilteredEntities(
          tenantId,
          EntityEnum.email,
          email,
          true, // includeWallets
        );

      let newUser = true;
      let user: User;
      if (users.length !== 0) {
        newUser = false;
        user = users[0];
        if (user[UserKeys.USER_TYPE] !== userType) {
          ErrorService.throwError(
            `user with email ${email} already exists but is not a ${userType} (${
              user[UserKeys.USER_TYPE]
            } instead)`,
          );
        } else if (authId && user[UserKeys.AUTH_ID] !== authId) {
          ErrorService.throwError(
            `user with email ${email} already exists but his authId is not equal to ${authId} (${
              user[UserKeys.AUTH_ID]
            } instead)`,
          );
        }
      } else {
        user = await this.createUser(
          tenantId,
          email,
          firstName,
          lastName,
          authId, // Optional parameter, used to specify id of user in Auth0, in case user already exists in Auth0
          userType,
          undefined, // superUserId (for vehicles only)
          _userNature,
          _docuSignId, // (for platform administrators only)
          _kycTemplateId, // (for platform administrators only)
          auth0UserCreate,
          auth0UserPassword,
          data,
        );
      }

      let entityProject: Project;
      let entityIssuer: User;
      let entityToken: Token;
      if (entityId) {
        if (entityType === EntityType.PROJECT) {
          entityProject = await this.apiMetadataCallService.retrieveProject(
            tenantId,
            ProjectEnum.projectId,
            entityId,
            true,
          );
        } else if (entityType === EntityType.ISSUER) {
          entityIssuer = await this.apiEntityCallService.fetchEntity(
            tenantId,
            entityId,
            true,
          );
        } else if (entityType === EntityType.TOKEN) {
          entityToken = await this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.tokenId,
            entityId,
            true,
            undefined,
            undefined,
            true,
          );
        } else {
          ErrorService.throwError(`invalid entity type (${entityType})`);
        }

        const linkResponse: CreateLinkOutput =
          await this.linkService.createUserEntityLinkIfRequired(
            tenantId,
            UserType.ISSUER, // Exception: not "typeFunctionUser" here because only an ISSUER shall be able to invite an investor, and "typeFunctionUser" = INVESTOR
            undefined, // idFunctionUser
            user,
            linkingFunctionForUserType[user[UserKeys.USER_TYPE]],
            entityType,
            entityProject,
            entityIssuer,
            entityToken,
            assetClassKey,
            undefined, // default wallet will be chosen
          );
        user = {
          ...user,
          [UserKeys.LINK]: linkResponse.link,
        };
      }

      return {
        user,
        newUser,
        message: `${setToLowerCaseExceptFirstLetter(userType)} ${
          user[UserKeys.USER_ID]
        } ${newUser ? 'created' : 'retrieved'} successfully ${
          entityId
            ? `and linked as ${
                user[UserKeys.LINK][LinkKeys.STATE]
              } to ${entityType.toLowerCase()} ${entityId}`
            : ''
        }`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating linked user',
        'createLinkedUser',
        false,
        500,
      );
    }
  }

  /**
   * [Create initial users]
   */
  async createInitialUsers(
    tenantId: string,
    firstUserEmail: string,
    firstUserPassword: string,
    firstUserFirstName: string,
    firstUserLastName: string,
    firstUserCompanyName: string,
    tenantType: TenantType,
    e2eTestUsers: boolean,
    faucetNetworksKeys?: string[],
    authToken?: string,
  ): Promise<CreateInitialUsersOutput> {
    try {
      const userNature: UserNature = UserNature.LEGAL;
      const docuSignId: string = process.env.DEFAULT_DOCUSIGN_ID;
      const faucetIds: string[] = [];

      const config: Config = await this.configService.retrieveTenantConfig(
        tenantId,
      );

      let kycTemplateId: string;
      let saveNewKycTemplateIdInTenantConfig: boolean;
      if (!config?.[ConfigKeys.DATA]?.[ConfigKeys.DATA__KYC_TEMPLATE_ID]) {
        // In case no 'kycTemplateId' is saved in tenant's config,
        // we need to save the default Codefi Kyc temaplate ID in tenant's config
        saveNewKycTemplateIdInTenantConfig = true;
      } else {
        // In case 'kycTemplateId' is saved in tenant's config,
        // we shall check if the ID is valid
        try {
          kycTemplateId =
            config?.[ConfigKeys.DATA]?.[ConfigKeys.DATA__KYC_TEMPLATE_ID];
          await this.apiKycCallService.retrieveKycTemplate(
            tenantId,
            TemplateEnum.templateId,
            kycTemplateId, // templateId
            true,
          );
        } catch (error) {
          saveNewKycTemplateIdInTenantConfig = true;
        }
      }

      // If required, we retrieve default KYC template ID and save it tenant's config data
      if (saveNewKycTemplateIdInTenantConfig) {
        kycTemplateId = (
          await this.kycTemplateService.retrieveDefaultCodefiKycTemplate(
            tenantId,
          )
        )?.[KycTemplateKeys.TEMPLATE_ID];

        const dataWithKycTemplateId = {
          ...config[ConfigKeys.DATA],
          [ConfigKeys.DATA__KYC_TEMPLATE_ID]: kycTemplateId,
        };
        await this.configService.createOrUpdateConfig(
          tenantId,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          dataWithKycTemplateId,
          TENANT_FLAG, // userId
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        );
      }

      const preCraftedUsers: Array<{
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        company: string;
        type: UserType;
        codefiUser: boolean;
      }> = await this.preCraftInitialUsers(
        tenantId,
        firstUserEmail,
        firstUserPassword,
        firstUserFirstName,
        firstUserLastName,
        firstUserCompanyName,
        tenantType,
      );

      let index = 0;
      const codefiUsers: { [key: string]: User } = {};
      let firstUser: User;

      for (const preCraftedUser of preCraftedUsers) {
        if (!(preCraftedUser.email && preCraftedUser.type)) {
          ErrorService.throwError(
            'invalid preCraftedUser in array of initial users',
          );
        }

        let initialUser: User;
        let newUser: boolean;

        const auth0User: Auth0User = await this.createOrRetrieveUserInAuth0(
          tenantId,
          preCraftedUser.email,
          preCraftedUser.password,
          preCraftedUser.firstName,
          preCraftedUser.lastName,
          getTenantRolesForUserType(preCraftedUser.type),
          true, // retrieveIfExisting
          e2eTestUsers, // e2eTestUser
        );

        const usersWithSameEmail: Array<User> =
          await this.apiEntityCallService.fetchFilteredEntities(
            tenantId,
            EntityEnum.email,
            preCraftedUser.email,
            true, // includeWallets
          );

        if (usersWithSameEmail.length !== 0) {
          // User already exists in Codefi DB, we shall not re-create it
          initialUser = usersWithSameEmail.find((userWithSameEmail) => {
            return (
              auth0User?.userId &&
              userWithSameEmail[UserKeys.AUTH_ID] === auth0User?.userId
            );
          });
          if (!initialUser) {
            const userWithSameEmailWithoutAuthId: User =
              usersWithSameEmail.find((userWithSameEmail) => {
                if (!userWithSameEmail[UserKeys.AUTH_ID]) {
                  return true;
                } else {
                  return false;
                }
              });
            if (userWithSameEmailWithoutAuthId) {
              initialUser = await this.apiEntityCallService.patchEntity(
                userWithSameEmailWithoutAuthId[UserKeys.TENANT_ID],
                userWithSameEmailWithoutAuthId[UserKeys.USER_ID],
                {
                  [UserKeys.AUTH_ID]: auth0User?.userId,
                  [UserKeys.DATA]: {
                    ...userWithSameEmailWithoutAuthId[UserKeys.DATA],
                    [UserKeys.DATA__COMPANY]: preCraftedUser.company,
                  },
                },
              );
            } else {
              ErrorService.throwError(
                `shall never happen: user with email ${
                  preCraftedUser.email
                } already exists in Codefi DB (${
                  usersWithSameEmail[0][UserKeys.EMAIL]
                }) but his authId is equal to ${
                  usersWithSameEmail[0][UserKeys.AUTH_ID]
                } (expected: ${auth0User?.userId})`,
              );
            }
          }

          if (!(initialUser && initialUser[UserKeys.USER_ID])) {
            ErrorService.throwError(
              `shall never happen: initialUser is undefined for email ${preCraftedUser.email}`,
            );
          }
          // If user exists in auth0, we shall add (tenantId, userId) in its metadata
          const tenantData =
            auth0User.appMetadata?.[
              craftAuth0TenantId(initialUser[UserKeys.TENANT_ID])
            ];
          const targetTenantRoles = getTenantRolesForUserType(
            initialUser[UserKeys.USER_TYPE],
          );
          if (
            !(
              tenantData?.entityId === initialUser[UserKeys.USER_ID] &&
              rolesMatch(tenantData?.roles, targetTenantRoles)
            )
          ) {
            this.logger.info(
              {},
              `user with email ${auth0User?.email} and id ${auth0User?.userId} has invalid metadata, it needs to be updated`,
            );

            await this.apiAdminCallService.updateUserInAuth0ById(
              initialUser[UserKeys.TENANT_ID],
              auth0User?.userId, // authId
              initialUser[UserKeys.USER_ID],
              getTenantRolesForUserType(initialUser[UserKeys.USER_TYPE]), // tenantRoles
            );
          }

          newUser = false;
        } else {
          initialUser = await this.createUser(
            tenantId,
            preCraftedUser.email,
            preCraftedUser.firstName, // first name
            preCraftedUser.lastName, // last name
            auth0User?.userId, // authId (id of user in Auth0)
            preCraftedUser.type,
            undefined, // superUserId (for vehicles only)
            userNature,
            docuSignId,
            kycTemplateId,
            true, // auth0UserCreate
            preCraftedUser.password, // auth0UserPassword
            { [UserKeys.DATA__COMPANY]: preCraftedUser.company }, // data
          );
          newUser = true;
        }

        if (!preCraftedUser.codefiUser) {
          firstUser = initialUser;
          // Create tenant "Faucet" (if not present yet), by using tenant "first user" (ADMIN|ISSUER) wallet,
          // if faucetNetworksKeys parameter is present
          if (faucetNetworksKeys && faucetNetworksKeys.length > 0) {
            await Promise.all(
              faucetNetworksKeys.map(async (networkKey) => {
                const network = await this.networkService.retrieveNetwork(
                  tenantId,
                  null,
                  networkKey,
                  true, // networkShallExist
                );

                // Skip faucet creation if network doesn't requires ETHs
                if (!network[NetworkKeys.ETH_REQUIRED]) return;

                try {
                  const createdFaucet = await this.networkService.createFaucet(
                    network[NetworkKeys.KEY],
                    firstUser.defaultWallet,
                    tenantId,
                    'creation',
                    authToken,
                  );

                  faucetIds.push(createdFaucet.uuid);

                  this.logger.info(
                    {},
                    `A faucet has been registered in orchestrate with user ${firstUser.email} default wallet: ${firstUser.defaultWallet} for tenant: ${tenantId}`,
                  );

                  // maybe faucet already created for this tenant and with this name
                } catch (error) {
                  if (error.downstreamStatus === 409) {
                    this.logger.info(
                      {},
                      `A faucet has already been registered in orchestrate for network: ${network.key} and tenant: ${tenantId}`,
                    );
                  } else {
                    ErrorService.logAndThrowFunctionError(
                      error,
                      'creating tenant',
                      'createTenant',
                      false,
                      500,
                    );
                  }
                }
              }),
            );
          }
        } else if (preCraftedUser.type !== UserType.SUPERADMIN) {
          codefiUsers[preCraftedUser.type] = initialUser;
        }

        this.logger.info(
          {},
          `${setToLowerCaseExceptFirstLetter(
            initialUser[UserKeys.USER_TYPE],
          )} ${initialUser[UserKeys.USER_ID]} with ${
            initialUser[UserKeys.EMAIL]
          } ${
            newUser ? 'has been sucessfully created' : 'already exists'
          }: it has ${
            initialUser[UserKeys.AUTH_ID] ? 'the following' : 'no'
          } authId ${
            initialUser[UserKeys.AUTH_ID]
          } and the following firstConnection code ${
            initialUser[UserKeys.FIRST_CONNECTION_CODE]
          }\n`,
        );

        index++;
        if (index === preCraftedUsers.length) {
          break;
        }
        await sleep(1500);
      }
      return { firstUser, codefiUsers, faucetIds };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating initial users',
        'createInitialUsers',
        false,
        500,
      );
    }
  }

  /**
   * [Pre-craft initial users]
   */
  async preCraftInitialUsers(
    tenantId: string,
    firstUserEmail: string,
    firstUserPassword: string,
    firstUserFirstName: string,
    firstUserLastName: string,
    firstUserCompanyName: string,
    tenantType: TenantType,
  ): Promise<
    Array<{
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      company: string;
      type: UserType;
      codefiUser: boolean;
    }>
  > {
    try {
      const config: Config = await this.configService.retrieveTenantConfig(
        tenantId,
      );

      const { defaultAlias } = getTenantDataFromConfig(config);

      // Check that defaultAlias follow the correct format
      let prefix: string;

      // There's an edge case for our dev/demo environements, which share the same Auth0 tenant, and
      // the same default client application.
      // "domainNameAlternative" allows to cover this edge case.
      let domainNameAlternative;
      if (domainName.includes('-dev.')) {
        domainNameAlternative = domainName.replace('-dev.', '-demo.');
      } else if (domainName.includes('-demo.')) {
        domainNameAlternative = domainName.replace('-demo.', '-dev.');
      }
      if (tenantId !== defaultTenantId && defaultAlias) {
        if (
          defaultAlias.includes(domainName) ||
          defaultAlias.includes(domainNameAlternative) ||
          domainName.includes('assets-api')
        ) {
          prefix = `${defaultAlias.split('.')[0]}-`;
        } else {
          ErrorService.throwError(
            `defaultAlias of the tenant should end by ${domainName} (current value is ${defaultAlias})`,
          );
        }
      } else {
        prefix = '';
      }

      if (defaultTenantShortAlias) {
        // This is required to make sure we don't override user's metedata in Auth0 for users with emails: admin@codefi.net, issuer@codefi.net, investor@codefi.net, etc.
        prefix = `${defaultTenantShortAlias}-${prefix}`;
      }

      const defaultPassword: string = process.env.DEFAULT_PASSWORD;
      const defaultFirstName = 'Codefi';
      const defaultLastName = 'Assets';

      const preCraftedUsers: Array<{
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        company: string;
        type: UserType;
        codefiUser: boolean;
      }> = [
        {
          email: `${prefix}admin@codefi.net`,
          password: defaultPassword,
          firstName: defaultFirstName,
          lastName: defaultLastName,
          company: DEFAULT_COMPANY_NAME,
          type: UserType.ADMIN,
          codefiUser: true,
        },
        {
          email: `${prefix}issuer@codefi.net`,
          password: defaultPassword,
          firstName: defaultFirstName,
          lastName: defaultLastName,
          company: DEFAULT_COMPANY_NAME,
          type: UserType.ISSUER,
          codefiUser: true,
        },
        {
          email: `${prefix}verifier@codefi.net`,
          password: defaultPassword,
          firstName: defaultFirstName,
          lastName: defaultLastName,
          company: DEFAULT_COMPANY_NAME,
          type: UserType.VERIFIER,
          codefiUser: true,
        },
        {
          email: `${prefix}investor@codefi.net`,
          password: defaultPassword,
          firstName: defaultFirstName,
          lastName: defaultLastName,
          company: DEFAULT_COMPANY_NAME,
          type: UserType.INVESTOR,
          codefiUser: true,
        },
      ];

      if (firstUserEmail && firstUserEmail !== `${prefix}admin@codefi.net`) {
        let firstUserType: UserType;
        if (tenantType && tenantType === TenantType.PLATFORM_SINGLE_ISSUER) {
          firstUserType = UserType.ISSUER;
        } else {
          firstUserType = UserType.ADMIN;
        }
        preCraftedUsers.push({
          email: firstUserEmail,
          password: firstUserPassword || defaultPassword,
          firstName: firstUserFirstName || defaultFirstName,
          lastName: firstUserLastName || defaultLastName,
          company: firstUserCompanyName,
          type: firstUserType,
          codefiUser: false,
        });
      }

      if (tenantId === defaultTenantId && superAdminEmail) {
        if (checkEmailAddress(superAdminEmail)) {
          preCraftedUsers.push({
            email: superAdminEmail,
            password: defaultPassword,
            firstName: defaultFirstName,
            lastName: defaultLastName,
            company: DEFAULT_COMPANY_NAME,
            type: UserType.SUPERADMIN,
            codefiUser: true,
          });
        } else {
          this.logger.info(
            {},
            `Invalid email address format for SuperAdmin address: ${superAdminEmail}\n`,
          );
        }
      } else {
        this.logger.info(
          {},
          'CAUTION, missing superadmin email address: please set SUPERADMIN_EMAIL environment variable\n',
        );
      }

      return preCraftedUsers;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'pre-crafting initial users',
        'preCraftInitialUsers',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve or create user in Auth0]
   */
  async createOrRetrieveUserInAuth0(
    tenantId: string, // not used for now
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    tenantRoles: Array<string>,
    retrieveIfExisting: boolean,
    e2eTestUser: boolean,
  ): Promise<Auth0User> {
    try {
      let auth0User: Auth0User;

      const auth0UsersWithSameEmail: Array<Auth0User> =
        await this.apiAdminCallService.retrieveUsersInAuth0ByEmail(
          tenantId, // not used for now
          email,
        );

      if (
        auth0UsersWithSameEmail?.length > 0 &&
        auth0UsersWithSameEmail[0]?.email === email
      ) {
        // User with same email already exists in Auth0
        if (retrieveIfExisting) {
          auth0User = auth0UsersWithSameEmail[0];
        } else {
          ErrorService.throwError(
            `impossible to create user with email ${email} in Auth0 as it already exists. If you're the owner of this user account, please provide the 'authId' in the body of your request`,
          );
        }
      } else {
        // User with same email doesn't exists in Auth0
        const userPassword: string = craftAuth0UserPassword(password);
        auth0User = await this.apiAdminCallService.createUserInAuth0(
          tenantId,
          undefined, // userId // TODO: will be renamed initialEntity after integration with Entity-Api
          email,
          userPassword,
          firstName,
          lastName,
          tenantRoles,
          e2eTestUser,
        );
        if (!auth0User?.userId) {
          ErrorService.throwError(
            "shall never happen: user created in auth0 has no 'userId'",
          );
        }
      }

      return auth0User;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving or creating user in Auth0',
        'retrieveOrCreateUserInAuth0',
        false,
        500,
      );
    }
  }
}
