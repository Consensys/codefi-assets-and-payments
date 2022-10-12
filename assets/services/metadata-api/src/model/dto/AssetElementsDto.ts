import {
  IsString,
  IsObject,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsUUID,
  IsNumber,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import {
  AssetElementType,
  AssetElementFileType,
  AssetElementStatus,
} from 'src/utils/constants';
import { Translation } from '../common';

export class AssetElementInput {
  @IsString()
  @ApiProperty()
  key: string;

  @IsObject()
  @ApiProperty()
  label: Translation;
}

export class AssetElementsDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  tenantId: string;

  @IsString()
  @ApiProperty()
  key: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  map: string;

  @IsIn(Object.values(AssetElementType))
  @ApiProperty({
    enum: AssetElementType,
  })
  type: AssetElementType;

  @IsIn(Object.values(AssetElementStatus))
  @ApiProperty({
    enum: AssetElementStatus,
  })
  status: AssetElementStatus;

  @IsObject()
  @ApiProperty()
  label: Translation;

  @IsObject()
  @ApiProperty()
  @IsOptional()
  sublabel: Translation;

  @IsObject()
  @ApiProperty()
  @IsOptional()
  placeholder: Translation;

  @IsObject()
  @ApiProperty()
  @IsOptional()
  rightTag: Translation;

  @IsObject()
  @ApiProperty()
  @IsOptional()
  leftTag: Translation;

  @IsBoolean()
  @ApiProperty()
  @IsOptional()
  multiline: boolean;

  @IsNumber()
  @ApiProperty()
  @IsOptional()
  maxLength: number;

  @IsNumber()
  @ApiProperty()
  @IsOptional()
  size: 1 | 2 | 3 | 4 | 5;

  @IsIn(Object.values(AssetElementFileType))
  @ApiProperty({
    enum: AssetElementFileType,
  })
  @IsOptional()
  fileAccept: AssetElementFileType;

  @IsString()
  @ApiProperty()
  @IsOptional()
  name: string;

  @IsBoolean()
  @ApiProperty()
  @IsOptional()
  fillLine: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({
    type: AssetElementInput,
    isArray: true,
  })
  @IsOptional()
  inputs: Array<AssetElementInput>;

  @IsArray()
  @ApiProperty({
    type: String,
    isArray: true,
  })
  @IsOptional()
  options: Array<
    | string
    | {
        label: Translation;
        value: string;
      }
  >;

  @IsBoolean()
  @ApiProperty()
  updatable: boolean;

  @IsBoolean()
  @ApiProperty()
  @IsOptional()
  hidden: boolean;

  @IsString()
  @ApiProperty()
  @IsOptional()
  defaultValue: string;
}

export class FetchAssetElementQuery {
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
  key: string | undefined;
}
