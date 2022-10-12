import { ApiProperty } from '@nestjs/swagger';

export class RequestElementInstance {
  @ApiProperty()
  elementKey: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  value: string[];

  @ApiProperty()
  data: object;
}
