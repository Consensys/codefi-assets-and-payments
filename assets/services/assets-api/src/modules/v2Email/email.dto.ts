import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { keys as UserKeys, UserExample } from 'src/types/user';

export class SendInvitationEmailBodyInput {
  @ApiProperty({
    description: 'ID of user, whom invitation email shall be sent to',
    example: UserExample[UserKeys.USER_ID],
  })
  @IsOptional()
  recipientId: string;

  @ApiProperty({
    description: 'Tenant of user, whom invitation email shall be sent to',
    example: UserExample[UserKeys.TENANT_ID],
  })
  @IsOptional()
  tenantId: string;

  @ApiProperty({
    description:
      "Email of user, whom invitation email shall be sent to (only used if user's ID is not specified)",
    example: UserExample[UserKeys.EMAIL],
  })
  @IsOptional()
  email: string;

  @ApiProperty({
    description: 'Tenant name, that will be displayed in the invitation email',
    example: 'Codefi',
  })
  @IsOptional()
  tenantName: string;
}

export class SendInvitationEmailOutput {
  @ApiProperty({
    description: 'Response message',
    example: `Invitation email successfully sent to user with ID ${
      UserExample[UserKeys.USER_ID]
    }`,
  })
  message: string;
}

export class FindMailsQuery {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  key: string;
}

export class MailDto {
  @IsString()
  @ApiProperty({
    required: true,
  })
  key: string;

  @IsString()
  @ApiProperty({
    required: true,
  })
  subject: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  messageTitle: string;

  @IsString()
  @ApiProperty({
    required: true,
  })
  message: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  buttonLabel: string;
}
