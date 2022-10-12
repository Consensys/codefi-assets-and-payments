import { ApiProperty } from '@nestjs/swagger';

import { TopSection } from 'src/models/TopSection';

export class TemplateRequest {
  @ApiProperty()
  issuerId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [TopSection] })
  topSections: TopSection[];

  @ApiProperty()
  data: object;
}
