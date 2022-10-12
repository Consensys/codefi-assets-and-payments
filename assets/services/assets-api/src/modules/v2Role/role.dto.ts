import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';

import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { keys as UserKeys, UserExample } from 'src/types/user';
import { Link, LinkExample } from 'src/types/workflow/workflowInstances/link';

export class AddVerifierOutput {
  @ApiProperty({
    description: 'Created link between KYC verifier and entity',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description:
      "'true' if a new link has been created, 'false' if link already existed and has been retrieved",
    example: true,
  })
  newLink: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Verifier ${
      UserExample[UserKeys.USER_ID]
    } succesfully added to entity ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}
