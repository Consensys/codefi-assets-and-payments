// import { ApiProperty } from '@nestjs/swagger';
// import { ValidateNested, IsOptional } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import {
  AssetTemplateExample,
  AssetTemplate,
  RawAssetTemplateExample,
} from 'src/types/asset/template';
import { keys as TokenKeys, TokenExample } from 'src/types/token';
import {
  AssetElementInstanceExample,
  AssetElementInstance,
} from 'src/types/asset/elementInstance';

export class RetrieveAssetDataQueryInput {
  @IsString()
  @ApiProperty({
    required: true,
    description: 'Asset template ID',
  })
  templateId: string;

  @IsString()
  @ApiProperty({
    required: true,
    description: 'Asset token ID',
  })
  tokenId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description:
      'ID of issuer of the token (required when issuer is not defined, e.g. not already linked to the token)',
  })
  issuerId: string;
}

export class RetrieveAssetDataOutput {
  @ApiProperty({
    description: 'Retrieved asset data',
    example: [AssetTemplateExample],
  })
  @ValidateNested()
  assetData: AssetTemplate;

  @ApiProperty({
    description: 'Response message',
    example: `Asset data retrieved successfully for token ${
      TokenExample[TokenKeys.TOKEN_ID]
    } and asset template ${RawAssetTemplateExample.id}`,
  })
  message: string;
}

export class SaveAssetDataBodyInput {
  @IsString()
  @ApiProperty()
  tokenId: string;

  @IsString()
  @ApiProperty()
  templateId: string;

  @IsArray()
  @ValidateNested({ each: true })
  elementInstances: Array<AssetElementInstance>;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  data: object;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description:
      'ID of issuer of the token (required when issuer is not defined, e.g. not already linked to the token)',
  })
  issuerId: string;
}

export class SaveAssetDataOutput {
  @ApiProperty({
    description: 'Retrieved asset data',
    example: [AssetElementInstanceExample],
  })
  @ValidateNested()
  assetData: Array<AssetElementInstance>;

  @ApiProperty({
    description: 'Response message',
    example: 'Asset data saved successfully (5 elements saved)',
  })
  message: string;
}
