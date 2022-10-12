import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { keys as UserKeys, UserExample } from 'src/types/user';

export class DocumentDownloadQueryInput {
  @ApiProperty({
    description: 'ID of document submitter',
    example: UserExample[UserKeys.USER_ID],
  })
  @IsOptional()
  @IsString()
  submitterId: string;

  @ApiProperty({
    description:
      "ID of token - optional - used to retrieve a user's token-related data",
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  @IsString()
  tokenId: string;

  @ApiProperty({
    description:
      "ID of project - optional - used to retrieve a user's project-related data",
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  @IsString()
  projectId: string;

  @ApiProperty({
    description:
      "ID of issuer - optional - used to retrieve a user's issuer-related data as a verifier",
    example: UserExample[UserKeys.USER_ID],
  })
  @IsOptional()
  @IsString()
  issuerId: string;
}
