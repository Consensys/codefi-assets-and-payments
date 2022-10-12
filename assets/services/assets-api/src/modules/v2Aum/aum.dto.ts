import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_TOKENS_COUNT } from '../v2Token/token.dto';

export class ListAumsQueryInput {
  @ApiProperty({
    description: 'Index of first token with Aum to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of tokens with Aum to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_TOKENS_COUNT)
  limit: number;
}
export class ListAumsOutput {
  @ApiProperty({
    description: 'Cumulated Aum of all tokens',
    example: 10000000,
  })
  @ValidateNested()
  aum: number;

  @ApiProperty({
    description: 'Number of tokens with Aum fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of tokens with Aum',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 token(s) with Aum listed successfully',
  })
  message: string;
}
