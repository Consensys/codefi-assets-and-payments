import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { Translation } from './Translation';

export class Input {
  @ApiProperty()
  label: Translation;

  @ApiProperty()
  @IsOptional()
  relatedElements?: string[];
}
