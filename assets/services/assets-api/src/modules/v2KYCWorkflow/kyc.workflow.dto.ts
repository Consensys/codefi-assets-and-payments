import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';

import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { keys as UserKeys, UserExample } from 'src/types/user';
import { Link, LinkExample } from 'src/types/workflow/workflowInstances/link';

export class InviteOutput {
  @ApiProperty({
    description: 'Created link between investor and entity',
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
    example: `Investor ${
      UserExample[UserKeys.USER_ID]
    } succesfully invited to provide KYC elements for entity ${
      TokenExample[TokenKeys.TOKEN_ID]
    }`,
  })
  message: string;
}

export class SubmitOutput {
  @ApiProperty({
    description: 'Retrieved/updated link between investor and entity',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description:
      "'true' if link has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `KYC succesfully submitted by investor ${
      UserExample[UserKeys.USER_ID]
    } for entity ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}

export class ReviewOutput {
  @ApiProperty({
    description: 'Retrieved/updated link between investor and entity',
    example: LinkExample,
  })
  @ValidateNested()
  link: Link;

  @ApiProperty({
    description:
      "'true' if link has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `KYC succesfully validated for investor ${
      UserExample[UserKeys.USER_ID]
    } for entity ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}

export class AllowListOutput {
  @ApiProperty({
    description: 'Retrieved/updated link between investor and entity',
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
    example: `User ${
      UserExample[UserKeys.USER_ID]
    } successfully allowListed for entity ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}

export class UnvalidateOutput {
  @ApiProperty({
    description: 'Unvalidated link between investor and entity',
    example: [LinkExample],
  })
  @ValidateNested()
  links: Array<Link>;

  @ApiProperty({
    description: 'Response message',
    example: `User ${
      UserExample[UserKeys.USER_ID]
    } unvalidated successfully for entity ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}

export class UnlinkOutput {
  @ApiProperty({
    description: 'IDs of deleted element reviews',
    example: [
      'd9558f63-4457-4393-9785-45bbda8e5c6c',
      '2fc73d9d-186d-496c-843c-3c7a13d3dc23',
    ],
  })
  deletedElementReviews: Array<string>;

  @ApiProperty({
    description: 'IDs of deleted template reviews',
    example: ['5056f94d-e080-4ef2-ac46-9ec5b450bce7'],
  })
  deletedTemplateReviews: Array<string>;

  @ApiProperty({
    description: 'Response message',
    example: `User ${
      UserExample[UserKeys.USER_ID]
    } unlinked successfully from entity ${TokenExample[TokenKeys.TOKEN_ID]}`,
  })
  message: string;
}
