import { ApiProperty } from '@nestjs/swagger';

export class Translation {
  @ApiProperty()
  fr: string;

  @ApiProperty()
  en: string;
}
