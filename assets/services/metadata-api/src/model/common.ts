import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Translation {
  @IsString()
  @ApiProperty()
  fr: string;

  @IsString()
  @ApiProperty()
  en: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  ja: string;
}
