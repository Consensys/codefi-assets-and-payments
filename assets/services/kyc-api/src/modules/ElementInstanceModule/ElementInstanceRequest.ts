import { ApiProperty } from '@nestjs/swagger';
import { RequestElementInstance } from './RequestElementInstance';
import { RequestUserInfo } from './RequestUserInfo';

export class ElementInstanceRequest {
  @ApiProperty()
  elementInstances: RequestElementInstance[];

  @ApiProperty()
  userInfo: RequestUserInfo;
}
