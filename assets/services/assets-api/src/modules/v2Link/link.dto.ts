import { ApiProperty } from '@nestjs/swagger';
import {
  ValidateNested,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

import { UserType } from 'src/types/user';
import { Type } from 'class-transformer';
import { Link, LinkExample } from 'src/types/workflow/workflowInstances/link';
import { EntityType } from 'src/types/entity';

export const MAX_LINKS_COUNT = 50;

export class ListAllLinksQueryInput {
  @ApiProperty({
    description: 'Index of first link to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of links to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_LINKS_COUNT)
  limit: number;

  @ApiProperty({
    description: `[OPTIONAL] Shall be chose amongst ${UserType.INVESTOR}(default), ${UserType.ISSUER}, ${UserType.UNDERWRITER}, ${UserType.VERIFIER}, ${UserType.NAV_MANAGER},
  ${UserType.NOTARY}`,
    example: UserType.INVESTOR,
  })
  @IsEnum(UserType)
  @IsOptional()
  userType: UserType;

  @ApiProperty({
    description: `[OPTIONAL] Shall be chose amongst ${EntityType.ISSUER}, ${EntityType.TOKEN}, ${EntityType.PROJECT},
  ${UserType.NOTARY}`,
    example: EntityType.ISSUER,
  })
  @IsEnum(EntityType)
  @IsOptional()
  entityType: EntityType;

  @ApiProperty({
    description: 'ID of entity, actions list shall be filtered for',
    example: 'bf5db45e-aac1-485d-ad1f-f4e203dcfeab',
  })
  @IsUUID('4')
  @IsOptional()
  entityId: string;

  @ApiProperty({
    description: 'Asset class of token, actions list shall be filtered for',
    example: 'a',
  })
  @IsOptional()
  assetClass: string;
}

export class ListAllLinksOutput {
  @ApiProperty({
    description: 'Listed links',
    example: [LinkExample],
  })
  @ValidateNested()
  links: Array<Link>;

  @ApiProperty({
    description: 'Number of links fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of links',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 link(s) listed successfully',
  })
  message: string;
}

export class ListAllLinksParamInput {
  @ApiProperty({
    description: 'userId',
    example: 'bf5db45e-aac1-485d-ad1f-f4e203dcfeab',
  })
  userId: string;
}
