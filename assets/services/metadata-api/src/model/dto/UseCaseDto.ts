import { IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UseCaseDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsObject()
  @ApiProperty()
  config: any;

  @IsObject()
  @ApiProperty()
  keys: any;
}

export class UserCaseRequestDto {
  @ApiProperty({
    required: true,
  })
  tenantId: string;

  @ApiProperty({
    required: false,
  })
  usecase: string;

  @ApiProperty({
    required: false,
  })
  locale: string;
}
