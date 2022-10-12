import { ApiProperty } from '@nestjs/swagger';

import { Translation } from 'src/models/Translation';
import { Input } from 'src/models/Input';
import { ElementStatus } from 'src/utils/constants/enum';

export class ElementRequest {
  @ApiProperty()
  key: string;

  @ApiProperty()
  type: string;

  @ApiProperty({
    enum: [
      ElementStatus.MANDATORY,
      ElementStatus.OPTIONAL,
      ElementStatus.CONDITIONAL,
    ],
  })
  status: string;

  @ApiProperty()
  label: Translation;

  @ApiProperty()
  placeholder: Translation;

  @ApiProperty({ type: [Input] })
  inputs: Input[];

  @ApiProperty()
  data: object;
}
