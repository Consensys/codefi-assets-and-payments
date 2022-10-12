import { ApiProperty } from '@nestjs/swagger';

export class RequestUserInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;
}
