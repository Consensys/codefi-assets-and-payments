import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  ValidateNested,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { LinkExample } from 'src/types/workflow/workflowInstances/link';
import {
  keys as ProjectKeys,
  ProjectExample,
  Project,
} from 'src/types/project';
import { keys as UserKeys, UserType, UserExample, User } from 'src/types/user';
import { Type } from 'class-transformer';

export const MAX_PROJECTS_COUNT = 50;

export const MAX_INVESTORS_COUNT = 50;

export class ListAllProjectsQueryInput {
  @ApiProperty({
    description: 'Index of first project to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of projects to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_PROJECTS_COUNT)
  limit: number;

  @ApiProperty({
    description:
      "If set 'true', user's vehicles, linked to the specified token, are retrieved as well",
    example: true,
  })
  @IsOptional()
  withVehicles: boolean;
}

export class ListAllProjectsOutput {
  @ApiProperty({
    description: 'Listed projects',
    example: [
      {
        ...ProjectExample,
        [ProjectKeys.LINK]: LinkExample,
      },
    ],
  })
  @ValidateNested()
  projects: Array<Project>;

  @ApiProperty({
    description: 'Number of projects fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of projects',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 project(s) listed successfully',
  })
  message: string;
}

export class RetrieveProjectInvestorsQueryInput {
  @ApiProperty({
    description: 'Index of first investors to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of investors to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_INVESTORS_COUNT)
  limit: number;

  @ApiProperty({
    description:
      "If set 'true', user's vehicles, linked to the specified project, are retrieved as well",
    example: true,
  })
  @IsOptional()
  withVehicles: boolean;

  @ApiProperty({
    description:
      "If set 'true', user's balances for the specified project are retrieved as well",
    example: true,
  })
  @IsOptional()
  withBalances: boolean;
}

export class RetrieveProjectInvestorsParamInput {
  @ApiProperty({
    description: 'ID of project, investors shall be retrieved from',
    example: ProjectExample[ProjectKeys.PROJECT_ID],
  })
  projectId: string;
}

export class ListAllProjectInvestorsOutput {
  @ApiProperty({
    description: 'Listed users linked to project (investors)',
    example: [UserExample],
  })
  @ValidateNested()
  users: Array<User>;

  @ApiProperty({
    description: 'Number of investors fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of investors',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '5 investors(s) listed successfully',
  })
  message: string;
}

export class CreateProjectBodyInput {
  @ApiProperty({
    description: "Project's key [NEEDS TO BE UNIQUE]",
    example: ProjectExample[ProjectKeys.KEY],
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: "Project's name",
    example: ProjectExample[ProjectKeys.NAME],
  })
  @IsString()
  name: string;

  @ApiProperty({
    description:
      'ID of KYC template, which will be used for the onboarding of users attached to the project',
    example: ProjectExample[ProjectKeys.KYC_TEMPLATE_ID],
  })
  @IsString()
  kycTemplateId: string;

  @ApiProperty({
    description: 'Description of the project',
    example: ProjectExample[ProjectKeys.DESCRIPTION],
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Picture of the project',
    example: ProjectExample[ProjectKeys.PICTURE],
  })
  @IsOptional()
  picture: Array<string>;

  @ApiProperty({
    description: 'Bank account information for the project',
    example: ProjectExample[ProjectKeys.BANK_ACCOUNT],
  })
  @IsOptional()
  bankAccount: object;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: ProjectExample[ProjectKeys.DATA],
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Address of wallet to use to create the token (only required if not the default wallet)',
    example: UserExample[UserKeys.DEFAULT_WALLET],
  })
  @IsOptional()
  wallet: string;
}

export class CreateProjectOutput {
  @ApiProperty({
    description:
      'Created project (or retrieved project in case it already existed)',
    example: {
      ...ProjectExample,
      [ProjectKeys.LINK]: LinkExample,
    },
  })
  @ValidateNested()
  project: Project;

  @ApiProperty({
    description:
      "'true' if a new project has been created, 'false' if project already existed and has been retrieved",
    example: true,
  })
  newProject: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Project ${
      ProjectExample[ProjectKeys.PROJECT_ID]
    } successfully created`,
  })
  message: string;
}

export class RetrieveProjectQueryInput {
  @ApiProperty({
    description:
      'Must be a valid user type:  | ADMIN | ISSUER | INVESTOR | VEHICLE',
    example: 'ISSUER',
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({
    description:
      "If set 'true', user's vehicles, linked to the specified project, are retrieved as well",
    example: true,
  })
  @IsOptional()
  withVehicles: boolean;
}

export class RetrieveProjectParamInput {
  @ApiProperty({
    description: 'Id of project to retrieve',
    example: ProjectExample[ProjectKeys.PROJECT_ID],
  })
  projectId: string;
}

export class RetrieveProjectOutput {
  @ApiProperty({
    description: 'Retrieved project',
    example: ProjectExample,
  })
  @ValidateNested()
  project: Project;

  @ApiProperty({
    description: 'Response message',
    example: `Project ${
      ProjectExample[ProjectKeys.PROJECT_ID]
    } retrieved successfully`,
  })
  message: string;
}

export class UpdateProjectParamInput {
  @ApiProperty({
    description: 'Id of project to update',
    example: ProjectExample[ProjectKeys.PROJECT_ID],
  })
  projectId: string;
}

export class UpdateProjectBodyInput {
  @ApiProperty({
    description: 'Project parameters to update',
    example: {
      [ProjectKeys.NAME]: ProjectExample[ProjectKeys.NAME],
      [ProjectKeys.DESCRIPTION]: ProjectExample[ProjectKeys.DESCRIPTION],
      [ProjectKeys.PICTURE]: ProjectExample[ProjectKeys.PICTURE],
      [ProjectKeys.DATA]: {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
        keyn: 'valuen',
      },
    },
  })
  updatedParameters: any;
}

export class UpdateProjectOutput {
  @ApiProperty({
    description: 'Updated project',
    example: ProjectExample,
  })
  @ValidateNested()
  project: Project;

  @ApiProperty({
    description: 'Response message',
    example: `Project ${
      ProjectExample[ProjectKeys.PROJECT_ID]
    } updated successfully`,
  })
  message: string;
}

export class DeleteProjectParamInput {
  @ApiProperty({
    description: 'Id of project to delete',
    example: ProjectExample[ProjectKeys.PROJECT_ID],
  })
  projectId: string;
}

export class DeleteProjectOutput {
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
    description: 'Array of deleted links IDs',
    example: [23, 57, 88, 99, 173],
  })
  deletedLinks: Array<number>;

  @ApiProperty({
    description: 'Response message',
    example: `Project ${
      ProjectExample[ProjectKeys.PROJECT_ID]
    } deleted successfully`,
  })
  message: string;
}
