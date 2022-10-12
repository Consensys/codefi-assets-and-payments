import { ApiProperty } from '@nestjs/swagger';
import {
  ValidateNested,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsNumber,
} from 'class-validator';

import {
  keys as TokenKeys,
  TokenExample,
  TokenInputDataExample,
} from 'src/types/token';
import {
  keys as NavKeys,
  keys as ActionKeys,
} from 'src/types/workflow/workflowInstances';
import { NAV, NavExample } from 'src/types/workflow/workflowInstances/nav';
import { ActionExample } from 'src/types/workflow/workflowInstances/action';
import { keys as UserKeys, UserExample, UserType } from 'src/types/user';
import { Type } from 'class-transformer';

export const MAX_NAV_COUNT = 50;

export class CreateNavBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: NavExample[NavKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description:
      'ID of token, issuer wants to define the NAV (net asset value) for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description:
      'Asset class of token, issuer wants to define the NAV (net asset value) for',
    example: ActionExample[ActionKeys.ASSET_CLASS],
  })
  @IsOptional()
  assetClass: string;

  @ApiProperty({
    description: 'New NAV value',
    example: NavExample[NavKeys.QUANTITY],
  })
  @IsNumber()
  @Min(0)
  navValue: number;

  @ApiProperty({
    description: 'Date after which value can be used as NAV',
    example: ActionExample[ActionKeys.DATE],
  })
  @IsOptional()
  navDate: Date;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;
}

export class CreateNavOutput {
  @ApiProperty({
    description: 'Created NAV data',
    example: NavExample,
  })
  @ValidateNested()
  nav: NAV;

  @ApiProperty({
    description: 'Response message',
    example: 'Nav created successfully',
  })
  message: string;
}

export class CreateNavM2MQuery {
  @ApiProperty({
    description: 'Id of the issuer',
    example: UserExample[UserKeys.USER_ID],
  })
  userId: string;

  @ApiProperty({
    description: 'Id of the tenant',
    example: UserExample[UserKeys.TENANT_ID],
  })
  tenantId: string;
}

export class ListAllNavQueryInput {
  @ApiProperty({
    description: 'Index of first NAV to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of NAVs to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_NAV_COUNT)
  limit: number;

  @ApiProperty({
    description: 'Must be a valid user type: ISSUER | INVESTOR',
    example: UserType.ISSUER,
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({
    description:
      'ID of token, user wants to retrieve list of NAVs (net asset value) for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description:
      'Asset class of token, issuer wants to retrieve list of NAVs (net asset value) for',
    example: ActionExample[ActionKeys.ASSET_CLASS],
  })
  assetClass: string;

  @ApiProperty({
    description:
      "If set to 'true', only NAVs with state 'validated' will be returned",
    example: true,
  })
  @IsOptional()
  filterValidatedNavs: boolean;
}

export class ListAllNavOutput {
  @ApiProperty({
    description: 'Listed NAVs',
    example: [NavExample],
  })
  @ValidateNested()
  navs: Array<NAV>;

  @ApiProperty({
    description: 'Number of NAVs fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of NAVs',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 NAV(s) listed successfully',
  })
  message: string;
}

export class RetrieveNavParamInput {
  @ApiProperty({
    description: 'ID of NAV (net asset value), user wants to retrieve',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  navId: number;
}

export class RetrieveNavOutput {
  @ApiProperty({
    description: 'Retrieved NAV',
    example: NavExample,
  })
  @ValidateNested()
  nav: NAV;

  @ApiProperty({
    description: 'Response message',
    example: `NAV ${NavExample[NavKeys.ID]} listed successfully`,
  })
  message: string;
}
