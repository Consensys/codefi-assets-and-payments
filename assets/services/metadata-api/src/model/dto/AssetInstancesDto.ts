import {
  IsString,
  IsObject,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssetInstanceElementInstance {
  @IsString()
  @ApiProperty()
  key: string;

  @IsArray()
  @ApiProperty({
    type: String,
    isArray: true,
  })
  value: Array<string>;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  classKey: string;
}

export class AssetInstancesDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  tenantId: string;

  @IsUUID()
  @ApiProperty()
  tokenId: string;

  @IsUUID()
  @ApiProperty()
  templateId: string;

  @IsUUID()
  @ApiProperty()
  issuerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({
    type: AssetInstanceElementInstance,
    isArray: true,
  })
  elementInstances: Array<AssetInstanceElementInstance>;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  data: object;
}

export class CheckAssetDataValidityDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  tenantId: string;

  @IsUUID()
  @ApiProperty()
  templateId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({
    type: AssetInstanceElementInstance,
    isArray: true,
  })
  elementInstances: Array<AssetInstanceElementInstance>;
}

export class FetchAssetTemplateDataBatchQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsArray()
  @ApiProperty({ required: true })
  tokenIds: Array<string>;

  @IsArray()
  @ApiProperty({ required: true })
  templateIds: Array<string>;

  @IsArray()
  @ApiProperty({ required: true })
  issuerIds: Array<string>;
}

export class FetchAssetTemplateDataQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  tokenId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  templateId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  issuerId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  tokenIds: string;

  @ApiProperty({ required: false })
  @IsOptional()
  templateIds: string;

  @ApiProperty({ required: false })
  @IsOptional()
  issuerIds: string;
}

export class CheckAssetDataCompletionQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  tokenId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  templateId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  issuerId: string;
}

export class FetchAssetInstancesBatchQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsArray()
  @ApiProperty({ required: false })
  tokenIds: Array<string>;
}
export class FetchAssetInstancesQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  id: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  tokenId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  templateId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  issuerId: string;
}
