import {
  Injectable,
  HttpException,
  HttpStatus,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { NestJSPinoLogger } from '@consensys/observability';

import { prettify } from 'src/utils/commun';
import { buildTopSectionsElementKeys, checkValidValue } from 'src/utils/helper';
import { TopSection } from 'src/models/TopSection';

import { ElementService } from 'src/modules/ElementModule/ElementService';
import { TemplateService } from 'src/modules/TemplateModule/TemplateService';
import { ReviewService } from 'src/modules/ReviewModule/ReviewService';

import { ElementInstance } from './ElementInstance';
import { UserElementInstance } from './UserElementInstance';
import { ElementInstanceModel } from './ElementInstanceModel';
import { RequestElementInstance } from './RequestElementInstance';
import { RequestUserInfo } from './RequestUserInfo';
import { ApiExternalIdentityService } from '../ExternalIdentityModule/ExternalIdentityService';
import { ApiMetadataService } from '../MetadataModule/MetadataService';
import { TemplateModel } from '../TemplateModule/TemplateModel';
import { ReviewModel } from '../ReviewModule/ReviewModel';
import { ReviewStatus } from 'src/utils/constants/enum';
import { ElementModel } from '../ElementModule/ElementModel';
import { Config, ConfigKeys } from '../MetadataModule/constants';

@Injectable()
export class ElementInstanceService {
  constructor(
    @InjectModel(ElementInstanceModel)
    private readonly elementInstanceModel: typeof ElementInstanceModel,
    private readonly logger: NestJSPinoLogger,
    private readonly elementService: ElementService,
    private readonly templateService: TemplateService,
    @Inject(forwardRef(() => ReviewService))
    private readonly reviewService: ReviewService,
    private readonly externalIdentityService: ApiExternalIdentityService,
    private readonly metadataService: ApiMetadataService,
  ) {}

  async create(
    tenantId: string,
    elementInstances: RequestElementInstance[],
    userDetails: RequestUserInfo,
  ) {
    // ELEMENTS: we fetch all elements in one single operation (findAll), in order to avoid performance issues
    const allElementKeys = elementInstances.map(
      (e: RequestElementInstance) => e.elementKey,
    );
    const elementsLists: ElementModel[] = await this.elementService.findAll(
      tenantId,
      allElementKeys,
    );
    const elementsMap: { [key: string]: ElementModel } = elementsLists.reduce(
      (map, curr: ElementModel) => ({ ...map, [curr.key]: curr }),
      {},
    );

    // ELEMENT INSTANCES: we fetch all element instances in one single operation (findAll), in order to avoid performance issues
    const userId = elementInstances[0].userId;
    const isSameUserId = elementInstances.every(
      (e: RequestElementInstance) => e.userId === userId,
    );
    if (!isSameUserId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `all element instances shall have the same userId: ${userId}`,
        },
        400,
      );
    }

    const elementsInstancesLists: ElementInstanceModel[] =
      await this.findAllByKeys(tenantId, allElementKeys, userId);

    const elementsInstancesListsByKey: {
      [key: string]: ElementInstanceModel[];
    } = {};
    elementsInstancesLists.forEach((elementInstance: ElementInstanceModel) => {
      if (!elementsInstancesListsByKey[elementInstance.elementKey]) {
        elementsInstancesListsByKey[elementInstance.elementKey] = [];
      }
      elementsInstancesListsByKey[elementInstance.elementKey].push(
        elementInstance,
      );
    });

    return await Promise.all(
      elementInstances.map(async ({ elementKey, value, data = {} }) => {
        const targetedElement: ElementModel = elementsMap[elementKey];

        // check if element has a valid elementKey
        if (!targetedElement) {
          const errorMessage = `Invalid elementKey input: ${prettify(
            elementKey,
          )} element does not exist`;
          this.logger.error(errorMessage);
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error: errorMessage,
            },
            400,
          );
        }

        // check if elementInstance has a valid value
        if (!checkValidValue(value, targetedElement)) {
          const errorMessage = `Invalid 'value' input: ${prettify(
            value,
          )}. Since the associated element 'type' is '${
            targetedElement.type
          }', the elementInstance 'value' needs to contain an array of number(s), corresponding to the index(es) of the chosen response(s) in the element 'inputs' array`;
          this.logger.error(errorMessage);
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error: errorMessage,
            },
            400,
          );
        }

        // create applicant on Onfido, and return jwt token
        if (
          elementKey.startsWith('onfido_onfido_') &&
          !value[0].endsWith('mock_value')
        ) {
          try {
            const allElementsInstancesLists: ElementInstanceModel[] =
              await this.findAll(tenantId, userId);

            const apiToken = await this.fetchOnfidoApiToken(tenantId);

            // create user details from user info and element instances
            const userInfo = this.externalIdentityService.extractUserInfo(
              userDetails,
              allElementsInstancesLists,
            );

            // create applicant on onfido
            await this.externalIdentityService.createApplicantOnOnfido(
              userInfo,
              apiToken,
            );
            // get jwt token
            const jwtToken = await this.externalIdentityService.getJwtToken(
              userId,
              apiToken,
            );
            data = { ...data, jwtToken };
          } catch (onfidoError) {
            data = {
              ...data,
              onfidoError: onfidoError.message,
            };
          } finally {
            value = ['done'];
          }
        }

        const existingElementInstances: ElementInstanceModel[] =
          elementsInstancesListsByKey[elementKey];

        // In case the most recent element instance stored in the database already has the same value,
        // we don't want to create a new instance.
        // In case the most recent element instance stored in the database already has a different value,
        // we want to create a new instance, which is why we specify the 'createdAt' (this forces the
        // creation of a new element instance, even if a similar one existed in the past).
        let newElementInstance: [ElementInstance, boolean];
        if (
          existingElementInstances &&
          existingElementInstances.length > 0 &&
          JSON.stringify(existingElementInstances[0].value) !==
            JSON.stringify(value)
        ) {
          newElementInstance = await this.elementInstanceModel.findOrCreate({
            where: {
              tenantId,
              elementKey,
              userId,
              value,
              data,
              createdAt: new Date(),
            },
          });
        } else {
          newElementInstance = await this.elementInstanceModel.findOrCreate({
            where: {
              tenantId,
              elementKey,
              userId,
              value,
              data,
            },
          });
        }

        this.logger.trace(
          `New ElementInstance: ${prettify(newElementInstance)}`,
        );
        return newElementInstance;
      }),
    );
  }

  /*
   * fetchOnfidoApiToken
   * take onfido custom api token if exists from tenant config
   */
  async fetchOnfidoApiToken(tenantId: string) {
    let apiToken;
    const config: Config = await this.metadataService.retrieveConfig(tenantId);
    if (
      config[ConfigKeys.DATA] &&
      config[ConfigKeys.DATA][ConfigKeys.DATA__ONFIDO_API_TOKEN]
    ) {
      apiToken = config[ConfigKeys.DATA][ConfigKeys.DATA__ONFIDO_API_TOKEN];
    }
    return apiToken;
  }

  async findAllByKeysBatch(
    tenantId: string,
    elementKeys: string[],
    userIds: string[],
  ): Promise<ElementInstanceModel[]> {
    return this.elementInstanceModel.findAll({
      where: {
        [Op.and]: [
          { tenantId },
          {
            userId: {
              [Op.in]: userIds,
            },
          },
          {
            elementKey: {
              [Op.in]: elementKeys,
            },
          },
        ],
      },
      order: [['createdAt', 'DESC']],
    });
  }

  async findAllByKeys(
    tenantId: string,
    elementKeys: string[],
    userId: string,
  ): Promise<ElementInstanceModel[]> {
    return this.elementInstanceModel.findAll({
      where: {
        [Op.and]: [
          { tenantId },
          { userId },
          {
            elementKey: {
              [Op.in]: elementKeys,
            },
          },
        ],
      },
      order: [['createdAt', 'DESC']],
    });
  }

  async findAll(
    tenantId: string,
    userId: string,
  ): Promise<ElementInstanceModel[]> {
    return this.elementInstanceModel.findAll({
      where: {
        [Op.and]: [{ tenantId }, { userId }],
      },
      order: [['createdAt', 'DESC']],
    });
  }

  find(
    tenantId: string,
    elementInstanceId: string,
    elementKey: string,
    userId: string,
  ): Promise<ElementInstanceModel[]> {
    if (elementInstanceId) {
      return this.elementInstanceModel.findAll({
        where: {
          [Op.and]: [{ tenantId }, { id: elementInstanceId }],
        },
        order: [['createdAt', 'DESC']],
      });
    } else if (elementKey && userId) {
      return this.elementInstanceModel.findAll({
        where: {
          [Op.and]: [{ tenantId }, { elementKey }, { userId }],
        },
        order: [['createdAt', 'DESC']],
      });
    } else if (userId) {
      return this.elementInstanceModel.findAll({
        where: {
          [Op.and]: [{ tenantId }, { userId }],
        },
        order: [['createdAt', 'DESC']],
      });
    } else {
      return this.elementInstanceModel.findAll({
        where: { tenantId },
        order: [['createdAt', 'DESC']],
      });
    }
  }

  async findOne(
    tenantId: string,
    elementInstanceId: string,
    elementKey: string,
    userId: string,
  ): Promise<ElementInstanceModel> {
    const elementInstancesList: ElementInstanceModel[] = await this.find(
      tenantId,
      elementInstanceId,
      elementKey,
      userId,
    );

    return elementInstancesList.length > 0
      ? elementInstancesList[0]
      : undefined;
  }

  async update(
    tenantId: string,
    elementInstanceId: string,
    { elementKey, userId, value, data = {} }: RequestElementInstance,
  ): Promise<RequestElementInstance> {
    // Find the element instance
    const targetedElementInstance: ElementInstanceModel = await this.findOne(
      tenantId,
      elementInstanceId,
      undefined,
      undefined,
    );
    if (!targetedElementInstance) {
      const errorMessage = `Unable to find the elementInstance with id=${elementInstanceId}`;
      this.logger.error(errorMessage);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        400,
      );
    }

    const targetedElement: ElementModel = await this.elementService.findOne(
      tenantId,
      null,
      elementKey,
    );

    if (!targetedElement) {
      const errorMessage = `Invalid elementKey input: ${prettify(
        elementKey,
      )} element does not exist`;
      this.logger.error(errorMessage);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        400,
      );
    }

    if (!checkValidValue(value, targetedElement)) {
      const errorMessage = `Invalid 'value' input: ${prettify(
        value,
      )}. Since the associated element is of type '${
        targetedElement.type
      }', the element 'value' needs to contain an array of number(s), corresponding to the index(es) of the chosen response(s) in the element 'inputs' array`;
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        400,
      );
    }

    // If it exists, update it
    const updatedElementInstance: ElementInstanceModel =
      await targetedElementInstance.update({
        elementKey,
        userId,
        value,
        data,
      });
    this.logger.trace(
      `Updated elementInstance: ${prettify(updatedElementInstance)}`,
    );
    return updatedElementInstance;
  }

  async remove(
    tenantId: string,
    elementInstanceId: string,
  ): Promise<{ message: string }> {
    const numberOfDestroyedRows = await this.elementInstanceModel.destroy({
      where: {
        id: elementInstanceId,
        tenantId,
      },
    });
    if (numberOfDestroyedRows > 0) {
      const successMessage = `${numberOfDestroyedRows} deleted elementInstance(s).`;
      this.logger.trace(successMessage);
      return { message: successMessage };
    } else {
      const errorMessage = `Unable to find the elementInstance with id=${elementInstanceId}`;
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
    const numberOfDestroyedRows = await this.elementInstanceModel.destroy({
      where: {
        tenantId,
      },
    });

    const message = `${numberOfDestroyedRows} deleted element instance(s).`;
    this.logger.trace(message);
    return { deletedElementInstancesTotal: numberOfDestroyedRows };
  }

  async retrieveKycForUserBatch(
    tenantId: string,
    entityId: string,
    entityClass: string,
    templateId: string,
    userIds: string[],
    atLeastSubmitted: boolean,
    atLeastValidated: boolean,
  ): Promise<{ [userId: string]: { [key: string]: UserElementInstance } }> {
    const template: TemplateModel = await this.templateService.findOne(
      tenantId,
      templateId,
      undefined,
      undefined,
    );
    if (!template || !template.topSections) {
      const errorMessage = `Failed fetching kyc template with ID: ${templateId}`;
      this.logger.error(errorMessage);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        400,
      );
    }
    const elementKeysList: string[] = await this.extractFullElementKeysList(
      tenantId,
      template.topSections,
    );

    // ELEMENT INSTANCES: we fetch all element instances in one single operation (findAll), in order to avoid performance issues
    const elementsInstancesLists: ElementInstanceModel[] =
      await this.findAllByKeysBatch(tenantId, elementKeysList, userIds);

    const elementsInstancesMapByUserIdByKey: {
      [userId: string]: {
        [key: string]: ElementInstanceModel[];
      };
    } = {};
    userIds.map((userId: string) => {
      // CAUTION: this step is mandatory
      // We need an empty object (and not 'undefined') for userIds which have no element instances at all
      if (!elementsInstancesMapByUserIdByKey[userId]) {
        elementsInstancesMapByUserIdByKey[userId] = {};
      }
    });
    elementsInstancesLists.map((elementInstance: ElementInstanceModel) => {
      if (
        !elementsInstancesMapByUserIdByKey[elementInstance.userId][
          elementInstance.elementKey
        ]
      ) {
        elementsInstancesMapByUserIdByKey[elementInstance.userId][
          elementInstance.elementKey
        ] = [];
      }
      elementsInstancesMapByUserIdByKey[elementInstance.userId][
        elementInstance.elementKey
      ].push(elementInstance);
    });

    // REVIEWS: we fetch all reviews in one single operation (findAll), in order to avoid performance issues
    const elementInstancesIds: string[] = elementsInstancesLists.map(
      (rawElementInstance: ElementInstanceModel) => {
        const elementInstance: ElementInstance = rawElementInstance.get({
          plain: true,
        }) as ElementInstance;
        return elementInstance.id;
      },
    );
    const reviewsLists: ReviewModel[] = await this.reviewService.findAll(
      tenantId,
      elementInstancesIds,
      entityId,
      entityClass,
    );
    const reviewsMapByObjectIds: {
      [key: string]: ReviewModel[];
    } = {};
    reviewsLists.map((review: ReviewModel) => {
      if (!reviewsMapByObjectIds[review.objectId]) {
        reviewsMapByObjectIds[review.objectId] = [];
      }
      reviewsMapByObjectIds[review.objectId].push(review);
    });

    // MOST RECENT ELEMENT INSTANCES
    const mostRecentElementInstancesListByUserId: {
      [userId: string]: UserElementInstance[];
    } = {};
    await Promise.all(
      userIds.map(async (userId: string) => {
        mostRecentElementInstancesListByUserId[userId] = (
          await Promise.all(
            Object.keys(elementsInstancesMapByUserIdByKey[userId]).map(
              (elementKey: string) => {
                const elementInstances: ElementInstanceModel[] =
                  elementsInstancesMapByUserIdByKey[userId][elementKey];
                return this.selectMostRecentElementInstance(
                  elementInstances,
                  reviewsMapByObjectIds,
                  atLeastSubmitted,
                  atLeastValidated,
                );
              },
            ),
          )
        ).filter((elementInstance: UserElementInstance) => {
          return elementInstance !== null;
        });
      }),
    );

    const mostRecentElementInstancesByUserId: {
      [userId: string]: {
        [key: string]: UserElementInstance;
      };
    } = {};
    userIds.map(async (userId: string) => {
      mostRecentElementInstancesByUserId[userId] =
        mostRecentElementInstancesListByUserId[userId].reduce(
          (obj, elementInstance: UserElementInstance) => ({
            ...obj,
            [elementInstance.elementKey]: elementInstance,
          }),
          {},
        );
    });
    return mostRecentElementInstancesByUserId;
  }

  async retrieveKycForUser(
    tenantId: string,
    entityId: string,
    entityClass: string,
    templateId: string,
    userId: string,
    atLeastSubmitted: boolean,
    atLeastValidated: boolean,
  ): Promise<{ [key: string]: UserElementInstance }> {
    const template: TemplateModel = await this.templateService.findOne(
      tenantId,
      templateId,
      undefined,
      undefined,
    );
    if (!template || !template.topSections) {
      const errorMessage = `Failed fetching kyc template with ID: ${templateId}`;
      this.logger.error(errorMessage);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        400,
      );
    }
    const elementKeysList: string[] = await this.extractFullElementKeysList(
      tenantId,
      template.topSections,
    );

    // ELEMENT INSTANCES: we fetch all element instances in one single operation (findAll), in order to avoid performance issues
    const elementsInstancesLists: ElementInstanceModel[] =
      await this.findAllByKeys(tenantId, elementKeysList, userId);

    const elementsInstancesListsByKey: {
      [key: string]: ElementInstanceModel[];
    } = {};
    elementsInstancesLists.forEach((elementInstance: ElementInstanceModel) => {
      if (!elementsInstancesListsByKey[elementInstance.elementKey]) {
        elementsInstancesListsByKey[elementInstance.elementKey] = [];
      }
      elementsInstancesListsByKey[elementInstance.elementKey].push(
        elementInstance,
      );
    });

    // REVIEWS: we fetch all reviews in one single operation (findAll), in order to avoid performance issues
    const elementInstancesIds: string[] = elementsInstancesLists.map(
      (rawElementInstance: ElementInstanceModel) => {
        const elementInstance: ElementInstance = rawElementInstance.get({
          plain: true,
        }) as ElementInstance;
        return elementInstance.id;
      },
    );
    const reviewsLists: ReviewModel[] = await this.reviewService.findAll(
      tenantId,
      elementInstancesIds,
      entityId,
      entityClass,
    );
    const reviewsListsByObjectIds: {
      [key: string]: ReviewModel[];
    } = {};
    reviewsLists.forEach((review: ReviewModel) => {
      if (!reviewsListsByObjectIds[review.objectId]) {
        reviewsListsByObjectIds[review.objectId] = [];
      }
      reviewsListsByObjectIds[review.objectId].push(review);
    });

    // MOST RECENT ELEMENT INSTANCES
    const mostRecentElementsList: UserElementInstance[] = await Promise.all(
      Object.keys(elementsInstancesListsByKey).map((elementKey: string) => {
        const elementInstances: ElementInstanceModel[] =
          elementsInstancesListsByKey[elementKey];
        return this.selectMostRecentElementInstance(
          elementInstances,
          reviewsListsByObjectIds,
          atLeastSubmitted,
          atLeastValidated,
        );
      }),
    );

    const filteredMostRecentElementsList: UserElementInstance[] =
      mostRecentElementsList.filter((elementInstance) => {
        return elementInstance !== null;
      });

    return filteredMostRecentElementsList.reduce(
      (obj, elementInstance: UserElementInstance) => ({
        ...obj,
        [elementInstance.elementKey]: elementInstance,
      }),
      {},
    );
  }

  async extractFullElementKeysList(
    tenantId: string,
    topSections: TopSection[],
  ): Promise<string[]> {
    const primaryElementKeysList: string[] =
      buildTopSectionsElementKeys(topSections);

    const primaryElementsList: ElementModel[] =
      await this.elementService.findAll(tenantId, primaryElementKeysList);

    const subElementKeysList: string[] = primaryElementsList.reduce(
      (acc, { inputs }) => [
        ...acc,
        ...(inputs || []).reduce(
          (inputAcc, { relatedElements }) => [
            ...inputAcc,
            ...(relatedElements || []),
          ],
          [],
        ),
      ],
      [],
    );
    return [...primaryElementKeysList, ...subElementKeysList];
  }

  async selectMostRecentElementInstance(
    elementInstances: ElementInstanceModel[],
    reviewsListsByObjectIds: {
      [key: string]: ReviewModel[];
    },
    atLeastSubmitted: boolean,
    atLeastValidated: boolean,
  ): Promise<UserElementInstance> {
    // Here we sort the element instances in DESC order (even though they are supposed to be
    // already sorted, since they have been fetched in DESC order)
    const sortedElementInstances: ElementInstanceModel[] =
      elementInstances.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

    // It is assumed, element instances are sorted in DESC order at this step
    for (const rawElementInstance of sortedElementInstances) {
      const elementInstance: ElementInstance = rawElementInstance.get({
        plain: true,
      }) as ElementInstance; // Start with most recent elementInstance

      const fetchedReviews: ReviewModel[] =
        reviewsListsByObjectIds[elementInstance.id] || [];

      let targetedReview: ReviewModel;
      let reviewStatus = '';
      let comment: string;
      let validityDate: Date;
      let category: string;
      let riskProfile: string;
      if (fetchedReviews.length > 0) {
        targetedReview = fetchedReviews[0]; // Most recent review (since reviews are fetched with order DESC)
        reviewStatus = targetedReview.status;
        comment = targetedReview.comment || '';
        validityDate = targetedReview.validityDate;
        category = targetedReview.category;
        riskProfile = targetedReview.riskProfile;
      } else {
        reviewStatus = ReviewStatus.NOT_SHARED;
      }

      // investor case
      if (!atLeastSubmitted) {
        return {
          ...elementInstance,
          status: reviewStatus,
          reviewId: targetedReview ? targetedReview.id : undefined,
          comment,
          validityDate,
        };

        // If there's a link, it means the element has been submitted for this issuer
      } else if (atLeastSubmitted && fetchedReviews.length > 0) {
        // Select most recent link (even though link is supposed to be unique)
        if (!atLeastValidated) {
          return {
            ...elementInstance,
            status: reviewStatus,
            reviewId: targetedReview ? targetedReview.id : undefined,
            comment,
            validityDate,
            category,
            riskProfile,
          };

          // If there's a validated link, it means the element has been validated by this issuer
        } else if (
          atLeastValidated &&
          reviewStatus === ReviewStatus.VALIDATED
        ) {
          return {
            ...elementInstance,
            status: reviewStatus,
            reviewId: targetedReview ? targetedReview.id : undefined,
            comment,
            validityDate,
            category,
            riskProfile,
          };
        }
      }
    }

    return null;
  }
}
