import { ApiProperty } from '@nestjs/swagger';

export class IdentityDto {
  @ApiProperty({
    required: false,
  })
  tenantId: string;

  @ApiProperty({
    required: false,
  })
  userId: string;
}
