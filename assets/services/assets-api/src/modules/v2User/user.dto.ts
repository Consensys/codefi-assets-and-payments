import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  ValidateNested,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

import {
  UserNature,
  UserType,
  User,
  UserExample,
  keys as UserKeys,
  UserExtendedForTokenExample,
  UserData,
} from 'src/types/user';
import { keys as TokenKeys, TokenExample } from 'src/types/token';
import {
  Link,
  LinkExample,
  LinkState,
} from 'src/types/workflow/workflowInstances/link';
import { keys as ProjectKeys, ProjectExample } from 'src/types/project';
import { Type, Transform } from 'class-transformer';
import { sanitize } from 'src/utils/sanitize';

export const MAX_USERS_COUNT = 50;

export class ListAllUsersQueryInput {
  @ApiProperty({
    description: 'Index of first users to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of users to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_USERS_COUNT)
  limit: number;

  @ApiProperty({
    description:
      'Filter parameter to retrieve users of given user types. The parameter shall be a stringified array of UserTypes.',
    example: JSON.stringify([
      UserType.ISSUER,
      UserType.UNDERWRITER,
      UserType.VERIFIER,
    ]),
  })
  @IsOptional()
  userTypes: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve users linked to the platform/issuer with a given states. The parameter shall be a stringified array of linkStates.',
    example: JSON.stringify([
      LinkState.INVITED,
      LinkState.KYCSUBMITTED,
      LinkState.VALIDATED,
    ]),
  })
  linkStates: string;

  @ApiProperty({
    description: "If set 'true', user's links are retrieved as well",
    example: true,
  })
  @IsOptional()
  withLinks: boolean;
}

export class ListAllUsersOutput {
  @ApiProperty({
    description: 'Listed users',
    example: [
      {
        ...UserExample,
        [UserKeys.LINK]: LinkExample,
      },
    ],
  })
  @ValidateNested()
  users: Array<Omit<User, UserKeys.FIRST_CONNECTION_CODE>>;

  @ApiProperty({
    description: 'Number of users fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of users',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 user(s) listed successfully',
  })
  message: string;
}

export class CreateUserBodyInput {
  @ApiProperty({
    description:
      'Must be a valid user type: SUPERADMIN | ADMIN | ISSUER | INVESTOR | VEHICLE',
    example: UserExample[UserKeys.USER_TYPE],
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({
    description: 'Must be a valid email',
    example: UserExample[UserKeys.EMAIL],
  })
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty({
    description: "User's first name",
    example: UserExample[UserKeys.FIRST_NAME],
  })
  @IsString()
  @IsNotEmpty()
  @Transform(sanitize)
  firstName: string;

  @ApiProperty({
    description: "User's last name",
    example: UserExample[UserKeys.LAST_NAME],
  })
  @IsString()
  @IsNotEmpty()
  @Transform(sanitize)
  lastName: string;

  @ApiProperty({
    description: 'User nature: NATURAL | LEGAL',
    example: UserExample[UserKeys.USER_NATURE],
  })
  @IsOptional()
  @IsEnum(UserNature)
  userNature: UserNature;

  @ApiProperty({
    description: "ID of user's account in auth0 (identity provider)",
    example: UserExample[UserKeys.AUTH_ID],
  })
  @IsOptional()
  @IsString()
  @Transform(sanitize)
  authId: string;

  @ApiProperty({
    description: "ID of user's DocuSign account (for issuers only - optional)",
    example: UserExample[UserKeys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID],
  })
  @IsOptional()
  @IsString()
  @Transform(sanitize)
  docuSignId: string;

  @ApiProperty({
    description: "ID of user's KYC template (for issuers only - optional)",
    example: UserExample[UserKeys.DATA][UserKeys.DATA__KYC_TEMPLATE_ID],
  })
  @IsOptional()
  @IsString()
  @Transform(sanitize)
  kycTemplateId: string;

  @ApiProperty({
    description:
      "ID super user's ID (only for vehicles - used to indicate who's the owner of the vehicle)",
    example: UserExample[UserKeys.USER_ID],
  })
  @IsOptional()
  @IsString()
  @Transform(sanitize)
  superUserId: string;

  @ApiProperty({
    description:
      'ID of project - optional - used to link user to a specific project after user creation',
    example: ProjectExample[ProjectKeys.PROJECT_ID],
  })
  @IsOptional()
  @IsString()
  @Transform(sanitize)
  projectId: string;

  @ApiProperty({
    description:
      'ID of token - optional - used to link user to a specific token after user creation',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  @IsString()
  @Transform(sanitize)
  tokenId: string;

  @ApiProperty({
    description:
      'Asset class of token - optional - used to link user to a specific asset class of a token after user creation',
    example: 'classa',
  })
  @IsOptional()
  @Transform(sanitize)
  assetClass: string;

  @ApiProperty({
    description: 'If set to true, corresponding user shall be created in Auth0',
    example: true,
  })
  @IsOptional()
  auth0UserCreate: boolean;

  @ApiProperty({
    description:
      "If 'auth0UserCreate' is set to true, this parameter can be used to define user's password in Auth0",
    example: 'xxx',
  })
  @IsOptional()
  @Transform(sanitize)
  auth0UserPassword: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: UserExample[UserKeys.DATA],
  })
  @IsOptional()
  @ValidateNested()
  @Transform(sanitize)
  @Type(() => UserData)
  data: UserData;
}

class PartialCreateUserBodyInput extends PartialType(CreateUserBodyInput) {}

export class CreateUserOutput {
  @ApiProperty({
    description: 'Created user (or retrieved user in case it already existed)',
    example: {
      ...UserExample,
      [UserKeys.LINK]: LinkExample,
    },
  })
  @ValidateNested()
  user: Omit<User, UserKeys.FIRST_CONNECTION_CODE>;

  @ApiProperty({
    description:
      "'true' if a new user has been created, 'false' if user already existed and has been retrieved",
    example: true,
  })
  newUser: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `User ${UserExample[UserKeys.USER_ID]} successfully created`,
  })
  message: string;
}

export class CreateInitialUsersOutput {
  @ApiProperty({
    description:
      'Created first user whose email address has been provided at tenant creation. Can be an ADMIN in case of a multi-issuer platform, or an ISSUER in case of a single-issuer platform.',
    example: UserExample,
  })
  @ValidateNested()
  firstUser: User;

  @ApiProperty({
    description:
      'Created codefi users whose email address has been generated from tenant defautAlias.',
    example: {
      [UserType.ADMIN]: UserExample,
      [UserType.ISSUER]: UserExample,
      [UserType.INVESTOR]: UserExample,
    },
  })
  @ValidateNested()
  codefiUsers: {
    [key: string]: User;
  };

  @ApiProperty({
    description: 'An array of created Faucet Ids',
    example: [
      '14ea4e33-0203-49db-b0b6-b092472098bc',
      '125eb4e6-5b5a-4fcd-ace5-372b4bebb0c9',
    ],
  })
  @IsOptional()
  faucetIds?: string[];
}

export class RetrieveUserQueryInput {
  @ApiProperty({
    description:
      "If set 'true', user's vehicles are retrieved as well. If set to 'false', only user's data is returned",
    example: true,
  })
  @IsOptional()
  withVehicles: boolean;

  @ApiProperty({
    description:
      "If set 'true', and 'tokenId' is parameter is specified, user's balances for the specified token are retrieved as well",
    example: true,
  })
  @IsOptional()
  withBalances: boolean;

  @ApiProperty({
    description: "If set 'true', user's ETH balances is retrieved as well",
    example: true,
  })
  @IsOptional()
  withEthBalance: boolean;

  @ApiProperty({
    description:
      "ID of token - optional - used to retrieve a user's token-related data",
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  @IsString()
  tokenId: string;

  @ApiProperty({
    description:
      "ID of project - optional - used to retrieve a user's project-related data",
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  @IsString()
  projectId: string;

  @ApiProperty({
    description:
      "Asset class of token - optional - used to retrieve a user's asset-class-related data",
    example: 'classa',
  })
  @IsOptional()
  assetClass: string;
}

export class RetrieveUserQueryInputAsThirdParty extends RetrieveUserQueryInput {
  @ApiProperty({
    description:
      "ID of issuer - optional - used to retrieve a user's issuer-related data as a verifier, underwriter, or broker",
    example: UserExample[UserKeys.USER_ID],
  })
  @IsOptional()
  @IsString()
  issuerId: string;
}

export class RetrieveUserParamInput {
  @ApiProperty({
    description: 'Id of user to retrieve',
    example: UserExample[UserKeys.USER_ID],
  })
  userId: string;
}

export class RetrieveUserOutput {
  @ApiProperty({
    description: 'Retrieved user',
    example: UserExtendedForTokenExample,
  })
  @ValidateNested()
  user: Omit<User, UserKeys.FIRST_CONNECTION_CODE>;

  @ApiProperty({
    description: 'Response message',
    example: `User ${UserExample[UserKeys.USER_ID]} retrieved successfully`,
  })
  message: string;
}

export class UpdateUserParamInput {
  @ApiProperty({
    description: 'Id of user to update',
    example: UserExample[UserKeys.USER_ID],
  })
  userId: string;
}

export class UpdateUserBodyInput {
  @ApiProperty({
    description: 'User parameters to update',
    example: {
      [UserKeys.FIRST_NAME]: UserExample[UserKeys.FIRST_NAME],
      [UserKeys.LAST_NAME]: UserExample[UserKeys.LAST_NAME],
      [UserKeys.EMAIL]: UserExample[UserKeys.EMAIL],
      [UserKeys.DATA]: {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
        keyn: 'valuen',
      },
    },
  })
  @ValidateNested()
  @Type(() => PartialCreateUserBodyInput)
  updatedParameters: PartialCreateUserBodyInput;
}

export class UpdateUserOutput {
  @ApiProperty({
    description: 'Updated user',
    example: UserExample,
  })
  @ValidateNested()
  user: User;

  @ApiProperty({
    description: 'Response message',
    example: `User ${UserExample[UserKeys.USER_ID]} updated successfully`,
  })
  message: string;
}

export class DeleteUserParamInput {
  @ApiProperty({
    description: 'Id of user to delete',
    example: UserExample[UserKeys.USER_ID],
  })
  userId: string;
}

export class DeleteUserQueryInput {
  @ApiProperty({
    description: 'If set to true, corresponding user shall be deleted in Auth0',
    example: true,
  })
  @IsOptional()
  auth0UserDelete: boolean;
}

export class DeleteUserOutput {
  @ApiProperty({
    description: 'IDs of deleted element instances',
    example: [
      '2bc607b7-a46e-45e4-a74c-4a559bd89c81',
      '852a27de-5949-4de1-a782-1bce5a368135',
    ],
  })
  deletedElementInstances: Array<string>;

  @ApiProperty({
    description: 'IDs of deleted element reviews',
    example: [
      'd9558f63-4457-4393-9785-45bbda8e5c6c',
      '2fc73d9d-186d-496c-843c-3c7a13d3dc23',
    ],
  })
  deletedElementReviews: Array<string>;

  @ApiProperty({
    description: 'IDs of deleted template reviews',
    example: ['5056f94d-e080-4ef2-ac46-9ec5b450bce7'],
  })
  deletedTemplateReviews: Array<string>;

  @ApiProperty({
    description: 'Array of deleted actions IDs',
    example: [1678008],
  })
  deletedTokenDeployments: Array<number>;

  @ApiProperty({
    description: 'Array of deleted actions IDs',
    example: [2257, 33567, 2454],
  })
  deletedActions: Array<number>;

  @ApiProperty({
    description: 'Array of deleted actions IDs',
    example: [936, 113],
  })
  deletedOrders: Array<number>;

  @ApiProperty({
    description: 'Array of deleted links IDs',
    example: [23, 57, 88, 99, 173],
  })
  deletedLinks: Array<number>;

  @ApiProperty({
    description: 'IDs of deleted auth0 users',
    example: ['auth0|6158d2f504e61a0071d1e446'],
  })
  deletedAuth0Users: Array<string>;

  @ApiProperty({
    description: 'Response message',
    example: `User ${UserExample[UserKeys.USER_ID]} deleted successfully`,
  })
  message: string;
}

export class NotaryParamInput {
  @ApiProperty({
    description: 'ID of admin/issuer, the notary shall be added to',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  userId: string;
}

export class NotaryBodyInput {
  @ApiProperty({
    description:
      'ID of user, who shall be added as notary for a given admin/issuer',
    example: UserExample[UserKeys.USER_ID],
  })
  notaryId: string;
}

export class NotaryOutput {
  @ApiProperty({
    description: 'Created link between notary and admin/issuer',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description:
      "'true' if a new link has been created, 'false' if link already existed and has been retrieved",
    example: true,
  })
  newLink: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Notary ${
      UserExample[UserKeys.USER_ID]
    } succesfully added to user ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class VerifierParamInput {
  @ApiProperty({
    description: 'ID of admin/issuer, the verifier shall be added to',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  userId: string;
}

export class VerifierBodyInput {
  @ApiProperty({
    description:
      'ID of user, who shall be added as verifier on behalf of admin/issuer',
    example: UserExample[UserKeys.USER_ID],
  })
  verifierId: string;
}

export class VerifierOutput {
  @ApiProperty({
    description: 'Created link between KYC verifier and admin/issuer',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description:
      "'true' if a new link has been created, 'false' if link already existed and has been retrieved",
    example: true,
  })
  newLink: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Verifier ${
      UserExample[UserKeys.USER_ID]
    } succesfully added to user ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class NavManagerParamInput {
  @ApiProperty({
    description: 'ID of admin/issuer, the NAV manager shall be added to',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  userId: string;
}

export class NavManagerBodyInput {
  @ApiProperty({
    description:
      'ID of user, who shall be added as NAV manager on behalf of admin/issuer',
    example: UserExample[UserKeys.USER_ID],
  })
  navManagerId: string;
}

export class NavManagerOutput {
  @ApiProperty({
    description: 'Created link between NAV manager and admin/issuer',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description:
      "'true' if a new link has been created, 'false' if link already existed and has been retrieved",
    example: true,
  })
  newLink: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `NAV manager ${
      UserExample[UserKeys.USER_ID]
    } succesfully added to user ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class MessageOutput {
  @ApiProperty({
    description: 'Response message',
    example: `User ${UserExample[UserKeys.USER_ID]} updated successfully`,
  })
  message: string;
}
