import { IsUUID, IsIn, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UserType, AccessType } from 'src/utils/constants';

export class IamCheckQuery {
  @IsString()
  @ApiProperty({ required: false })
  tenantId: string;

  @IsIn(Object.values(UserType))
  @ApiProperty({ enum: UserType })
  userType: UserType;

  @IsIn(Object.values(AccessType))
  @ApiProperty({ enum: AccessType })
  accessType: AccessType;

  @IsUUID()
  @ApiProperty()
  functionExecuterId: string;

  @IsUUID()
  @ApiProperty()
  functionCallerId: string;
}

export class HeaderData {
  @IsObject()
  @ApiProperty({ required: true })
  authorization: string;
}
