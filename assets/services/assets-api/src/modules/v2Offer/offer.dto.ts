import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsOptional, Min, Max } from 'class-validator';

import { keys as OfferKeys } from 'src/types/workflow/workflowInstances';
import {
  OfferExample,
  Offer,
} from 'src/types/workflow/workflowInstances/offer';
import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { Type } from 'class-transformer';
import { keys as UserKeys, UserExample } from 'src/types/user';

export const MAX_OFFERS_COUNT = 50;

export class RetrieveOfferParamInput {
  @ApiProperty({
    description: 'Index of offer to retrieve',
    example: 3491,
  })
  offerIndex: number;
}

export class RetrieveOfferQueryInput {
  @ApiProperty({
    description:
      "If set 'true', asset data of the token of the specified offer are retrieved as well",
    example: true,
  })
  @IsOptional()
  withAssetData: boolean;
}
export class RetrieveOfferOutput {
  @ApiProperty({
    description: 'Retrieved offer',
    example: OfferExample,
  })
  @ValidateNested()
  offer: Offer;

  @ApiProperty({
    description: 'Response message',
    example: `Offer with index ${OfferKeys.ID} retrieved successfully`,
  })
  message: string;
}

export class ListAllOffersQueryInput {
  @ApiProperty({
    description: 'Index of first offer to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of offers to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_OFFERS_COUNT)
  limit: number;

  @ApiProperty({
    description: 'ID of issuer, offers list shall be filtered for',
    example: UserExample[UserKeys.USER_ID],
  })
  @IsOptional()
  issuerId: string;

  @ApiProperty({
    description: 'ID of token, offers list shall be filtered for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  tokenId: string;

  @ApiProperty({
    description: 'Asset class of token, offers list shall be filtered for',
    example: OfferExample[OfferKeys.ASSET_CLASS],
  })
  @IsOptional()
  assetClass: string;

  @ApiProperty({
    description:
      "If set 'true', asset data of the token of the specified offer are retrieved as well",
    example: true,
  })
  @IsOptional()
  withAssetData: boolean;

  @ApiProperty({
    description:
      'Filter parameter to retrieve offers of specific tokens. The parameter shall be a stringified array of tokenIds.',
    example: JSON.stringify([TokenExample[TokenKeys.TOKEN_ID]]),
  })
  @IsOptional()
  tokenIds: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve offers with specific states. The parameter shall be a stringified array of states.',
    example: JSON.stringify([OfferExample[OfferKeys.STATE]]),
  })
  @IsOptional()
  states: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve offers with specific function names. The parameter shall be a stringified array of functionNames.',
    example: JSON.stringify([OfferExample[OfferKeys.NAME]]),
  })
  @IsOptional()
  functionNames: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve offers of specific users. The parameter shall be a stringified array of userIds.',
    example: JSON.stringify([UserExample[UserKeys.USER_ID]]),
  })
  @IsOptional()
  userIds: string;

  @ApiProperty({
    description:
      'Filter parameter to retrieve offers of specific dates. The parameter shall be a stringified array of dates.',
    example: JSON.stringify([
      OfferExample[OfferKeys.CREATED_AT].toDateString(),
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

export class ListAllOffersOutput {
  @ApiProperty({
    description: 'Offers list',
    example: [OfferExample],
  })
  @ValidateNested()
  offers: Array<Offer>;

  @ApiProperty({
    description: 'Number of offers fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of offers',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: `Offers listed successfully, filtered for token ${
      TokenExample[TokenKeys.TOKEN_ID]
    }`,
  })
  message: string;
}
