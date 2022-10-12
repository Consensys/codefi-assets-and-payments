import { ApiProperty } from '@nestjs/swagger';

import { Translation } from './Translation';
import { Section } from './Section';
import { IsOptional } from 'class-validator';

export class TopSection {
  @ApiProperty()
  key: string;

  @ApiProperty()
  label: Translation;

  @ApiProperty()
  @IsOptional()
  description?: Translation;

  @ApiProperty({ type: [Section] })
  sections: Section[];
}
