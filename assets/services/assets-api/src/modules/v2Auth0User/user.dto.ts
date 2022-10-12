import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  ValidateNested,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

import { UserExample, keys as UserKeys } from 'src/types/user';
import { LinkExample } from 'src/types/workflow/workflowInstances/link';
import { Type, Transform } from 'class-transformer';
import { sanitize } from 'src/utils/sanitize';
import { Auth0User, Auth0UserExample } from 'src/types/authentication';

export const MAX_USERS_COUNT = 50;

export class ListAllAuth0UsersQueryInputV2 {
  @ApiProperty({
    description: 'Index of first users to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of users to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_USERS_COUNT)
  limit: number;
}

export class ListAllAuth0UsersOutputV2 {
  @ApiProperty({
    description: 'Listed users',
    example: [
      {
        ...UserExample,
        [UserKeys.LINK]: LinkExample,
      },
    ],
  })
  @ValidateNested()
  users: Array<Auth0User>;

  @ApiProperty({
    description: 'Number of users fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of users',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 user(s) listed successfully',
  })
  message: string;
}

export class CreateAuth0UserBodyInputV2 {
  @ApiProperty({
    description: 'Must be a valid email',
    example: UserExample[UserKeys.EMAIL],
  })
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty({
    description: "User's first name",
    example: UserExample[UserKeys.FIRST_NAME],
  })
  @IsString()
  @IsNotEmpty()
  @Transform(sanitize)
  firstName: string;

  @ApiProperty({
    description: "User's last name",
    example: UserExample[UserKeys.LAST_NAME],
  })
  @IsString()
  @IsNotEmpty()
  @Transform(sanitize)
  lastName: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'xxx-xxx-xxx',
  })
  password: string;
}

export class CreateAuth0UserOutputV2 {
  @ApiProperty({
    description: 'Created user (or retrieved user in case it already existed)',
    example: Auth0UserExample,
  })
  @ValidateNested()
  user: Auth0User;

  @ApiProperty({
    description:
      "'true' if a new user has been created, 'false' if user already existed and has been retrieved",
    example: true,
  })
  newUser: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `User ${Auth0UserExample.userId} successfully created`,
  })
  message: string;
}
