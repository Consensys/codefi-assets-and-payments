import {
  Injectable,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { v4 as uuidv4 } from 'uuid';
import { validateSync } from 'class-validator';
import fs from 'fs';

import {
  prettify,
  removeEmpty,
  areDatabaseObjectsEqual,
  buildTopSectionsItemKeys,
} from 'src/utils/common';
import {
  AssetTemplatesDto,
  FetchAssetTemplatesBatchQuery,
  FetchAssetTemplatesQuery,
} from 'src/model/dto/AssetTemplatesDto';
import { AssetTemplate } from 'src/model/AssetTemplateEntity';
import { AssetElementsService } from './AssetElementsService';
import { AssetElement } from 'src/model/AssetElementEntity';
import { plainToClass } from 'class-transformer';
import { DEFAULT_TENANT_ID } from 'src/utils/constants';
import { requireTenantId, checkTenantId } from 'src/utils/tenant';
import { AssetElementsDto } from 'src/model/dto/AssetElementsDto';

const elementsFolder = __dirname + '/../configurations/assets/elements';
const templatesFolder = __dirname + '/../configurations/assets/templates';

@Injectable()
export class AssetTemplatesService implements OnModuleInit {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(AssetTemplate)
    private readonly assetTemplatesRepository: Repository<AssetTemplate>,
    private readonly assetElementsService: AssetElementsService,
  ) {}

  async onModuleInit() {
    this.logger.info('Import elements configurations');
    try {
      const elementsFilenames = fs.readdirSync(elementsFolder);
      const allLocalElements: AssetElementsDto[] = [];
      for (const filename of elementsFilenames) {
        try {
          const data = fs.readFileSync(`${elementsFolder}/${filename}`, 'utf8');
          const fileElements: AssetElementsDto[] = JSON.parse(data);
          allLocalElements.push(...fileElements);
        } catch (e) {
          this.logger.error(
            `failed to parse elements ${filename}: ${e.message}`,
          );
        }
      }
      const response = await this.assetElementsService.upsertElements(
        DEFAULT_TENANT_ID,
        allLocalElements,
        false,
      );
      if (response) this.logger.trace(response);
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.info('Import templates configurations');
    const templatesFilenames = fs.readdirSync(templatesFolder);
    for (const filename of templatesFilenames) {
      try {
        this.logger.info(filename);
        const data = fs.readFileSync(`${templatesFolder}/${filename}`, 'utf8');

        const template = JSON.parse(data);
        await this.upsertTemplate(
          template.tenantId || DEFAULT_TENANT_ID,
          template,
          false,
        );
      } catch (e) {
        this.logger.error(`failed to parse template ${filename}: ${e.message}`);
      }
    }
  }

  async upsertTemplate(
    tenantId: string,
    template: AssetTemplatesDto,
    isHTTPRequest = true,
  ) {
    const allDbElements = await this.assetElementsService.find({
      tenantId,
      id: undefined,
      key: undefined,
    });
    const allDbElementsMap: {
      [key: string]: AssetElement;
    } = allDbElements.reduce(
      (map, currentDbElement) => ({
        ...map,
        [currentDbElement.key]: currentDbElement,
      }),
      {},
    );
    const errors = validateSync(plainToClass(AssetTemplatesDto, template));
    if (errors.length > 0) {
      this.logger.error(errors);
      if (isHTTPRequest) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        return;
      }
    } else {
      const templateToCreate = {
        ...template,
      };
      if (!template.tenantId) {
        templateToCreate.tenantId = tenantId;
      }

      if (
        !this.validateTemplate(
          templateToCreate,
          allDbElementsMap,
          isHTTPRequest,
        )
      ) {
        if (isHTTPRequest) {
          const error = 'Element template.';
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error: error,
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          return;
        }
      }

      const allDbTemplates = await this.find({
        tenantId,
        id: undefined,
        name: template.name,
      });
      try {
        if (allDbTemplates.length < 1) {
          await this.create(templateToCreate, isHTTPRequest);
        } else if (allDbTemplates.length > 1) {
          const error = `Shall never happen: multiple templates with name ${template.name} already exist`;
          this.logger.error(error);
          if (isHTTPRequest) {
            throw new HttpException(
              {
                status: HttpStatus.BAD_REQUEST,
                error,
              },
              HttpStatus.BAD_REQUEST,
            );
          } else {
            return;
          }
        } else {
          const matchingDbTemplate: AssetTemplate = allDbTemplates[0];
          if (tenantId !== matchingDbTemplate.tenantId) {
            if (isHTTPRequest) {
              const error = `Template with name: ${matchingDbTemplate.name} already exists for tenant ${matchingDbTemplate.tenantId}, please choose another name`;
              this.logger.error(error);
              throw new HttpException(
                {
                  status: HttpStatus.BAD_REQUEST,
                  error: error,
                },
                HttpStatus.BAD_REQUEST,
              );
            } else {
              return;
            }
          } else if (
            !areDatabaseObjectsEqual(matchingDbTemplate, templateToCreate)
          ) {
            await this.update(
              matchingDbTemplate.id,
              templateToCreate,
              isHTTPRequest,
            );
          }
        }
      } catch (error) {
        this.logger.error(error);
        if (isHTTPRequest) {
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error,
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          return;
        }
      }
    }
  }

  validateTemplate(
    template: AssetTemplatesDto,
    elementsMap: {
      [key: string]: AssetElement;
    },
    isHTTPRequest = true,
  ): boolean {
    const templateKeys = buildTopSectionsItemKeys(template.topSections);
    templateKeys.forEach((key) => {
      if (!elementsMap[key]) {
        const error = `Element with key: ${key} doesn't exist.`;
        this.logger.error(error);
        if (isHTTPRequest) {
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error,
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          return false;
        }
      }
    });

    return true;
  }

  async create(
    template: AssetTemplatesDto,
    isHTTPRequest = true,
  ): Promise<AssetTemplate | undefined> {
    requireTenantId(template.tenantId);

    const {
      tenantId,
      name,
      title,
      category,
      type,
      label,
      description,
      topSections,
      data,
    } = template;

    // Check if inputs are valid
    if (
      !(await this.checkValidInputs(tenantId, undefined, name, isHTTPRequest))
    ) {
      if (isHTTPRequest) {
        const error = 'Invalid inputs.';
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: error,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        return;
      }
    }

    const allDbElements = await this.assetElementsService.find({
      tenantId,
      id: undefined,
      key: undefined,
    });
    const allDbElementsMap: {
      [key: string]: AssetElement;
    } = allDbElements.reduce(
      (map, currentDbElement) => ({
        ...map,
        [currentDbElement.key]: currentDbElement,
      }),
      {},
    );

    if (!this.validateTemplate(template, allDbElementsMap, isHTTPRequest)) {
      if (isHTTPRequest) {
        const error = 'Element template.';
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: error,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        return;
      }
    }

    try {
      return this.assetTemplatesRepository.save({
        id: uuidv4(),
        tenantId,
        category,
        name,
        title,
        type,
        label,
        description,
        topSections,
        data,
      });
    } catch (error) {
      this.logger.error(error);
      if (isHTTPRequest) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        return;
      }
    }
  }

  findBatch({
    tenantId,
    ids,
  }: FetchAssetTemplatesBatchQuery): Promise<Array<AssetTemplate>> {
    requireTenantId(tenantId);

    if (ids?.length) {
      return this.assetTemplatesRepository.find({
        where: [
          { tenantId, id: In(ids) },
          { tenantId: DEFAULT_TENANT_ID, id: In(ids) },
        ],
        order: { createdAt: 'DESC' },
      });
    } else {
      return Promise.resolve([]);
    }
  }

  find({
    tenantId,
    id,
    name,
    category,
  }: FetchAssetTemplatesQuery): Promise<Array<AssetTemplate>> {
    requireTenantId(tenantId);

    if (id) {
      return this.assetTemplatesRepository.find({
        where: [
          { tenantId, id },
          { tenantId: DEFAULT_TENANT_ID, id },
        ],
        order: { createdAt: 'DESC' },
      });
    } else if (name) {
      return this.assetTemplatesRepository.find({
        where: [
          { tenantId, name },
          { tenantId: DEFAULT_TENANT_ID, name },
        ],
        order: { createdAt: 'DESC' },
      });
    } else if (category) {
      return this.assetTemplatesRepository.find({
        where: [
          { tenantId, category },
          { tenantId: DEFAULT_TENANT_ID, category },
        ],
        order: { createdAt: 'DESC' },
      });
    } else {
      return this.assetTemplatesRepository.find({
        where: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
        order: { createdAt: 'DESC' },
      });
    }
  }

  findOne(tenantId: string, id: string): Promise<AssetTemplate | null> {
    requireTenantId(tenantId);

    return this.assetTemplatesRepository.findOne({
      where: [
        { tenantId, id },
        { tenantId: DEFAULT_TENANT_ID, id },
      ],
    });
  }

  async update(
    id: string,
    {
      tenantId,
      category,
      name,
      title,
      type,
      label,
      description,
      topSections,
      data,
    }: AssetTemplatesDto,
    isHttpRequest = true,
  ): Promise<AssetTemplate> {
    requireTenantId(tenantId);

    // Find the template
    const targetTemplate = await this.assetTemplatesRepository.findOne({
      where: { id },
    });

    // If it exists, update it
    if (targetTemplate) {
      // Test if project belongs to the expected tenant
      checkTenantId(tenantId, targetTemplate.tenantId);
      // Check if inputs are valid
      await this.checkValidInputs(tenantId, id, name, true);

      try {
        const updatedTemplate = await this.assetTemplatesRepository.save({
          ...targetTemplate,
          ...removeEmpty({
            category,
            name,
            title,
            type,
            label,
            description,
            topSections,
            data,
          }),
        });
        this.logger.info(`Updated assetTemplate: ${prettify(updatedTemplate)}`);
        return updatedTemplate;
      } catch (error) {
        this.logger.error(error);
        if (isHttpRequest)
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error,
            },
            HttpStatus.BAD_REQUEST,
          );

        throw new Error(error);
      }
    } else {
      const error = `Unable to find the assetTemplate with id=${id}`;
      this.logger.error(error);
      if (isHttpRequest) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new Error(error);
    }
  }

  async delete(tenantId: string, id: string): Promise<{ message: string }> {
    requireTenantId(tenantId);

    // Find the template
    const targetTemplate = await this.assetTemplatesRepository.findOne({
      where: { id },
    });

    // Test if project belongs to the expected tenant
    if (targetTemplate) checkTenantId(tenantId, targetTemplate.tenantId);

    const { affected } = await this.assetTemplatesRepository.delete(id);
    if (affected && affected > 0) {
      const message = `${affected} deleted assetTemplate(s).`;
      this.logger.info(message);
      return { message };
    } else {
      const error = `Unable to find the assetTemplate with id=${id}`;
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

    const { affected } = await this.assetTemplatesRepository.delete({
      tenantId,
    });

    const message = `${affected} deleted assetTemplate(s).`;
    this.logger.info(message);
    return { deletedAssetTemplatesTotal: affected || 0 };
  }

  async checkValidInputs(
    tenantId,
    objectId,
    name,
    isHTTPRequest,
  ): Promise<boolean> {
    const templatesWithSameName: Array<AssetTemplate> = await this.find({
      tenantId,
      id: undefined,
      name,
    });

    let problem: boolean;
    if (objectId) {
      // If 'objectId', then it means it is an object update
      if (templatesWithSameName.length > 1) {
        problem = true;
      } else if (templatesWithSameName.length === 1) {
        if (templatesWithSameName[0].id !== objectId) {
          problem = true;
        } else {
          problem = false;
        }
      } else {
        problem = false;
      }
    } else {
      // If not 'objectId', then it means it is an object creation
      if (templatesWithSameName.length > 0) {
        problem = true;
      } else {
        problem = false;
      }
    }

    if (problem) {
      if (isHTTPRequest) {
        const error = `Template with name: ${name} already exists, please choose another name`;
        this.logger.error(error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
}
