import {
  IsString,
  IsObject,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrimaryColumn } from 'typeorm';
import { AssetType, UserType } from 'src/utils/constants';

export class ConfigsDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  logo: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  mailLogo: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  mailColor: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  mainColor: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  mainColorLight: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  mainColorLighter: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  mainColorDark: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  mainColorDarker: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  language: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  region: string;

  @IsEnum(AssetType, {
    each: true,
    message: `restrictedAssetTypes must be an array of ${Object.values(
      AssetType,
    )}`,
  })
  @IsArray()
  @IsOptional()
  @ApiProperty({
    required: false,
    isArray: true,
    enum: AssetType,
  })
  restrictedAssetTypes: AssetType[];

  @IsEnum(UserType, {
    each: true,
    message: `restrictedUserTypes must be an array of ${Object.values(
      UserType,
    )}`,
  })
  @IsArray()
  @IsOptional()
  @ApiProperty({
    required: false,
    isArray: true,
    enum: UserType,
  })
  restrictedUserTypes: UserType[];

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  data: object;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  preferences: object;
}

export class InitConfigsDto extends ConfigsDto {
  @IsString()
  @IsOptional()
  @PrimaryColumn()
  @ApiProperty({
    type: String,
    required: true,
  })
  userId: string;

  @IsString()
  @PrimaryColumn()
  @ApiProperty({
    type: String,
    required: true,
  })
  tenantId: string;
}
