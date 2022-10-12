import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MailDto {
  @IsString()
  @ApiProperty({
    required: true,
  })
  tenantId: string;

  @IsString()
  @ApiProperty({
    required: true,
  })
  key: string;

  @IsString()
  @ApiProperty({
    required: true,
  })
  subject: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  messageTitle: string;

  @IsString()
  @ApiProperty({
    required: true,
  })
  message: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  buttonLabel: string;
}

export class BulkMailDto {
  @IsArray()
  @ValidateNested({ each: true })
  items: MailDto[];
}

export class MailBuildDto {
  @IsString()
  @ApiProperty({
    required: true,
  })
  tenantId: string;

  @IsString()
  @ApiProperty({
    required: true,
  })
  key: string;

  @IsObject()
  @ApiProperty({
    required: true,
  })
  elements: Record<string, string>;
}

export class FindMailsQuery {
  @IsString()
  @ApiProperty({
    required: true,
  })
  tenantId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  key: string;
}

export class UpdateDeleteMailQuery {
  @IsString()
  @ApiProperty({
    required: true,
  })
  tenantId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  key: string;
}

export class InitMailsDto extends MailDto {
  @IsString({ each: true })
  @ApiProperty({
    type: String,
    required: true,
    isArray: true,
  })
  variables: string[];
}
