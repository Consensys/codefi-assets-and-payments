import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { NestJSPinoLogger } from '@consensys/observability';

import { ElementService } from 'src/modules/ElementModule/ElementService';

import { buildTopSectionsElementKeys } from 'src/utils/helper';
import { TopSection } from 'src/models/TopSection';

import { TemplateRequest } from './TemplateRequest';
import { TemplateModel } from './TemplateModel';
import { ElementStatus } from 'src/utils/constants/enum';
import { ElementModel } from '../ElementModule/ElementModel';

import { DEFAULT_TENANT_ID } from '../../utils/constants/constants';

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(TemplateModel)
    private readonly templateModel: typeof TemplateModel,
    private readonly logger: NestJSPinoLogger,
    private readonly elementService: ElementService,
  ) {}

  async create(
    tenantId: string,
    { issuerId, name, topSections, data }: TemplateRequest,
  ): Promise<[TemplateModel, boolean]> {
    await this.checkTopSections(tenantId, topSections);
    return await this.templateModel.findOrCreate({
      where: {
        tenantId,
        name,
      },
      defaults: {
        issuerId,
        topSections,
        data,
      },
    });
  }

  async checkTopSections(
    tenantId: string,
    topSections: TopSection[],
  ): Promise<void> {
    // build array of distinct element keys
    const elementKeys: string[] = buildTopSectionsElementKeys(topSections);

    // fetch the correspondant ElementModel for each element key
    const elementsLists: ElementModel[] = await this.elementService.findAll(
      tenantId,
      elementKeys,
    );

    const elementsMap: { [key: string]: ElementModel } = elementsLists.reduce(
      (map, curr: ElementModel) => ({ ...map, [curr.key]: curr }),
      {},
    );

    await Promise.all(
      elementKeys.map(async (elementKey: string) => {
        // Check if element exists (e.g. check if element was correctly fetched)
        if (!elementsMap[elementKey]) {
          const errorMessage = `Invalid topSections input: element with key ${elementKey} does not exist`;
          this.logger.error(errorMessage);

          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error: errorMessage,
            },
            400,
          );
        }

        // Check if inputs are correctly defined (if any)
        if (
          elementsMap[elementKey].inputs &&
          elementsMap[elementKey].inputs.length > 0
        ) {
          await Promise.all(
            elementsMap[elementKey].inputs.map(async (input) => {
              if (input.relatedElements && input.relatedElements.length > 0) {
                const fetchedRelatedItems = await this.elementService.findAll(
                  tenantId,
                  input.relatedElements,
                );

                if (!fetchedRelatedItems.length) {
                  const errorMessage = `Invalid topSections input: relatedElements with keys [${input.relatedElements.join(
                    ',',
                  )}] does not exist`;
                  this.logger.error(errorMessage);
                  throw new HttpException(
                    {
                      status: HttpStatus.BAD_REQUEST,
                      error: errorMessage,
                    },
                    400,
                  );
                }

                const fetchedRelatedItemsMap: { [key: string]: ElementModel } =
                  fetchedRelatedItems.reduce(
                    (map, curr: ElementModel) => ({ ...map, [curr.key]: curr }),
                    {},
                  );

                input.relatedElements.forEach((relatedElementKey) => {
                  // Check if relatedItem exists (e.g. check if relatedItem was correctly fetched)
                  const fetchedRelatedItem =
                    fetchedRelatedItemsMap[relatedElementKey];
                  if (!fetchedRelatedItem) {
                    const message = `Invalid topSections input: relatedItem with key ${relatedElementKey} does not exist`;
                    this.logger.error(message);

                    throw new HttpException(
                      {
                        status: HttpStatus.BAD_REQUEST,
                        error: message,
                      },
                      400,
                    );
                  }

                  // Check if relatedItem has a correct status (e.g. either "conditional" or "optional")
                  if (
                    fetchedRelatedItem.status !== ElementStatus.CONDITIONAL &&
                    fetchedRelatedItem.status !== ElementStatus.OPTIONAL
                  ) {
                    const errorMessage = `Invalid topSections input: status of relatedItem with key ${fetchedRelatedItem.key} shall either be conditional or optional`;
                    this.logger.error(errorMessage);
                    throw new HttpException(
                      {
                        status: HttpStatus.BAD_REQUEST,
                        error: errorMessage,
                      },
                      400,
                    );
                  }

                  // Verify relatedItem has no relatedElements himself
                  if (
                    fetchedRelatedItem.inputs &&
                    fetchedRelatedItem.inputs.length > 0
                  ) {
                    fetchedRelatedItem.inputs.forEach(
                      (fetchRelatedItemInput) => {
                        if (
                          fetchRelatedItemInput.relatedElements &&
                          fetchRelatedItemInput.relatedElements.length > 0
                        ) {
                          const errorMessage = `Invalid topSections input: relatedItem with key ${fetchedRelatedItem.key} shall not have related items in order to avoid recursion errors`;
                          this.logger.error(errorMessage);
                          throw new HttpException(
                            {
                              status: HttpStatus.BAD_REQUEST,
                              error: errorMessage,
                            },
                            400,
                          );
                        }
                      },
                    );
                  }
                });
              }
            }),
          );
        }
      }),
    );
  }

  find(
    tenantId: string,
    templateId: string,
    issuerId: string,
    name: string,
  ): Promise<TemplateModel[]> {
    if (templateId) {
      return this.templateModel.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
            },
            {
              id: templateId,
            },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
    } else if (name) {
      return this.templateModel.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
            },
            {
              name,
            },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
    } else if (issuerId) {
      return this.templateModel.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
            },
            {
              issuerId,
            },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
    } else {
      return this.templateModel.findAll({
        where: {
          [Op.or]: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
        },
        order: [['createdAt', 'DESC']],
      });
    }
  }

  async findOne(
    tenantId: string,
    templateId: string,
    issuerId: string,
    name: string,
  ): Promise<TemplateModel> {
    const templatesList: TemplateModel[] = await this.find(
      tenantId,
      templateId,
      issuerId,
      name,
    );

    return templatesList.length > 0 ? templatesList[0] : undefined;
  }

  async update(
    tenantId: string,
    templateId: string,
    { issuerId, name, topSections, data }: TemplateRequest,
  ): Promise<TemplateRequest> {
    await this.checkTopSections(tenantId, topSections);

    const targetTemplate = await this.findOne(
      tenantId,
      templateId,
      undefined,
      undefined,
    );
    if (!targetTemplate) {
      const errorMessage = `Unable to find the template with id=${templateId}`;
      this.logger.error(errorMessage);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        400,
      );
    }

    if (name && name !== targetTemplate.name) {
      const templatesWithSameName: TemplateModel[] = await this.find(
        tenantId,
        undefined,
        undefined,
        name,
      );

      if (templatesWithSameName && templatesWithSameName.length > 0) {
        const errorMessage = `Unable to update the template name into ${name}, since another template with this name already exists`;
        this.logger.error(errorMessage);

        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: errorMessage,
          },
          400,
        );
      }
    }

    const updatedTemplate: TemplateModel = await targetTemplate.update({
      issuerId,
      name,
      topSections,
      data,
    });
    return updatedTemplate;
  }

  async remove(tenantId: string, templateId): Promise<{ message: string }> {
    const numberOfDestroyedRows = await this.templateModel.destroy({
      where: {
        id: templateId,
        tenantId,
      },
    });
    if (numberOfDestroyedRows > 0) {
      const successMessage = `${numberOfDestroyedRows} deleted template(s).`;
      this.logger.trace(successMessage);
      return { message: successMessage };
    } else {
      const errorMessage = `Unable to find the template with id=${templateId}`;
      this.logger.error(errorMessage);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        400,
      );
    }
  }

  async removeByTenant(tenantId: string): Promise<{ [key: string]: number }> {
    const numberOfDestroyedRows = await this.templateModel.destroy({
      where: {
        tenantId,
      },
    });

    const message = `${numberOfDestroyedRows} deleted template(s).`;
    this.logger.trace(message);
    return { deletedTemplatesTotal: numberOfDestroyedRows };
  }
}
