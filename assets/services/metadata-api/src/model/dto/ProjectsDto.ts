import {
  IsObject,
  IsString,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProjectDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  tenantId: string;

  @IsString()
  @ApiProperty({
    type: String,
    required: true,
  })
  key: string;

  @IsString()
  @ApiProperty({
    type: String,
    required: true,
  })
  name: string;

  @IsString()
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  description: string;

  @IsArray()
  @ApiProperty({
    type: String,
    isArray: true,
    required: false,
  })
  @IsOptional()
  picture: Array<string>;

  @IsObject()
  @ApiProperty({ required: false })
  @IsOptional()
  bankAccount: object;

  @IsString()
  @ApiProperty({
    type: String,
    required: false,
  })
  kycTemplateId: string;

  @IsObject()
  @ApiProperty({ required: false })
  @IsOptional()
  data: object;
}

export class FetchProjectQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  projectIds: string | undefined;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  projectId: string | undefined;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  key: string | undefined;

  @IsString()
  @ApiProperty({ required: false })
  @IsOptional()
  name: string | undefined;
}

export class FetchProjectsQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsString()
  @ApiProperty({ required: false })
  projectIds: Array<string>;
}
