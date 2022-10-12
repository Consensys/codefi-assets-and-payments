import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import {
  ProjectDto,
  FetchProjectQuery,
  FetchProjectsQuery,
} from 'src/model/dto/ProjectsDto';
import { Project } from 'src/model/ProjectEntity';
import { prettify, removeEmpty } from 'src/utils/common';
import { requireTenantId, checkTenantId } from 'src/utils/tenant';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create({
    tenantId,
    name,
    key,
    description,
    picture,
    bankAccount,
    kycTemplateId,
    data,
  }: ProjectDto): Promise<Project> {
    requireTenantId(tenantId);

    // Check if inputs are valid
    await this.checkValidInputs(tenantId, undefined, key);

    return this.projectsRepository.save({
      id: uuidv4(),
      tenantId,
      name,
      key,
      description,
      picture,
      bankAccount,
      kycTemplateId,
      data,
    });
  }

  find({
    tenantId,
    projectId: id,
    key,
    name,
  }: FetchProjectQuery): Promise<Array<Project>> {
    requireTenantId(tenantId);

    if (id) {
      return this.projectsRepository.find({
        where: { tenantId, id },
        order: { createdAt: 'DESC' },
      });
    } else if (key) {
      return this.projectsRepository.find({
        where: { tenantId, key },
        order: { createdAt: 'DESC' },
      });
    } else if (name) {
      return this.projectsRepository.find({
        where: { tenantId, name },
        order: { createdAt: 'DESC' },
      });
    } else {
      return this.projectsRepository.find({
        where: [{ tenantId }],
        order: { createdAt: 'DESC' },
      });
    }
  }

  findBatch({
    tenantId,
    projectIds,
  }: FetchProjectsQuery): Promise<Array<Project>> {
    requireTenantId(tenantId);

    if (projectIds?.length > 0) {
      return this.projectsRepository.find({
        where: { tenantId, id: In(projectIds) },
        order: { createdAt: 'DESC' },
      });
    } else {
      return Promise.resolve([]);
    }
  }

  async update(
    projectId: string,
    {
      tenantId,
      name,
      key,
      description,
      picture,
      bankAccount,
      kycTemplateId,
      data,
    }: ProjectDto,
  ): Promise<Project> {
    requireTenantId(tenantId);

    // Find the project
    const targetedProject = await this.projectsRepository.findOne({
      where: { id: projectId },
    });

    // Test if project belongs to the expected tenant
    if (targetedProject) checkTenantId(tenantId, targetedProject.tenantId);

    // If it exists, update it
    if (targetedProject) {
      // Check if inputs are valid
      await this.checkValidInputs(tenantId, projectId, key);

      const updatedProject = await this.projectsRepository.save({
        ...targetedProject,
        ...removeEmpty({
          name,
          key,
          description,
          picture,
          bankAccount,
          kycTemplateId,
          data,
        }),
      });

      this.logger.info(`Updated project: ${prettify(updatedProject)}`);
      return updatedProject;
    } else {
      const error = `Unable to find the project with id=${projectId}`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(
    tenantId: string,
    projectId: string,
  ): Promise<{ message: string }> {
    requireTenantId(tenantId);

    // Find the project
    const targetedProject = await this.projectsRepository.findOne({
      where: { id: projectId },
    });

    // Test if project belongs to the expected tenant
    if (targetedProject) checkTenantId(tenantId, targetedProject.tenantId);

    const { affected } = await this.projectsRepository.delete(projectId);

    if (affected && affected > 0) {
      const message = `${affected} deleted project(s).`;
      this.logger.info(message);
      return { message };
    } else {
      const error = `Unable to find the project with id=${projectId}`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async deleteByTenant(tenantId: string): Promise<{ [key: string]: number }> {
    requireTenantId(tenantId);

    const { affected } = await this.projectsRepository.delete({ tenantId });

    const message = `${affected} deleted project(s).`;
    this.logger.info(message);
    return { deletedProjectsTotal: affected || 0 };
  }

  async checkValidInputs(tenantId, objectId, key): Promise<boolean> {
    const projectsWithSameKey: Array<Project> = await this.find({
      tenantId,
      projectIds: undefined,
      projectId: undefined,
      key,
      name: undefined,
    });

    let problem: boolean;
    if (objectId) {
      // If 'objectId', then it means it is an object update
      if (projectsWithSameKey.length > 1) {
        problem = true;
      } else if (projectsWithSameKey.length === 1) {
        if (projectsWithSameKey[0].id !== objectId) {
          problem = true;
        } else {
          problem = false;
        }
      } else {
        problem = false;
      }
    } else {
      // If not 'objectId', then it means it is an object creation
      if (projectsWithSameKey.length > 0) {
        problem = true;
      } else {
        problem = false;
      }
    }

    if (problem) {
      const error = `Invalid Project inputs: project with key ${key} already exists`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return true;
    }
  }
}
