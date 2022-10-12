import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsOptional } from 'class-validator';

import { UserExample, keys as UserKeys } from 'src/types/user';
import {
  keys as WalletKeys,
  Wallet,
  WalletType,
  WalletExample,
} from 'src/types/wallet';

export class ListAllWalletsParamInput {
  @ApiProperty({
    description: 'Id of user wallets shall be listed for',
    example: UserExample[UserKeys.USER_ID],
  })
  userId: string;
}

export class ListAllWalletsOutput {
  @ApiProperty({
    description: 'Address of wallet used by default',
    example: UserExample[UserKeys.DEFAULT_WALLET],
  })
  defaultWallet: string;

  @ApiProperty({
    description: 'Listed wallets',
    example: UserExample[UserKeys.WALLETS],
  })
  @ValidateNested()
  wallets: Array<Wallet>;

  @ApiProperty({
    description: 'Response message',
    example: `5 wallet(s) listed successfully for user: ${
      UserExample[UserKeys.USER_ID]
    }`,
  })
  message: string;
}

export class CreateWalletQueryInput {
  @ApiProperty({
    description:
      'If set to true, the created wallet shall be set as default wallet for the user',
    example: true,
  })
  setAsDefault: boolean;
}

export class CreateWalletParamInput {
  @ApiProperty({
    description: 'Id of user wallet shall be created for',
    example: UserExample[UserKeys.USER_ID],
  })
  userId: string;
}

export class CreateWalletBodyInput {
  @ApiProperty({
    description: 'Must be a valid wallet type: vault | ledger',
    example: WalletExample[WalletKeys.WALLET_TYPE],
  })
  walletType: WalletType;

  @ApiProperty({
    description:
      'Must be a valid Ethereum address: address of wallet to register (only if wallet type == ledger)',
    example: WalletExample[WalletKeys.WALLET_ADDRESS],
  })
  @IsOptional()
  walletAddress: string;

  @ApiProperty({
    description: 'Additional data can be attached to the wallet',
    example: WalletExample[WalletKeys.WALLET_DATA],
  })
  @IsOptional()
  data: any;
}

export class CreateWalletOutput {
  @ApiProperty({
    description: 'Created wallet',
    example: WalletExample,
  })
  @ValidateNested()
  wallet: Wallet;

  @ApiProperty({
    description: 'Response message',
    example: `Wallet ${
      WalletExample[WalletKeys.WALLET_ADDRESS]
    } created successfully for user ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class RetrieveWalletParamInput {
  @ApiProperty({
    description: 'Id of user wallet shall be retrieved for',
    example: UserExample[UserKeys.USER_ID],
  })
  userId: string;

  @ApiProperty({
    description: 'Address of wallet to retrieve',
    example: WalletExample[WalletKeys.WALLET_ADDRESS],
  })
  walletAddress: string;
}

export class RetrieveWalletOutput {
  @ApiProperty({
    description: 'Retrieved wallet',
    example: WalletExample,
  })
  @ValidateNested()
  wallet: Wallet;

  @ApiProperty({
    description: 'Response message',
    example: `Wallet ${
      WalletExample[WalletKeys.WALLET_ADDRESS]
    } retrieved successfully for user ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class UpdateWalletQueryInput {
  @ApiProperty({
    description:
      'If set to true, the updated wallet shall be set as default wallet for the user',
    example: true,
  })
  setAsDefault: boolean;
}

export class UpdateWalletParamInput {
  @ApiProperty({
    description: 'Id of user wallet shall be updated for',
    example: UserExample[UserKeys.USER_ID],
  })
  userId: string;

  @ApiProperty({
    description: 'Address of wallet to update',
    example: WalletExample[WalletKeys.WALLET_ADDRESS],
  })
  walletAddress: string;
}

export class UpdateWalletBodyInput {
  @ApiProperty({
    description: 'Additional data can be attached to the wallet',
    example: WalletExample[WalletKeys.WALLET_DATA],
  })
  @IsOptional()
  data: any;
}

export class UpdateWalletOutput {
  @ApiProperty({
    description: 'Updated wallet',
    example: WalletExample,
  })
  @ValidateNested()
  wallet: Wallet;

  @ApiProperty({
    description: 'Response message',
    example: `Wallet ${
      WalletExample[WalletKeys.WALLET_ADDRESS]
    } updated successfully for user ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}

export class DeleteWalletParamInput {
  @ApiProperty({
    description: 'Id of user wallet shall be deleted for',
    example: UserExample[UserKeys.USER_ID],
  })
  userId: string;

  @ApiProperty({
    description: 'Address of wallet to delete',
    example: WalletExample[WalletKeys.WALLET_ADDRESS],
  })
  walletAddress: string;
}

export class DeleteWalletOutput {
  @ApiProperty({
    description: 'Response message',
    example: `Wallet ${
      WalletExample[WalletKeys.WALLET_ADDRESS]
    } deleted successfully for user ${UserExample[UserKeys.USER_ID]}`,
  })
  message: string;
}
