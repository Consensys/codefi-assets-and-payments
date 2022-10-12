import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

import { ProjectsService } from 'src/services/ProjectsService';
import { ProjectDto, FetchProjectQuery } from 'src/model/dto/ProjectsDto';
import { IdentityDto } from 'src/model/dto/IdentityDto';

@ApiTags('PROJECTS')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly projectsService: ProjectsService,
  ) {
    logger.setContext(ProjectsController.name);
  }

  @Post()
  @ApiOperation({
    summary: 'Create project',
  })
  @ApiBody({
    type: ProjectDto,
  })
  async create(
    @Query() identityQuery: IdentityDto,
    @Body() createProjectDto: ProjectDto,
  ) {
    this.logger.info({
      ...createProjectDto,
    });
    return this.projectsService.create({
      ...createProjectDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Get()
  @ApiOperation({
    summary:
      'Find project by id or defaultDeployment, name & symbol, or find projects by IDs',
  })
  async find(
    @Query() identityQuery: IdentityDto,
    @Query() query: FetchProjectQuery,
  ) {
    if (
      query.projectIds &&
      JSON.parse(query.projectIds) &&
      Array.isArray(JSON.parse(query.projectIds))
    ) {
      return this.projectsService.findBatch({
        tenantId: identityQuery.tenantId,
        projectIds: JSON.parse(query.projectIds),
      });
    } else {
      return this.projectsService.find({
        ...query,
        tenantId: identityQuery.tenantId,
      });
    }
  }

  @Put(':projectId')
  @ApiOperation({
    summary: 'Update project by id',
  })
  @ApiBody({
    type: ProjectDto,
  })
  async update(
    @Query() identityQuery: IdentityDto,
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: ProjectDto,
  ) {
    return this.projectsService.update(projectId, {
      ...updateProjectDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Delete(':projectId')
  @ApiOperation({
    summary: 'Delete project by id',
  })
  async delete(
    @Query() identityQuery: IdentityDto,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.delete(identityQuery.tenantId, projectId);
  }
}
