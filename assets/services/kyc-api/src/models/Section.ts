import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { Translation } from './Translation';

export class Section {
  @ApiProperty()
  key: string;

  @ApiProperty()
  label: Translation;

  @ApiProperty()
  @IsOptional()
  description?: Translation;

  @ApiProperty()
  elements: string[];
}
