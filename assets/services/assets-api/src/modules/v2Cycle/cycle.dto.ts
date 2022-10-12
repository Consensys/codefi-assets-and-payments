import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsOptional, Min, Max } from 'class-validator';

import { keys as CycleKeys } from 'src/types/workflow/workflowInstances';
import {
  AssetCycleInstanceExample,
  AssetCycleInstance,
} from 'src/types/asset/cycle';
import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { Type } from 'class-transformer';
import {
  keys as ClientKeys,
  ClientApplicationExample,
} from 'src/types/clientApplication';

export const MAX_CYCLES_COUNT = 50;

export class ListAllCyclesQueryInput {
  @ApiProperty({
    description: 'Index of first cycle to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of cycles to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_CYCLES_COUNT)
  limit: number;

  @ApiProperty({
    description: 'ID of tenant, cycles list shall be filtered for',
    example: ClientApplicationExample[ClientKeys.CLIENT_ID],
  })
  tenantId: string;

  @ApiProperty({
    description: 'ID of token, cycles list shall be filtered for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  tokenId: string;
}

export class ListAllCyclesOutput {
  @ApiProperty({
    description: 'Cycles list',
    example: [AssetCycleInstanceExample],
  })
  @ValidateNested()
  cycles: Array<AssetCycleInstance>;

  @ApiProperty({
    description: 'Number of cycles fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of cycles',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: `Cycles listed successfully, filtered for token ${
      TokenExample[TokenKeys.TOKEN_ID]
    }`,
  })
  message: string;
}

export class RetrieveCycleParamInput {
  @ApiProperty({
    description: 'ID of cycle to retrieve',
    example: 3491,
  })
  cycleId: string;
}

export class RetrieveCycleQueryInput {
  @ApiProperty({
    description: 'ID of tenant, of cycle to retrieve',
    example: ClientApplicationExample[ClientKeys.CLIENT_ID],
  })
  tenantId: string;
}

export class RetrieveCycleOutput {
  @ApiProperty({
    description: 'Retrieved cycle',
    example: AssetCycleInstanceExample,
  })
  @ValidateNested()
  cycle: AssetCycleInstance;

  @ApiProperty({
    description: 'Response message',
    example: `Cycle with index ${CycleKeys.ID} retrieved successfully`,
  })
  message: string;
}
