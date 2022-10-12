import {
  IsString,
  IsObject,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssetType, TokenCategory } from 'src/utils/constants';
import { Translation } from '../common';

export class AssetTemplateSection {
  @IsObject()
  @ApiProperty()
  label: Translation;

  @IsString()
  @ApiProperty({ required: true })
  key: string;

  @IsObject()
  @ApiProperty({ required: false })
  title: Translation;

  @IsObject()
  @ApiProperty({ required: false })
  @IsOptional()
  description: Translation;

  @ApiProperty({
    type: String,
    isArray: true,
  })
  elements: Array<string>;
}

export class AssetTemplateTopSection {
  @IsObject()
  @ApiProperty({ required: true })
  label: Translation;

  @IsObject()
  @ApiProperty({ required: false })
  @IsOptional()
  legend: Translation;

  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({ type: AssetTemplateSection, isArray: true })
  sections: Array<AssetTemplateSection>;

  @IsString()
  @ApiProperty({ required: true })
  key: string;

  @IsBoolean()
  @ApiProperty({ required: true })
  multiple: boolean;
}

export class AssetTemplatesDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  tenantId: string;

  @IsIn(Object.values(TokenCategory))
  @ApiProperty({
    enum: TokenCategory,
  })
  category: TokenCategory;

  @IsString()
  @ApiProperty()
  name: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  title: Translation;

  @IsIn(Object.values(AssetType))
  @ApiProperty({
    enum: AssetType,
  })
  type: AssetType;

  @IsObject()
  @ApiProperty()
  label: Translation;

  @IsObject()
  @ApiProperty()
  @IsOptional()
  description: Translation;

  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({ type: AssetTemplateTopSection, isArray: true })
  topSections: Array<AssetTemplateTopSection>;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  data: object;
}

export class FetchAssetTemplatesBatchQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsArray()
  @ApiProperty({ required: false })
  ids: Array<string>;
}
export class FetchAssetTemplatesQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  id: string | undefined;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  name: string;

  @IsString()
  @ApiProperty({
    required: false,
    enum: Object.values(TokenCategory),
  })
  @IsOptional()
  category?: TokenCategory;
}
