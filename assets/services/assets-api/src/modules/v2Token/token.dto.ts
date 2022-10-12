import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Max, Min, ValidateNested } from 'class-validator';

import { Aum, keys as TokenKeys, Token, TokenExample } from 'src/types/token';
import { keys as TxKeys, TransactionExample } from 'src/types/transaction';
import { keys as UserKeys, User, UserExample } from 'src/types/user';
import {
  ActionExample,
  Action,
} from 'src/types/workflow/workflowInstances/action';
import { keys as ActionKeys } from 'src/types/workflow/workflowInstances';
import { Link, LinkExample } from 'src/types/workflow/workflowInstances/link';
import { OrchestrateTransactionExample } from 'src/types/transaction/OrchestrateTransaction';
import { Type } from 'class-transformer';

export const MAX_TOKENS_COUNT = 10;
export const MAX_INVESTORS_COUNT = 50;

export class ListAllTokensQueryInput {
  @ApiProperty({
    description: 'Index of first tokens to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of tokens to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_TOKENS_COUNT)
  limit: number;

  @ApiProperty({
    description:
      'Must be a valid investor ID. Used to list tokens of a single investor only',
    example: UserExample[UserKeys.USER_ID],
  })
  @IsOptional()
  investorId: any;

  @ApiProperty({
    description:
      "If set 'true', user's balances for the specified token are retrieved as well [OPTION ONLY AVAILABLE FOR INVESTOR]",
    example: true,
  })
  @IsOptional()
  withBalances: boolean;

  @IsOptional()
  withCycles: boolean;

  @IsOptional()
  withSearch: string;

  @IsOptional()
  deployed: boolean;
}
export class ListAllTokenOutput {
  @ApiProperty({
    description: 'Listed tokens',
    example: [TokenExample],
  })
  @ValidateNested()
  tokens: Array<Token>;

  @ApiProperty({
    description: 'Number of tokens fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of tokens',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 token(s) listed successfully',
  })
  message: string;
}

export class RetrieveTokenInvestorsQueryInput {
  @ApiProperty({
    description: 'Actual user Id that made the request',
    example: 'e6a8ba8e-9b86-4648-af7f-95e424eeb38a',
  })
  callerId: string;

  @ApiProperty({
    description: 'userId',
    example: 'e6a8ba8e-9b86-4648-af7f-95e424eeb38a',
  })
  userId: string;

  @ApiProperty({
    description: 'Index of first investors to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of investors to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_INVESTORS_COUNT)
  limit: number;

  @ApiProperty({
    description:
      "Asset class of token, investors shall be retrieved from ('undefined' if investors from all asset classes shall be retrieved)",
    example: 'classa',
  })
  @IsOptional()
  assetClass: string;

  @ApiProperty({
    description:
      "If set 'true', user's vehicles, linked to the specified token, are retrieved as well",
    example: true,
  })
  @IsOptional()
  withVehicles: boolean;

  @ApiProperty({
    description:
      "If set 'true', user's balances for the specified token are retrieved as well",
    example: true,
  })
  @IsOptional()
  withBalances: boolean;

  @ApiProperty({
    description:
      'Part of first name or wallet address can be passed to search investors by name or address.',
    example: true,
  })
  @IsOptional()
  withSearch: string;
}

export class RetrieveTokenInvestorsParamInput {
  @ApiProperty({
    description: 'ID of token, investors shall be retrieved from',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class ListAllTokenInvestorsOutput {
  @ApiProperty({
    description: 'Listed users linked to token (investors)',
    example: [UserExample],
  })
  @ValidateNested()
  users: Array<User>;

  @ApiProperty({
    description: 'Number of investors fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of investors',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 investors(s) listed successfully',
  })
  message: string;
}

export class ListAllTokenAums {
  @ApiProperty({
    description: 'Token aums listed',
    example: [],
  })
  @ValidateNested()
  aums: Array<Aum>;

  @ApiProperty({
    description: 'Total number of history points',
    example: 366,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 token aum(s) listed successfully',
  })
  message: string;
}

export class CreateTokenOutput {
  @ApiProperty({
    description: 'Created token',
    example: TokenExample,
  })
  @ValidateNested()
  token: Token;

  @ApiProperty({
    description: 'Action, keeping track of the deployment operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example:
      OrchestrateTransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } created successfully (transaction sent)`,
  })
  message: string;
}

export class DeleteTokenOutput {
  @ApiProperty({
    description: 'IDs of deleted cycles (only for assets)',
    example: [
      'd9558f63-4457-4393-9785-45bbda8e5c6c',
      '2fc73d9d-186d-496c-843c-3c7a13d3dc23',
    ],
  })
  deletedCycles: Array<string>;

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
    example: [733346],
  })
  deletedTokenDeployments: Array<number>;

  @ApiProperty({
    description: 'Array of deleted actions IDs',
    example: [4677348, 78648686, 3575457, 457763467],
  })
  deletedNavs: Array<number>;

  @ApiProperty({
    description: 'Array of deleted actions IDs',
    example: [2256, 21, 9979, 45],
  })
  deletedActions: Array<number>;

  @ApiProperty({
    description: 'Array of deleted actions IDs',
    example: [2257, 33567, 2454],
  })
  deletedOrders: Array<number>;

  @ApiProperty({
    description: 'Array of deleted links IDs',
    example: [23, 57, 88, 99, 173],
  })
  deletedLinks: Array<number>;

  @ApiProperty({
    description: 'Array of deleted offers IDs',
    example: [336468, 336500, 336661],
  })
  deletedOffers: Array<number>;

  @ApiProperty({
    description: 'Response message',
    example: `Token ${TokenExample[TokenKeys.TOKEN_ID]} deleted successfully`,
  })
  message: string;
}

export class OwnershipParamInput {
  @ApiProperty({
    description: 'ID of token, the ownership shall be transferred from',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class OwnershipBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: ActionExample[ActionKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description:
      '[CAUTION - RISK] Address, the contract ownership shall be transferred to (you shall make sure you control the address before transferring contract ownership to it)',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  newOwnerAddress: string;
}

export class ExtensionParamInput {
  @ApiProperty({
    description: 'ID of token, the extension shall be setup for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class ExtensionBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: ActionExample[ActionKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description:
      '[OPTIONAL] Address of "custom" extension contract, the token contract shall be linked to.',
    example: '0x0089d53F703f7E0843953D48133f74cE247184c2',
  })
  customExtensionAddress: string;
}
export class ExtensionOutput {
  @ApiProperty({
    description:
      'Worflow instance, keeping track of the custom extension setup',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Custom extension 0x8e59a2a50795730ad80fe60c8894fa836bf26fcc of token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } succesfully setup (tx sent)`,
  })
  message: string;
}

export class AllowListParamInput {
  @ApiProperty({
    description: 'ID of token, the user shall be allowlisted for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class AllowListBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: ActionExample[ActionKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description:
      "ID of user, whom wallet shall be added on token's on-chain allowlist",
    example: UserExample[UserKeys.USER_ID],
  })
  submitterId: string;
}
export class AllowListOutput {
  @ApiProperty({
    description: 'Worflow instance, keeping track of the allowlist addition',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `User ${
      UserExample[UserKeys.USER_ID]
    } successfully added on on-chain allowlist for token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } (tx sent)`,
  })
  message: string;
}

export class OwnershipOutput {
  @ApiProperty({
    description:
      'Worflow instance, keeping track of the ownership transfer operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Contract ownership of token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } succesfully transferred to address 0xd200b5d89f719473573be585eadedc8c916e5515 (tx sent)`,
  })
  message: string;
}

export class NotaryParamInput {
  @ApiProperty({
    description: 'ID of token, the notary shall be added to',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class NotaryBodyInput {
  @ApiProperty({
    description: 'ID of user, who shall be added as notary to token',
    example: UserExample[UserKeys.USER_ID],
  })
  notaryId: string;
}

export class NotaryOutput {
  @ApiProperty({
    description: 'Created link between notary and token',
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
    } succesfully added to token ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}

export class VerifierParamInput {
  @ApiProperty({
    description: 'ID of token, the verifier shall be added to',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class VerifierBodyInput {
  @ApiProperty({
    description: 'ID of user, who shall be added as verifier to token',
    example: UserExample[UserKeys.USER_ID],
  })
  verifierId: string;
}

export class VerifierOutput {
  @ApiProperty({
    description: 'Created link between KYC verifier and token',
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
    } succesfully added to token ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}

export class NavManagerParamInput {
  @ApiProperty({
    description: 'ID of token, the NAV manager shall be added to',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class NavManagerBodyInput {
  @ApiProperty({
    description: 'ID of user, who shall be added as NAV manager to token',
    example: UserExample[UserKeys.USER_ID],
  })
  navManagerId: string;
}

export class NavManagerOutput {
  @ApiProperty({
    description: 'Created link between NAV manager and token',
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
    } succesfully added to token ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}

export class CurrentPriceParamInput {
  @ApiProperty({
    description: 'ID of token, price shall be retrieved from',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}
export class CurrentPriceOutput {
  @ApiProperty({
    description: 'Current amount invested in token',
    example: 3,
  })
  price: number;

  @ApiProperty({
    description: 'Current quantity invested in token',
    example: 543,
  })
  quantity: number;
}
