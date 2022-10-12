import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsOptional, Min, Max } from 'class-validator';

import { keys as ActionKeys } from 'src/types/workflow/workflowInstances';
import {
  ActionExample,
  Action,
} from 'src/types/workflow/workflowInstances/action';
import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { keys as UserKeys, UserExample } from 'src/types/user';
import { TransitionInstance } from 'src/types/workflow/transition';
import { Type } from 'class-transformer';

export const MAX_ACTIONS_COUNT = 50;

export class RetrieveActionParamInput {
  @ApiProperty({
    description: 'Index of action to retrieve',
    example: 3491,
  })
  actionIndex: number;
}

export class RetrieveActionOutput {
  @ApiProperty({
    description: 'Retrieved action',
    example: ActionExample,
  })
  @ValidateNested()
  action: Action;

  @ApiProperty({
    description: 'Response message',
    example: `Action with index ${ActionKeys.ID} retrieved successfully`,
  })
  message: string;
}

export class ListAllActionsQueryInput {
  @ApiProperty({
    description: 'Index of first action to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of actions to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_ACTIONS_COUNT)
  limit: number;

  @ApiProperty({
    description: 'ID of token, actions list shall be filtered for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  tokenId: string;

  @ApiProperty({
    description: 'Asset class of token, actions list shall be filtered for',
    example: ActionExample[ActionKeys.ASSET_CLASS],
  })
  @IsOptional()
  assetClass: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve actions of specific tokens. The parameter shall be a stringified array of tokenIds.',
    example: JSON.stringify([TokenExample[TokenKeys.TOKEN_ID]]),
  })
  @IsOptional()
  tokenIds: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve actions with specific states. The parameter shall be a stringified array of states.',
    example: JSON.stringify([ActionExample[ActionKeys.STATE]]),
  })
  @IsOptional()
  states: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve actions with specific function names. The parameter shall be a stringified array of functionNames.',
    example: JSON.stringify([ActionExample[ActionKeys.NAME]]),
  })
  @IsOptional()
  functionNames: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve actions of specific users. The parameter shall be a stringified array of userIds.',
    example: JSON.stringify([UserExample[UserKeys.USER_ID]]),
  })
  @IsOptional()
  userIds: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve actions of specific dates. The parameter shall be a stringified array of dates.',
    example: JSON.stringify([
      ActionExample[ActionKeys.CREATED_AT].toDateString(),
    ]),
  })
  @IsOptional()
  dates: string;

  @ApiProperty({
    description: 'Sort paramter to sort orders.',
    isArray: true,
    type: String,
    example: JSON.stringify([{ critieria: 'DESC' }]),
  })
  @IsOptional()
  sorts: string;
}

export class ListAllActionsOutput {
  @ApiProperty({
    description: "User's actions list",
    example: [ActionExample],
  })
  @ValidateNested()
  actions: Array<Action>;

  @ApiProperty({
    description: 'Number of actions fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of actions',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: `Actions listed successfully for user ${
      UserExample[UserKeys.USER_ID]
    }, filtered for token ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}

export class RetrieveHistoryOutput {
  @ApiProperty({
    description: 'Retrieved transitions',
  })
  @ValidateNested()
  transitions: TransitionInstance[];

  @ApiProperty({
    description: 'Response message',
  })
  message: string;
}
