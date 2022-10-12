import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { AssetElementInstance } from 'src/types/asset/elementInstance';
import { Fees, FeesExample, FeesScope } from 'src/types/fees';

import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { keys as UserKeys, UserExample } from 'src/types/user';

export class CreateFeesParamInput {
  @ApiProperty({
    description: 'ID of token, fees shall be created/updated for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class CreateFeesBodyInput {
  @ApiProperty({
    description: 'Asset class of token, fees shall be created/updated for',
    example: 'classa',
  })
  @IsOptional()
  assetClass: string;

  @ApiProperty({
    description: 'ID of the user, fees shall be created/updated for',
    example: UserExample[UserKeys.USER_ID],
  })
  investorId: string;

  @ApiProperty({
    description: 'Fees that shall be created/updated',
    example: FeesExample,
  })
  @IsOptional()
  @ValidateNested()
  fees: Fees;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  elementInstances: Array<AssetElementInstance>;
}

export class CreateFeesOutput {
  @ApiProperty({
    description: 'Created token fees',
    example: [FeesExample],
  })
  fees?: Fees;

  @ApiProperty({
    description: 'elementInstances',
  })
  elementInstances?: Array<AssetElementInstance>;

  @ApiProperty({
    description:
      'Scope of retrieved fees (token | assetClass | tokenInvestor | assetClassInvestor)',
    example: [FeesExample],
  })
  scope: FeesScope;

  @ApiProperty({
    description: 'Response message',
    example: '5 token(s) created/updated successfully',
  })
  message: string;
}

export class RetrieveFeesParamInput {
  @ApiProperty({
    description: 'ID of token, fees shall be retrieved from',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;
}

export class RetrieveFeesQueryInput {
  @ApiProperty({
    description: 'Asset class of token, fees shall be retrieved from',
    example: 'classa',
  })
  @IsOptional()
  assetClass: string;

  @ApiProperty({
    description: 'ID of the user, fees shall be retrieved for',
    example: UserExample[UserKeys.USER_ID],
  })
  investorId: string;
}

export class RetrieveFeesOutput {
  @ApiProperty({
    description: 'Retrieved token fees',
    example: [FeesExample],
  })
  fees: Fees;

  @ApiProperty({
    description:
      'Scope of retrieved fees (token | assetClass | tokenInvestor | assetClassInvestor)',
    example: [FeesExample],
  })
  @IsEnum(FeesScope)
  scope: FeesScope;

  @ApiProperty({
    description: 'Response message',
    example: '5 token(s) listed successfully',
  })
  message: string;
}
