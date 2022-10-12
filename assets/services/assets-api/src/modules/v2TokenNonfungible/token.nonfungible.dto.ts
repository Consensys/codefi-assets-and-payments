import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';

import { keys as UserKeys, UserExample } from 'src/types/user';
import {
  keys as TokenKeys,
  TokenExtendedExample,
  Token,
  TokenExample,
  TOKEN_SYMBOL_MAX_LENGTH,
  DEFAULT_TOKEN_NAME,
  DEFAULT_TOKEN_SYMBOL,
  IDENTIFIER_MAX_LENGTH,
  TokenInputDataExample,
} from 'src/types/token';
import { keys as NetworkKeys, NetworkExample } from 'src/types/network';
import { keys as ActionKeys } from 'src/types/workflow/workflowInstances';
import { InputDataExample } from 'src/types';
import { ActionExample } from 'src/types/workflow/workflowInstances/action';
import { SmartContract } from 'src/types/smartContract';
import { ENTITY_DESCRIPTION_MAX_LENGTH } from 'src/types/entity';
import { InitialSupply, InitialSupplyExample } from 'src/types/supply';

export class CreateNonfungibleTokenBodyInput {
  @ApiProperty({
    description: `Must be a valid non-fungible token standard: ${SmartContract.ERC721_TOKEN}`,
    example: SmartContract.ERC721_TOKEN,
  })
  @IsOptional()
  tokenStandard: SmartContract;

  @ApiProperty({
    description: 'Token name',
    example: DEFAULT_TOKEN_NAME,
  })
  @IsOptional()
  name: string;

  @ApiProperty({
    description: `Must be a less than ${TOKEN_SYMBOL_MAX_LENGTH} characters long`,
    example: DEFAULT_TOKEN_SYMBOL,
  })
  @IsOptional()
  symbol: string;

  @ApiProperty({
    description:
      'ID of the KYC template investors that will be applied to investors (leave undefined if no KYC will be requested from investors)',
    example: 'b32f6346-53b5-4cc6-a3f3-0012ed5e67a3',
  })
  @IsOptional()
  kycTemplateId: string;

  @ApiProperty({
    description:
      'Address of wallet to use to create the token (only required if not the default wallet)',
    example: UserExample[UserKeys.DEFAULT_WALLET],
  })
  @IsOptional()
  wallet: string;

  @ApiProperty({
    description: 'ID of the chain/network where the token shall be created',
    example: NetworkExample[NetworkKeys.CHAIN_ID],
  })
  @IsOptional()
  chainId: string; // TO BE DEPRECATED (replaced by 'networkKey')

  @ApiProperty({
    description: 'Key of the chain/network where the token shall be created',
    example: NetworkExample[NetworkKeys.KEY],
  })
  @IsOptional()
  networkKey: string;

  @ApiProperty({
    description: 'Picture of the asset',
    example: TokenExample[TokenKeys.PICTURE],
  })
  @IsOptional()
  picture: string;

  @ApiProperty({
    description: `Must be a less than ${ENTITY_DESCRIPTION_MAX_LENGTH} characters long`,
    example: TokenExample[TokenKeys.DESCRIPTION],
  })
  @IsOptional()
  description: string;

  @ApiProperty({
    description: 'Object containing bank account infos',
    example: TokenExample[TokenKeys.BANK_ACCOUNT],
  })
  @IsOptional()
  bankDepositDetail: any;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Must be a valid notary ID. Used to attach a notary to the token, thus allowing him to access all token data (investors, balances, etc.)',
    example: UserExample[UserKeys.USER_ID],
  })
  @IsOptional()
  notaryId: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;

  @ApiProperty({
    description:
      'Must be valid smart contract address, already deployed on the specified network, and where the issuer is already a minter',
    example: TokenExample[TokenKeys.DEFAULT_DEPLOYMENT],
  })
  @IsOptional()
  tokenAddress: any;

  @ApiProperty({
    description:
      "If set 'true', Issuer is not required to approve secondary trade orders",
    example: true,
  })
  @IsOptional()
  bypassSecondaryTradeIssuerApproval: boolean;

  @ApiProperty({
    description:
      'Array of initial supplies to be minted right after asset creation',
    example: [InitialSupplyExample],
  })
  @IsOptional()
  initialSupplies: Array<InitialSupply>;
}

export class RetrieveNonfungibleTokenQueryInput {
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
      "If set 'true', user's ETH balance, on the network where the specified token is deployed, is retrieved as well",
    example: true,
  })
  @IsOptional()
  withEthBalance: boolean;

  @IsOptional()
  withCycles: boolean;
}

export class RetrieveNonfungibleTokenParamInput {
  @ApiProperty({
    description: 'ID of token to retrieve',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class RetrieveNonfungibleTokenOutput {
  @ApiProperty({
    description: 'Retrieved nonfungible token',
    example: TokenExtendedExample,
  })
  @ValidateNested()
  token: Token;

  @ApiProperty({
    description: 'Response message',
    example: `Nonfungible token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } retrieved successfully`,
  })
  message: string;
}

export class UpdateNonfungibleTokenParamInput {
  @ApiProperty({
    description: 'ID of token to update',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class UpdateNonfungibleTokenBodyInput {
  @ApiProperty({
    description: 'Token parameters to update',
    example: {
      [TokenKeys.PICTURE]: TokenExample[TokenKeys.PICTURE],
      [TokenKeys.DESCRIPTION]: TokenExample[TokenKeys.DESCRIPTION],
      [TokenKeys.BANK_ACCOUNT]: TokenExample[TokenKeys.BANK_ACCOUNT],
      [TokenKeys.DATA]: {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
        keyn: 'valuen',
      },
    },
  })
  updatedParameters: any;
}

export class UpdateNonfungibleTokenOutput {
  @ApiProperty({
    description: 'Updated nonfungible token',
    example: TokenExample,
  })
  @ValidateNested()
  token: Token;

  @ApiProperty({
    description: 'Response message',
    example: `Nonfungible token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } updated successfully`,
  })
  message: string;
}

export class MintNonfungibleTokenParamInput {
  @ApiProperty({
    description: 'ID of token, where a minting transaction shall be executed',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class MintNonfungibleTokenBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: ActionExample[ActionKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of the user, tokens shall be minted for',
    example: UserExample[UserKeys.USER_ID],
  })
  recipientId: string;

  @ApiProperty({
    description: `Identifier of token to mint (shall be less than ${IDENTIFIER_MAX_LENGTH} characters long)`,
    example: ActionExample[ActionKeys.ASSET_CLASS],
  })
  identifier: string;

  @ApiProperty({
    description:
      'Optional parameter to force the price of the operation. If not defined, price will be set automatically, based on NAV value (recommended).',
    example: ActionExample[ActionKeys.PRICE],
  })
  @IsOptional()
  forcePrice: number;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: InputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class TranferNonfungibleTokenParamInput {
  @ApiProperty({
    description: 'ID of token, where a transfer transaction shall be executed',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class TransferNonfungibleTokenBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: ActionExample[ActionKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of the user, tokens shall be transferred to',
    example: UserExample[UserKeys.USER_ID],
  })
  recipientId: string;

  @ApiProperty({
    description: 'Identifier of token to transfer',
    example: ActionExample[ActionKeys.ASSET_CLASS],
  })
  identifier: string;

  @ApiProperty({
    description:
      'Optional parameter to force the price of the operation. If not defined, price will be set automatically, based on NAV value (recommended).',
    example: ActionExample[ActionKeys.PRICE],
  })
  @IsOptional()
  forcePrice: number;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: InputDataExample,
  })
  @IsOptional()
  data: any;
}

export class BurnNonfungibleTokenParamInput {
  @ApiProperty({
    description: 'ID of token, where a burn transaction shall be executed',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class BurnNonfungibleTokenBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: ActionExample[ActionKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'Identifier of token to burn',
    example: ActionExample[ActionKeys.ASSET_CLASS],
  })
  identifier: string;

  @ApiProperty({
    description:
      'Optional parameter to force the price of the operation. If not defined, price will be set automatically, based on NAV value (recommended).',
    example: ActionExample[ActionKeys.PRICE],
  })
  @IsOptional()
  forcePrice: number;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: InputDataExample,
  })
  @IsOptional()
  data: any;
}
