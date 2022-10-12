import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import { ElementInstanceService } from 'src/modules/ElementInstanceModule/ElementInstanceService';
import { TemplateService } from 'src/modules/TemplateModule/TemplateService';
import { ApiExternalIdentityService } from '../ExternalIdentityModule/ExternalIdentityService';

import { ReviewModel } from './ReviewModel';
import { ReviewRequest } from './ReviewRequest';

import { prettify } from 'src/utils/commun';
import { ReviewScope } from 'src/utils/constants/enum';
import { TemplateModel } from '../TemplateModule/TemplateModel';
import { ElementInstanceModel } from '../ElementInstanceModule/ElementInstanceModel';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(ReviewModel)
    private readonly reviewModel: typeof ReviewModel,
    private readonly logger: NestJSPinoLogger,
    private readonly elementInstanceService: ElementInstanceService,
    private readonly templateService: TemplateService,
    private readonly externalIdentityService: ApiExternalIdentityService,
  ) {}

  async create(tenantId: string, reviews: ReviewRequest[]) {
    return Promise.all(
      reviews.map(
        async ({
          objectId,
          entityId = null, // Required in case entityId is undefined
          entityClass = null, // Required in case entityClass is undefined
          entityType,
          status,
          scope,
          validityDate,
          category,
          riskProfile,
          comment,
          investorId,
          data = {},
        }) => {
          if (scope === ReviewScope.TEMPLATE) {
            const targetedTemplate: TemplateModel =
              await this.templateService.findOne(
                tenantId,
                objectId, // templateId
                undefined,
                undefined,
              );

            if (!targetedTemplate) {
              const errorMessage = `Invalid objectId input: ${prettify(
                objectId,
              )} template does not exist`;
              this.logger.error(errorMessage);
              throw new HttpException(
                {
                  status: HttpStatus.BAD_REQUEST,
                  error: errorMessage,
                },
                400,
              );
            }
          } else {
            const targetedElementInstance: ElementInstanceModel =
              await this.elementInstanceService.findOne(
                tenantId,
                objectId,
                undefined,
                undefined,
              );

            if (!targetedElementInstance) {
              const errorMessage = `Invalid objectId input: ${prettify(
                objectId,
              )} elementInstance does not exist`;
              this.logger.error(errorMessage);
              throw new HttpException(
                {
                  status: HttpStatus.BAD_REQUEST,
                  error: errorMessage,
                },
                400,
              );
            }

            if (
              targetedElementInstance.elementKey.startsWith('onfido_onfido')
            ) {
              if (!targetedElementInstance.value[0].endsWith('mock_value')) {
                const apiToken =
                  await this.elementInstanceService.fetchOnfidoApiToken(
                    tenantId,
                  );
                const checkId =
                  await this.externalIdentityService.submitOnfidoCheck(
                    targetedElementInstance.userId,
                    apiToken,
                  );
                data = {
                  ...targetedElementInstance.data,
                  checkId,
                };
                await this.elementInstanceService.update(
                  tenantId,
                  targetedElementInstance.id,
                  {
                    elementKey: targetedElementInstance.elementKey,
                    userId: targetedElementInstance.userId,
                    value: targetedElementInstance.value,
                    data,
                  },
                );
              }
            }
          }

          let newReview;
          // Find or create new review in database
          if (scope === ReviewScope.TEMPLATE) {
            newReview = await this.reviewModel.findOrCreate({
              where: {
                tenantId,
                objectId,
                entityId,
                entityClass,
                investorId,
                scope,
              },
              defaults: {
                status,
                data,
                entityType,
                validityDate,
                category,
                riskProfile,
                comment,
              },
            });
          } else {
            newReview = await this.reviewModel.findOrCreate({
              where: {
                tenantId,
                objectId,
                entityId,
                entityClass,
              },
              defaults: {
                scope,
                status,
                data,
                entityType,
                validityDate,
                comment,
              },
            });
          }
          this.logger.trace(`New Review: ${prettify(newReview)}`);
          return newReview;
        },
      ),
    );
  }

  findAll(
    tenantId: string,
    objectIds: string[],
    entityId: string = null,
    entityClass: string = null,
  ): Promise<ReviewModel[]> {
    return this.reviewModel.findAll({
      where: {
        [Op.and]: [
          { tenantId },
          { entityId },
          { entityClass },
          {
            objectId: {
              [Op.in]: objectIds,
            },
          },
        ],
      },
      order: [['createdAt', 'DESC']],
    });
  }

  findBatch(
    tenantId: string,
    objectId: string,
    entityId: string = null,
    entityClass: string = null,
    userIds: string[],
  ): Promise<ReviewModel[]> {
    //
    // Expected behaviour:
    //  - if entityId is defined, we want to retrieve all reviews with the given entityId
    //  - if entityId is undefined or null, we want to retrieve all reviews with "null" as entityId, but not those where entityId is defined
    //
    if (objectId && userIds) {
      return this.reviewModel.findAll({
        where: {
          [Op.and]: [
            { tenantId },
            { objectId },
            { entityId },
            { entityClass },
            {
              investorId: {
                [Op.in]: userIds,
              },
            },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
    } else {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `missing parameter (${objectId ? 'userIds' : 'objectId'})`,
        },
        400,
      );
    }
  }

  find(
    tenantId: string,
    id: string,
    objectId: string,
    entityId: string = null,
    entityClass: string = null,
    investorId: string,
  ): Promise<ReviewModel[]> {
    //
    // Expected behaviour:
    //  - if entityId is defined, we want to retrieve all reviews with the given entityId
    //  - if entityId is undefined or null, we want to retrieve all reviews with "null" as entityId, but not those where entityId is defined
    //
    if (id) {
      return this.reviewModel.findAll({
        where: {
          [Op.and]: [{ tenantId }, { id }],
        },
        order: [['createdAt', 'DESC']],
      });
    } else if (objectId && investorId) {
      return this.reviewModel.findAll({
        where: {
          [Op.and]: [
            { tenantId },
            { objectId },
            { entityId },
            { entityClass },
            { investorId },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
    } else if (objectId) {
      return this.reviewModel.findAll({
        where: {
          [Op.and]: [{ tenantId }, { objectId }, { entityId }, { entityClass }],
        },
        order: [['createdAt', 'DESC']],
      });
    } else {
      return this.reviewModel.findAll({
        where: { tenantId },
        order: [['createdAt', 'DESC']],
      });
    }
  }

  async findOne(
    tenantId: string,
    id: string,
    objectId: string,
    entityId: string,
    entityClass: string,
    investorId: string,
  ): Promise<ReviewModel> {
    const reviewsList: ReviewModel[] = await this.find(
      tenantId,
      id,
      objectId,
      entityId,
      entityClass,
      investorId,
    );

    return reviewsList.length > 0 ? reviewsList[0] : undefined;
  }

  async update(
    tenantId: string,
    reviews: ReviewRequest[],
  ): Promise<ReviewModel[]> {
    return Promise.all(
      reviews.map(
        async ({
          reviewId: id,
          objectId,
          entityId,
          entityClass,
          status,
          data = {},
          comment,
          validityDate,
          category,
          riskProfile,
        }) => {
          const targetedReview = await this.findOne(
            tenantId,
            id,
            undefined,
            undefined,
            undefined,
            undefined,
          );
          if (!targetedReview) {
            const errorMessage = `Unable to find the review with id=${id}`;
            this.logger.error(errorMessage);
            throw new HttpException(
              {
                status: HttpStatus.BAD_REQUEST,
                error: errorMessage,
              },
              400,
            );
          }

          if (objectId) {
            if (targetedReview.scope === ReviewScope.TEMPLATE) {
              const targetedTemplate: TemplateModel =
                await this.templateService.findOne(
                  tenantId,
                  objectId,
                  undefined,
                  undefined,
                );

              if (!targetedTemplate) {
                const errorMessage = `Invalid objectId input: ${prettify(
                  objectId,
                )} template does not exist`;
                this.logger.error(errorMessage);
                throw new HttpException(
                  {
                    status: HttpStatus.BAD_REQUEST,
                    error: errorMessage,
                  },
                  400,
                );
              }
            } else if (targetedReview.scope === ReviewScope.ELEMENT_INSTANCE) {
              const targetedElementInstance: ElementInstanceModel =
                await this.elementInstanceService.findOne(
                  tenantId,
                  objectId,
                  undefined,
                  undefined,
                );

              if (!targetedElementInstance) {
                const errorMessage = `Invalid objectId input: ${prettify(
                  objectId,
                )} element instance does not exist`;
                this.logger.error(errorMessage);
                throw new HttpException(
                  {
                    status: HttpStatus.BAD_REQUEST,
                    error: errorMessage,
                  },
                  400,
                );
              }
            } else {
              const errorMessage = `Shall never happen: non-supported scope type (${targetedReview.scope})`;
              this.logger.error(errorMessage);
            }

            // Ensure there's not already a review for the same (objectId, entityId) couple
            if (
              objectId &&
              entityId &&
              (objectId !== targetedReview.objectId ||
                entityId !== targetedReview.entityId)
            ) {
              const reviewsWithSameIds: ReviewModel[] = await this.find(
                tenantId,
                undefined,
                objectId,
                entityId,
                entityClass,
                undefined,
              );

              if (reviewsWithSameIds && reviewsWithSameIds.length > 0) {
                const errorMessage = `Unable to update the review, since another review with same IDs already exists`;
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
          }

          // If it exists, update it
          const updatedReview: ReviewModel = await targetedReview.update({
            objectId,
            entityId,
            entityClass,
            status,
            data,
            comment,
            validityDate,
            category,
            riskProfile,
          });
          this.logger.trace(`Updated review: ${prettify(updatedReview)}`);
          return updatedReview;
        },
      ),
    );
  }

  async remove(tenantId: string, id): Promise<{ message: string }> {
    const numberOfDestroyedRows = await this.reviewModel.destroy({
      where: {
        id,
        tenantId,
      },
    });
    if (numberOfDestroyedRows > 0) {
      const successMessage = `${numberOfDestroyedRows} deleted review(s).`;
      this.logger.trace(successMessage);
      return { message: successMessage };
    } else {
      const errorMessage = `Unable to find the review with id=${id}`;
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
    const numberOfDestroyedRows = await this.reviewModel.destroy({
      where: {
        tenantId,
      },
    });

    const message = `${numberOfDestroyedRows} deleted review(s).`;
    this.logger.trace(message);
    return { deletedReviewsTotal: numberOfDestroyedRows };
  }
}
