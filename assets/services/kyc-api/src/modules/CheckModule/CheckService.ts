import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import { TemplateService } from 'src/modules/TemplateModule/TemplateService';
import { ElementInstanceService } from 'src/modules/ElementInstanceModule/ElementInstanceService';
import { ElementService } from 'src/modules/ElementModule/ElementService';
import { ReviewService } from '../ReviewModule/ReviewService';

import { buildTopSectionsElementKeys, checkValidValue } from 'src/utils/helper';

import { ReviewModel } from '../ReviewModule/ReviewModel';
import { TemplateModel } from '../TemplateModule/TemplateModel';
import { TopSection } from 'src/models/TopSection';
import { UserElementInstance } from '../ElementInstanceModule/UserElementInstance';
import { ElementModel } from '../ElementModule/ElementModel';
import {
  ReviewStatus,
  KycGranularity,
  ElementStatus,
  ElementType,
} from 'src/utils/constants/enum';

@Injectable()
export class CheckService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly templateService: TemplateService,
    private readonly elementInstanceService: ElementInstanceService,
    private readonly elementService: ElementService,
    private readonly reviewService: ReviewService,
  ) {}

  async kycCompletionCheck(
    tenantId: string,
    userId: string,
    entityId: string,
    entityClass: string,
    templateId: string,
    topSectionKeys: string[],
  ): Promise<[boolean, string]> {
    this.logger.info('\n\n======> CHECK VALID KYC COMPLETION <======\n');

    // Check if input parameters are defined
    this.checkInputParameters(
      false, // batch
      userId,
      undefined, // userIds (only for batches)
      templateId,
      'bypass_granularity_check', // granularity
      topSectionKeys, // topSectionKeys
      undefined, // topSectionKeysByUserId (only for batches)
    );

    // Retrieve KYC template
    const kycTemplate: TemplateModel = await this.templateService.findOne(
      tenantId,
      templateId,
      undefined,
      undefined,
    );
    if (!kycTemplate) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: `kycCompletionCheck: Template with ID ${templateId} can not be found in DB`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Check KYC elements competion
    const restrictedTopSections: TopSection[] = this.retrieveTopSections(
      topSectionKeys,
      kycTemplate,
    );
    const elementKeysList: string[] = buildTopSectionsElementKeys(
      restrictedTopSections,
    );
    const allElementInstances: {
      [key: string]: UserElementInstance;
    } = await this.elementInstanceService.retrieveKycForUser(
      tenantId,
      entityId,
      entityClass,
      templateId,
      userId,
      true, // atLeastSubmitted
      false, // atLeastValidated
    );
    const allElementKeys: string[] =
      await this.elementInstanceService.extractFullElementKeysList(
        tenantId,
        kycTemplate.topSections,
      );
    const elementsLists: ElementModel[] = await this.elementService.findAll(
      tenantId,
      allElementKeys,
    );
    const elementsMap: { [key: string]: ElementModel } = elementsLists.reduce(
      (map, curr: ElementModel) => ({ ...map, [curr.key]: curr }),
      {},
    );
    const kycElementsCheck: [boolean, string] = this.verifyAllElements(
      elementKeysList,
      elementsMap,
      allElementInstances,
    );
    if (!kycElementsCheck || kycElementsCheck.length !== 2) {
      throw new Error(
        `kycCompletionCheck: Shall never happen - Invalid function response`,
      );
    } else if (!kycElementsCheck[0]) {
      return Promise.resolve([
        false,
        `Incomplete kyc completion check: ${kycElementsCheck[1]}`,
      ]);
    } else {
      return Promise.resolve([
        true,
        `Successful kyc completion check: All requested kyc elements have been submitted`,
      ]);
    }
  }

  async kycValidationCheckBatch(
    tenantId: string,
    userIds: string[],
    entityId: string,
    entityClass: string,
    templateId: string,
    topSectionKeysByUserId: {
      [userId: string]: string[];
    },
    granularity: KycGranularity,
  ) {
    this.logger.info('\n\n======> CHECK BATCH VALID KYC VALIDATION <======\n');

    // Check if input parameters are defined
    this.checkInputParameters(
      true, // batch
      undefined, // userId (not for batches)
      userIds,
      templateId,
      granularity,
      undefined, // topSectionKeys (not for batches)
      topSectionKeysByUserId,
    );

    // Retrieve KYC template
    const kycTemplate: TemplateModel = await this.templateService.findOne(
      tenantId,
      templateId,
      undefined,
      undefined,
    );
    if (!kycTemplate) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: `kycValidationCheck: Template with ID ${templateId} can not be found in DB`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Check KYC template validation
    const templateReviewsArray: ReviewModel[] =
      await this.reviewService.findBatch(
        tenantId,
        templateId,
        entityId,
        entityClass,
        userIds,
      );
    const templateReviewsMap: {
      [key: string]: ReviewModel[];
    } = userIds.reduce((map, userId: string) => ({ ...map, [userId]: [] }), {});

    templateReviewsArray.map((templateReview: ReviewModel) => {
      templateReviewsMap[templateReview.investorId].push(templateReview);
    });

    let kycTemplateValidationCheck = true;
    let kycTemplateValidationMessage = `Batch of ${userIds.length} user(s) is validated at template granularity level`;
    userIds.map((userId: string) => {
      const [
        userKycTemplateValidationCheck,
        userKycTemplateValidationMessage,
      ]: [boolean, string] = this.verifyTemplateReviewUnicity(
        templateReviewsMap[userId],
        userId, // only required for log message
        entityId, // only required for log message
        templateId, // only required for log message
      );
      kycTemplateValidationCheck =
        kycTemplateValidationCheck && userKycTemplateValidationCheck;
      if (!userKycTemplateValidationCheck) {
        // If userKycTemplateValidationCheck is false, we need to return its error message
        kycTemplateValidationMessage = userKycTemplateValidationMessage;
      }
    });

    // Check KYC elements validation
    const restrictedTopSectionsByUserId: {
      [userId: string]: TopSection[];
    } = this.retrieveTopSectionsBatch(
      userIds,
      topSectionKeysByUserId,
      kycTemplate,
    );
    const elementKeysListByUserId: {
      [userId: string]: string[];
    } = userIds.reduce(
      (map, userId: string) => ({
        ...map,
        [userId]: buildTopSectionsElementKeys(
          restrictedTopSectionsByUserId[userId],
        ),
      }),
      {},
    );

    const allElementInstancesByUserId: {
      [userId: string]: { [key: string]: UserElementInstance };
    } = await this.elementInstanceService.retrieveKycForUserBatch(
      tenantId,
      entityId,
      entityClass,
      templateId,
      userIds,
      true, // atLeastSubmitted
      true, // atLeastValidated
    );
    const allElementKeys: string[] =
      await this.elementInstanceService.extractFullElementKeysList(
        tenantId,
        kycTemplate.topSections,
      );

    const elementsLists: ElementModel[] = await this.elementService.findAll(
      tenantId,
      allElementKeys,
    );

    const elementsMap: { [key: string]: ElementModel } = elementsLists.reduce(
      (map, curr: ElementModel) => ({ ...map, [curr.key]: curr }),
      {},
    );

    let kycElementValidationCheck = true;
    let kycElementValidationMessage = `Batch of ${userIds.length} user(s) is validated at element granularity level`;
    userIds.map((userId: string) => {
      const [userKycElementValidationCheck, userKycElementValidationMessage]: [
        boolean,
        string,
      ] = this.verifyAllElements(
        elementKeysListByUserId[userId],
        elementsMap,
        allElementInstancesByUserId[userId],
      );

      kycElementValidationCheck =
        kycElementValidationCheck && userKycElementValidationCheck;
      if (!userKycElementValidationCheck) {
        // If userKycElementValidationCheck is false, we need to return its error message
        kycElementValidationMessage = userKycElementValidationMessage;
      }
    });

    return this.craftAdaptedResponseForGranularity(
      true, // batch (only required for logs)
      userIds,
      granularity,
      kycTemplateValidationCheck,
      kycTemplateValidationMessage,
      kycElementValidationCheck,
      kycElementValidationMessage,
    );
  }

  async kycValidationCheck(
    tenantId: string,
    userId: string,
    entityId: string,
    entityClass: string,
    templateId: string,
    topSectionKeys: any[],
    granularity: KycGranularity,
  ) {
    this.logger.info('\n\n======> CHECK VALID KYC VALIDATION <======\n');

    // Check if input parameters are defiened
    this.checkInputParameters(
      false, // batch
      userId,
      undefined, // userIds (only for batches)
      templateId,
      granularity,
      topSectionKeys,
      undefined, // topSectionKeysByUserId (only for batches)
    );

    // Retrieve KYC template
    const kycTemplate: TemplateModel = await this.templateService.findOne(
      tenantId,
      templateId,
      undefined,
      undefined,
    );
    if (!kycTemplate) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: `kycValidationCheck: Template with ID ${templateId} can not be found in DB`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Check KYC template validation
    const templateReviews: ReviewModel[] = await this.reviewService.find(
      tenantId,
      undefined,
      templateId,
      entityId,
      entityClass,
      userId,
    );
    const [kycTemplateValidationCheck, kycTemplateValidationMessage]: [
      boolean,
      string,
    ] = this.verifyTemplateReviewUnicity(
      templateReviews,
      userId, // only required for log message
      entityId, // only required for log message
      templateId, // only required for log message
    );

    // Check KYC elements validation
    const restrictedTopSections: TopSection[] = this.retrieveTopSections(
      topSectionKeys,
      kycTemplate,
    );
    const elementKeysList: string[] = buildTopSectionsElementKeys(
      restrictedTopSections,
    );
    const allElementInstances: {
      [key: string]: UserElementInstance;
    } = await this.elementInstanceService.retrieveKycForUser(
      tenantId,
      entityId,
      entityClass,
      templateId,
      userId,
      true, // atLeastSubmitted
      true, // atLeastValidated
    );
    const allElementKeys: string[] =
      await this.elementInstanceService.extractFullElementKeysList(
        tenantId,
        kycTemplate.topSections,
      );

    const elementsLists: ElementModel[] = await this.elementService.findAll(
      tenantId,
      allElementKeys,
    );

    const elementsMap: { [key: string]: ElementModel } = elementsLists.reduce(
      (map, curr: ElementModel) => ({ ...map, [curr.key]: curr }),
      {},
    );
    const [kycElementValidationCheck, kycElementValidationMessage]: [
      boolean,
      string,
    ] = this.verifyAllElements(
      elementKeysList,
      elementsMap,
      allElementInstances,
    );

    return this.craftAdaptedResponseForGranularity(
      false, // batch (only required for logs)
      undefined, // userIds (only for batches)
      granularity,
      kycTemplateValidationCheck,
      kycTemplateValidationMessage,
      kycElementValidationCheck,
      kycElementValidationMessage,
    );
  }

  craftAdaptedResponseForGranularity = (
    batch: boolean,
    userIds: string[],
    granularity: KycGranularity,
    kycTemplateValidationCheck: boolean,
    kycTemplateValidationMessage: string,
    kycElementValidationCheck: boolean,
    kycElementValidationMessage: string,
  ): [boolean, string] => {
    const userLabel: string = batch
      ? `Batch of ${userIds.length} user(s)`
      : 'User';

    if (granularity === KycGranularity.TEMPLATE_ONLY) {
      if (kycTemplateValidationCheck) {
        return [true, kycTemplateValidationMessage];
      } else {
        return [false, kycTemplateValidationMessage];
      }
    } else if (granularity === KycGranularity.ELEMENT_ONLY) {
      if (kycElementValidationCheck) {
        return [true, kycElementValidationMessage];
      } else {
        return [false, kycElementValidationMessage];
      }
    } else if (granularity === KycGranularity.TEMPLATE_OR_ELEMENT) {
      if (kycTemplateValidationCheck) {
        return [true, kycTemplateValidationMessage];
      } else if (kycElementValidationCheck) {
        return [true, kycElementValidationMessage];
      } else {
        let reasonMessage: string;
        if (!kycTemplateValidationCheck && !kycElementValidationCheck) {
          reasonMessage = `${kycTemplateValidationMessage} and ${kycElementValidationMessage}`;
        } else if (!kycTemplateValidationCheck) {
          reasonMessage = kycTemplateValidationMessage;
        } else if (!kycElementValidationCheck) {
          reasonMessage = kycElementValidationMessage;
        }
        return [
          false,
          `${userLabel} is neither validated at template nor at element granularity level: ${reasonMessage}`,
        ];
      }
    } else if (granularity === KycGranularity.TEMPLATE_AND_ELEMENT) {
      if (kycTemplateValidationCheck && kycElementValidationCheck) {
        return [
          true,
          `${userLabel} is validated both at template and at element granularity level`,
        ];
      } else if (!kycTemplateValidationCheck && !kycElementValidationCheck) {
        return [
          false,
          `${userLabel} is neither validated at template nor at element granularity level: ${kycTemplateValidationMessage} and ${kycElementValidationMessage}`,
        ];
      } else if (!kycTemplateValidationCheck) {
        return [false, kycTemplateValidationMessage];
      } else {
        return [false, kycElementValidationMessage];
      }
    } else {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `invalid KYC granularity: ${granularity}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  };

  retrieveTopSectionsBatch = (
    userIds: string[],
    topSectionKeysByUserId: {
      [userId: string]: string[];
    },
    kycTemplate: TemplateModel,
  ): {
    [userId: string]: TopSection[];
  } => {
    return userIds.reduce(
      (map, userId: string) => ({
        ...map,
        [userId]: this.retrieveTopSections(
          topSectionKeysByUserId[userId],
          kycTemplate,
        ),
      }),
      {},
    );
  };

  retrieveTopSections = (
    topSectionKeys: string[],
    kycTemplate: TemplateModel,
  ): TopSection[] => {
    if (!Array.isArray(topSectionKeys)) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error:
            'kycValidationCheck: parameter "topSectionKeys" is supposed to be an array',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!topSectionKeys.length) {
      return kycTemplate.topSections;
    }

    const topSectionKeysList: string[] = this.extractTopSectionKeys(
      kycTemplate.topSections,
    );

    const invalidTopSectionKey = topSectionKeys.find(
      (topSectionKey: string) => !topSectionKeysList.includes(topSectionKey),
    );

    if (invalidTopSectionKey) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `kycValidationCheck: topSection with key '${invalidTopSectionKey}' is not contained in template with ID ${kycTemplate.id}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return kycTemplate.topSections.filter(({ key }) =>
      topSectionKeys.includes(key),
    );
  };

  checkInputParameters = (
    batch: boolean,
    userId: string,
    userIds: string[],
    templateId: string,
    granularity: string,
    topSectionKeys: string[],
    topSectionKeysByUserId: {
      [userId: string]: string[];
    },
  ): boolean => {
    const functionLabel = `kycValidationCheck${batch ? 'Batch' : ''}`;
    if (batch) {
      if (!topSectionKeysByUserId) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `${functionLabel}: Missing 'topSectionKeysByUserId' input parameter to retrieve batch of validations`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const userIds2: string[] = Object.keys(topSectionKeysByUserId);
      let missingUserId: string;
      const allTopSectionKeysProvided: boolean = userIds.every(
        (currentUserId: string) => {
          if (userIds2.includes(currentUserId)) {
            return true;
          } else {
            missingUserId = currentUserId;
            return false;
          }
        },
      );
      if (!allTopSectionKeysProvided) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `${functionLabel}: Invalid input parameter to retrieve batch of validations - 'topSectionKeysByUserId' doesn't include topSectionKeys for user ${missingUserId}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
    } else {
      if (!userId) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: `${functionLabel}: Missing input parameter (userId)`,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else if (!topSectionKeys) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `${functionLabel}: Missing input parameter (topSectionKeys)`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
    }

    if (!templateId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `${functionLabel}: Missing input parameter (templateId)`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!granularity) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `${functionLabel}: Missing input parameter (granularity)`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return true;
  };

  verifyTemplateReviewUnicity(
    templateReviews: ReviewModel[],
    userId: string, // only required for log message
    entityId: string, // only required for log message
    templateId: string, // only required for log message
  ): [boolean, string] {
    let kycTemplateValidationCheck: boolean;
    let kycTemplateValidationMessage: string;

    if (templateReviews.length < 1) {
      kycTemplateValidationCheck = false;
      kycTemplateValidationMessage = `User ${userId} is not validated at template granularity level`;
    } else if (
      templateReviews.length === 1 &&
      templateReviews[0].status === ReviewStatus.VALIDATED
    ) {
      kycTemplateValidationCheck = true;
      kycTemplateValidationMessage = `User ${userId} is validated at template granularity level`;
    } else {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `kycValidationCheck: More than one review were found for template ${templateId}, entity ${entityId} and user ${userId}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return [kycTemplateValidationCheck, kycTemplateValidationMessage];
  }

  checkValidityDate = (validityDate: Date): boolean => {
    if (!validityDate) {
      return true;
    }
    return validityDate.getTime() > new Date().getTime();
  };

  extractTopSectionKeys = (topSections: TopSection[] = []): string[] => [
    ...new Set(topSections.map(({ key }) => key)),
  ];

  verifyAllElements(
    elementKeysList: string[],
    elementsMap: { [key: string]: ElementModel },
    allElementInstances: { [key: string]: UserElementInstance },
  ): [boolean, string] {
    for (const elementKey of elementKeysList) {
      const element: ElementModel = elementsMap[elementKey];
      if (!element) {
        return [
          false,
          `verifyAllElements: Shall never happen - Element doesnt exist anymore: ${elementKey}`,
        ];
      }

      if (element.status === ElementStatus.MANDATORY) {
        const elementInstance: UserElementInstance =
          allElementInstances[elementKey];

        if (!elementInstance) {
          return [
            false,
            `verifyAllElements: A mandatory kyc element has not been provided or validated: ${elementKey}`,
          ];
        }

        const elementValidityVerification: [boolean, string] =
          this.verifyElementValidity(
            element,
            elementInstance,
            elementsMap,
            allElementInstances,
          );

        if (
          !elementValidityVerification ||
          elementValidityVerification.length !== 2
        ) {
          return [
            false,
            `verifyAllElements: Shall never happen - Invalid function response for element: ${elementKey}`,
          ];
        } else if (!elementValidityVerification[0]) {
          return elementValidityVerification;
        } else {
          // Continue for loop
        }
      } else {
        // Continue for loop
      }
    }

    return [true, 'User is validated at element granularity level'];
  }

  verifyElementValidity(
    element: ElementModel,
    elementInstance: UserElementInstance,
    elementsMap: { [key: string]: ElementModel },
    allElementInstances: { [key: string]: UserElementInstance },
  ): [boolean, string] {
    if (
      elementInstance.status !== ReviewStatus.SUBMITTED &&
      elementInstance.status !== ReviewStatus.VALIDATED
    ) {
      let message: string;
      if (elementInstance.status === ReviewStatus.NOT_SHARED) {
        message = `kycValidationCheck: A mandatory kyc element was provided but not shared with the issuer: ${element.key}`;
      } else if (elementInstance.status === ReviewStatus.REJECTED) {
        message = `kycValidationCheck: A mandatory kyc element was provided but has been rejected by the issuer: ${element.key}`;
      } else {
        message = `kycValidationCheck: Unknown status for element: ${element.key}`;
      }
      return [false, message];
    }

    if (elementInstance.value.length <= 0) {
      return [
        false,
        `kycValidationCheck: Empty value for kyc element: ${elementInstance.id}`,
      ];
    }

    if (
      element.type === ElementType.RADIO ||
      element.type === ElementType.CHECK
    ) {
      return this.verifyResponseFormat(
        element,
        elementInstance,
        elementsMap,
        allElementInstances,
      );
    }

    if (!this.checkValidityDate(elementInstance.validityDate)) {
      return [
        false,
        `kycValidationCheck: A mandatory kyc element was provided but has been expired: ${element.key}`,
      ];
    }

    return [true, 'User is validated at element granularity level'];
  }

  verifyResponseFormat(
    element: ElementModel,
    elementInstance: UserElementInstance,
    elementsMap: { [key: string]: ElementModel },
    allElementInstances: { [key: string]: UserElementInstance },
  ): [boolean, string] {
    if (!checkValidValue(elementInstance.value, element)) {
      return [
        false,
        `verifyResponseFormat: Shall never happen - Invalid element instance value format for element instance: ${elementInstance.id}`,
      ];
    }

    if (!element.inputs || element.inputs.length <= 0) {
      return [
        false,
        `verifyResponseFormat: Shall never happen - Invalid element format for element: ${element.key}`,
      ];
    }

    for (const answerIndex of elementInstance.value) {
      if (!element.inputs[parseInt(answerIndex, 10)]) {
        return [
          false,
          `verifyResponseFormat: Invalid element instance format for element: ${element.key}`,
        ];
      }
      const relatedElementKeys: string[] =
        element.inputs[parseInt(answerIndex, 10)].relatedElements;

      if (relatedElementKeys && relatedElementKeys.length > 0) {
        const relatedElementsVerification: [boolean, string] =
          this.verifyRelatedElement(
            relatedElementKeys,
            elementsMap,
            allElementInstances,
          );

        if (
          !relatedElementsVerification ||
          relatedElementsVerification.length !== 2
        ) {
          return [
            false,
            `verifyResponseFormat: Shall never happen - Invalid function response for element: ${elementInstance.id}`,
          ];
        } else if (!relatedElementsVerification[0]) {
          return relatedElementsVerification;
        } else {
          // Continue for loop
        }
      } else {
        // Continue for loop
      }
    }

    return [true, 'All provided responses were in the correct format'];
  }

  verifyRelatedElement(
    relatedElementKeys: string[],
    elementsMap: { [key: string]: ElementModel },
    allElementInstances: { [key: string]: UserElementInstance },
  ): [boolean, string] {
    for (const relatedElementKey of relatedElementKeys) {
      const subElement: ElementModel = elementsMap[relatedElementKey];
      const subElementInstance: UserElementInstance =
        allElementInstances[relatedElementKey];
      if (!subElement) {
        return [
          false,
          `verifyRelatedElement: Shall never happen - subElement doesnt exist anymore: ${relatedElementKey}`,
        ];
      }
      if (
        subElement.status !== ElementStatus.CONDITIONAL &&
        subElement.status !== ElementStatus.OPTIONAL
      ) {
        return [
          false,
          `verifyRelatedElement: Shall never happen - subElement doesnt have a conditional(or optional) status: ${relatedElementKey}`,
        ];
      }

      if (
        subElement.status === ElementStatus.CONDITIONAL &&
        ((subElement.data || {}).validation || {}).status !==
          ElementStatus.OPTIONAL
      ) {
        // Mandatory element
        if (!subElementInstance) {
          return [
            false,
            `verifyRelatedElement: A conditional kyc element has not been provided: ${relatedElementKey}`,
          ];
        }

        const subElementVerification: [boolean, string] =
          this.verifyElementValidity(
            subElement,
            subElementInstance,
            elementsMap,
            allElementInstances,
          );

        if (!subElementVerification || subElementVerification.length !== 2) {
          return [
            false,
            `verifyRelatedElement: Shall never happen - Invalid function response for element: ${subElementInstance.id}`,
          ];
        } else if (!subElementVerification[0]) {
          return subElementVerification;
        } else {
          // Continue for loop
        }
      } else {
        // Optional element
        // Continue for loop
      }
    }

    // If no error in for loop
    return [
      true,
      'verifyRelatedElement: All related kyc elements were submitted successfully',
    ];
  }
}
