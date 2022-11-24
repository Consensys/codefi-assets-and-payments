import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { ApiCallHelperService } from '.';

import { RawKycTemplate } from 'src/types/kyc/template';
import {
  keys as KycElementKeys,
  KycElement,
  ElementType,
  ElementStatus,
  KycElementInput,
  KycElementInstance,
} from 'src/types/kyc/element';
import { CreateTemplateBodyInput } from 'src/modules/v2KYCTemplate/kyc.template.dto';
import { TemplateEnum, ElementEnum, ReviewEnum } from 'src/old/constants/enum';
import { TranslatedString } from 'src/types/languages';
import {
  keys as KycReviewKeys,
  ReviewStatus,
  ReviewScope,
  KycReview,
  KycGranularity,
  RiskProfile,
  ClientCategory,
} from 'src/types/kyc/review';
import { EntityType } from 'src/types/entity';
import execRetry from 'src/utils/retry';
import { KycApiTenantDeletionResponse } from 'src/modules/v2ApiCall/DTO/kyc-api-tenant-deletion-response.dto';
import { NestJSPinoLogger } from '@consensys/observability';
import axios, { AxiosInstance } from 'axios';

const KYC_HOST: string = process.env.KYC_API;
const API_NAME = 'KYC-Api';

@Injectable()
export class ApiKycCallService {
  constructor(private readonly apiCallHelperService: ApiCallHelperService) {
    this.kycApi = axios.create({
      baseURL: KYC_HOST,
    });
  }

  private kycApi: AxiosInstance;
  /**
   * Retrieve list of all KYC templates
   */
  async listAllKycTemplates(tenantId: string): Promise<Array<RawKycTemplate>> {
    try {
      const retriedClosure = () => {
        return this.kycApi.get(`/templates?tenantId=${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'listing KYC templates',
        response,
        true, // allowZeroLengthData
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'listAllKycTemplates',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Create a KYC template
   *
   * Example of KYC template:
   * {
   *  "issuerId": "f216b1d8-de12-43a8-b178-e93c6dc007f8",
   *  "name": "MataCapitalTemplate",
   *  "topSections": [
   *    {
   *      "label": {
   *  		  "en": "Legal person",
   *  		  "fr": "Personne morale"
   *  	  },
   *      "key": "legalPersonSection",
   *      "sections": [
   *        {
   *          "key": "one",
   *          "label": {
   *  			    "en": "Part 1 : Inscription",
   *  			    "fr": "Part 1 : Inscription"
   *  		    },
   *          "elements": [
   *            "CompanyName_legal",
   *            "CompanyAddress_legal",
   *            "CompanyID_legal"
   *            ]
   *          },
   *          {
   *            "key": "two",
   *            "label": {
   *  			      "en": "Part 2.1 : Investment project of the client",
   *  			      "fr": "Part 2.1 : Projet d'investissement du client"
   *  		    },
   *          "elements": [
   *            "InvestmentObjectives_legal",
   *            "RiskAversity_legal"
   *          ]
   *        }
   *      ]
   *    },
   *    {
   *      "label": {
   *  		  "en": "Natural person",
   *  		  "fr": "Personne physique"
   *  	  },
   *      "key": "naturalPersonSection",
   *      "sections": [
   *        {
   *          "key": "one",
   *          "label": {
   *  			    "en": "Part 1 : Inscription",
   *  			    "fr": "Part 1 : Inscription"
   *  		    },
   *          "elements": [
   *            "FirstName_natural",
   *            "LastName_natural"
   *          ]
   *        },
   *        {
   *          "key": "two",
   *          "label": {
   *  			    "en": "Part 2.1 : Investment project of the client",
   *  			    "fr": "Part 2.1 : Projet d'investissement du client"
   *  		    },
   *          "elements": [
   *            "InvestmentObjectives_natural"
   *          ]
   *        }
   *      ]
   *    }
   *  ]
   *}
   *
   */
  async createKycTemplate(
    tenantId: string,
    kycTemplateToCreate: CreateTemplateBodyInput,
  ): Promise<[RawKycTemplate, boolean]> {
    try {
      const retriedClosure = () => {
        return this.kycApi.post(
          `/templates?tenantId=${tenantId}`,
          kycTemplateToCreate,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating KYC elements',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createKycTemplate', API_NAME, error, 500);
    }
  }

  /**
   * Retrieve a KYC template
   *
   *  - keyType: Defines whether the template(s) shall be fetched per templateId/issuerId/name/etc.
   *  - templateKey: Value of templateId/issuerId/name/etc.
   *  - shallReturnSingleTemplate: Defines whether a single template shall be returned (unique template)
   *    or whether multiple templates shall be returned (array of templates)
   */
  async retrieveKycTemplate(
    tenantId: string,
    keyType: number,
    templateKey: string,
    shallReturnSingleTemplate: boolean,
  ) {
    // : Promise<Array<RawKycTemplate> | RawKycTemplate>
    try {
      let requestUrl;

      if (keyType === TemplateEnum.templateId) {
        requestUrl = `/templates?tenantId=${tenantId}&templateId=${templateKey}`;
      } else if (keyType === TemplateEnum.issuerId) {
        requestUrl = `/templates?tenantId=${tenantId}&issuerId=${templateKey}`;
      } else if (keyType === TemplateEnum.name) {
        requestUrl = `/templates?tenantId=${tenantId}&name=${templateKey}`;
      } else {
        ErrorService.throwError(`Unknown key type: ${keyType}`);
      }

      const retriedClosure = () => {
        return this.kycApi.get(requestUrl);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving KYC template',
        response,
        true, // allowZeroLengthData
      );

      let finalOutput;

      if (response.data.length !== 0) {
        if (shallReturnSingleTemplate) {
          finalOutput = response.data[0];
        } else {
          finalOutput = response.data;
        }
      } else {
        if (shallReturnSingleTemplate) {
          ErrorService.throwError('KYC template does not exist');
        } else {
          finalOutput = response.data;
        }
      }

      return finalOutput;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveKycTemplate',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Update a KYC template
   */
  async updateKycTemplate(
    tenantId: string,
    templateId: string,
    updatedTemplate: CreateTemplateBodyInput,
  ): Promise<RawKycTemplate> {
    try {
      const retriedClosure = () => {
        return this.kycApi.put(
          `/templates/${templateId}?tenantId=${tenantId}`,
          updatedTemplate,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating KYC template',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateKycTemplate', API_NAME, error, 500);
    }
  }

  /**
   * Delete a KYC template
   */
  async deleteKycTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<string> {
    try {
      const retriedClosure = () => {
        return this.kycApi.delete(
          `/templates/${templateId}?tenantId=${tenantId}`,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting KYC template',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteKycTemplate', API_NAME, error, 500);
    }
  }

  /**
   * Retrieve list of all kyc elements
   */
  async listAllKycElements(tenantId: string): Promise<Array<KycElement>> {
    try {
      const retriedClosure = () => {
        return this.kycApi.get(`/elements?tenantId=${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'listing KYC elements',
        response,
        true, // allowZeroLengthData
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'listAllKycElements',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Create a list of kyc elements
   *
   * Example of kyc element:
   * {
   *  "key": "InvestmentObjectives_natural",
   *  "label": {
   *  	"en": "Investment objectives",
   *  	"fr": "Objectifs d'investissement (placement de réserves, provisions techniques, fonds de garantie ….)"
   *  },
   *  "placeholder": {
   *  	"en": "Ex: 100000K€",
   *  	"fr": "Ex: 100000K€"
   *  },
   *  "type": "check",
   *  "status": "mandatory",
   *  "inputs": [
   *    {
   *      "label": {
   *  		  "en": "Diversify your placements",
   *  		  "fr": "Diversifier vos placements"
   *  	  }
   *    },
   *    {
   *      "label": {
   *  		  "en": "Value your capital",
   *  		  "fr": "Valoriser votre capital"
   *  	  }
   *    }
   *  ],
   *  "data": {}
   * }
   *
   */
  async createKycElements(
    tenantId: string,
    kycElementsArray: Array<KycElement>,
  ): Promise<Array<[KycElement, boolean]>> {
    try {
      if (!(kycElementsArray && kycElementsArray.length > 0)) {
        ErrorService.throwError('invalid input format');
      }

      const retriedClosure = () => {
        return this.kycApi.post(
          `/elements?tenantId=${tenantId}`,
          kycElementsArray,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating KYC elements',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createKycElements', API_NAME, error, 500);
    }
  }

  /**
   * Retrieve a KYC element
   *  - keyType: Defines whether the element(s) shall be fetched per elementId/key/etc.
   *  - elementKey: Value of elementId/key/etc.
   *  - shallReturnSingleElement: Defines whether a single element shall be returned (unique element)
   *    or whether multiple elements shall be returned (array of elements)
   */
  async retrieveKycElement(
    tenantId: string,
    keyType: number,
    elementKey: string,
    shallReturnSingleElement: boolean,
  ): Promise<KycElement> {
    try {
      let requestUrl;

      if (keyType === ElementEnum.elementId) {
        requestUrl = `/elements?tenantId=${tenantId}&elementId=${elementKey}`;
      } else if (keyType === ElementEnum.key) {
        requestUrl = `/elements?tenantId=${tenantId}&key=${elementKey}`;
      } else {
        ErrorService.throwError(`Unknown key type: ${elementKey}`);
      }

      const retriedClosure = () => {
        return this.kycApi.get(requestUrl);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving KYC element',
        response,
        true, // allowZeroLengthData
      );

      let finalOutput;

      if (response.data.length !== 0) {
        if (shallReturnSingleElement) {
          finalOutput = response.data[0];
        } else {
          finalOutput = response.data;
        }
      } else {
        if (shallReturnSingleElement) {
          ErrorService.throwError('KYC element does not exist');
        } else {
          finalOutput = response.data;
        }
      }

      return finalOutput;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveKycElement',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Update a KYC element
   */
  async updateKycElement(
    tenantId: string,
    elementId: string,
    updatedElements: Array<{
      [KycElementKeys.ELEMENT_KEY]?: string;
      [KycElementKeys.ELEMENT_TYPE]?: ElementType;
      [KycElementKeys.ELEMENT_STATUS]?: ElementStatus;
      [KycElementKeys.ELEMENT_LABEL]?: TranslatedString;
      [KycElementKeys.ELEMENT_PLACEHOLDER]?: TranslatedString;
      [KycElementKeys.ELEMENT_INPUTS]?: Array<KycElementInput>;
      [KycElementKeys.ELEMENT_DATA]?: any;
    }>,
  ): Promise<KycElement> {
    try {
      const retriedClosure = () => {
        return this.kycApi.put(
          `/elements/${elementId}?tenantId=${tenantId}`,
          updatedElements,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating KYC element',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateKycElement', API_NAME, error, 500);
    }
  }

  /**
   * Delete a KYC element
   */
  async deleteKycElement(tenantId: string, elementId: string): Promise<string> {
    try {
      const retriedClosure = () => {
        return this.kycApi.delete(
          `/elements/${elementId}?tenantId=${tenantId}`,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting KYC element',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteKycElement', API_NAME, error, 500);
    }
  }

  /**
   * Retrieve list of user's KYC element instances formatted for himself
   *
   * For given KYC template, a user can fetch the list of elements he created.
   *  - If 'atLeastSubmitted' === 'true', only elements which have been submitted
   *  to the specified issuer will be included, e.g. elements which have a
   *  link with the issuer.
   *  - In case, multiple elements respond to the criteria, the most recent
   *  is returned.
   */
  async listAllKycElementInstancesFormattedForSubmitter(
    tenantId: string,
    templateId: string,
    userId: string,
    entityId: string,
    entityClass: string,
    atLeastSubmitted: boolean,
  ): Promise<{
    [elementKey: string]: KycElementInstance;
  }> {
    try {
      const params: any = {
        tenantId,
        templateId,
        userId,
        atLeastSubmitted,
      };
      if (entityId) {
        params.entityId = entityId;
      }
      if (entityClass) {
        params.entityClass = entityClass;
      }

      const retriedClosure = () => {
        return this.kycApi.get('/elementInstances/investor', {
          params,
        });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'listing all KYC element instances, formatted for investor',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'listAllKycElementInstancesFormattedForSubmitter',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Retrieve user's kyc elementInstances formatted for issuer
   *
   * For given kyc template, an issuer can fetch the list of elements a user has
   * created and shared with him (by creating a kyc link between the element and him).
   *  - If 'atLeastValidated' === 'true', only elements which have been validated
   *  by the specified issuer will be included, e.g. elements which have a
   *  link with the issuer, and for which the link status is validated.
   *  - In case, multiple elements respond to the criteria, the most recent
   *  is returned.
   *
   * - [OPTIONAL] _ctxStorage: key to store output in context (ctx) if required
   */
  async listAllKycElementInstancesFormattedForIssuer(
    tenantId: string,
    templateId: string,
    userId: string,
    entityId: string,
    entityClass: string,
    atLeastValidated: boolean,
  ): Promise<{
    [elementKey: string]: KycElementInstance;
  }> {
    try {
      const params: any = {
        tenantId,
        templateId,
        userId,
        atLeastValidated,
      };

      if (entityId) {
        params.entityId = entityId;
      }
      if (entityClass) {
        params.entityClass = entityClass;
      }

      const retriedClosure = () => {
        return this.kycApi.get('/elementInstances/issuer', {
          params,
        });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'listing all KYC element instances, formatted for issuer',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'listAllKycElementInstancesFormattedForIssuer',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Retrieve user's kyc elementInstances formatted for admin
   *
   * For given kyc template, an issuer can fetch the list of elements a user has
   * created and shared with him (by creating a kyc link between the element and him).
   *  - If 'atLeastValidated' === 'true', only elements which have been validated
   *  by the specified issuer will be included, e.g. elements which have a
   *  link with the issuer, and for which the link status is validated.
   *  - In case, multiple elements respond to the criteria, the most recent
   *  is returned.
   *
   */
  async listAllKycElementInstancesFormattedForAdmin(
    tenantId: string,
    templateId: string,
    userId: string,
    atLeastValidated: boolean,
  ): Promise<{
    [elementKey: string]: KycElementInstance;
  }> {
    try {
      const params: any = {
        tenantId,
        templateId,
        userId,
        atLeastValidated,
      };

      const retriedClosure = () => {
        return this.kycApi.get('/elementInstances/admin', {
          params,
        });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'listing all KYC element instances, formatted for admin',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'listAllKycElementInstancesFormattedForAdmin',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Create KYC element instances for a user
   *
   * Example of KYC element instance:
   * {
   *  "elementKey": "InvestmentObjectives_natural",
   *  "userId": "f216b1d8-de12-43a8-b178-e93c6dc007f8",
   *  "value": ["Test value"],
   *  "data": {}
   * }
   */
  async createKycElementsInstances(
    tenantId: string,
    elementInstances: Array<{
      [KycElementKeys.ELEMENT_INSTANCE_ELEMENT_KEY]: string;
      [KycElementKeys.ELEMENT_INSTANCE_VALUE]: Array<string>;
      [KycElementKeys.ELEMENT_INSTANCE_USER_ID]: string;
      [KycElementKeys.ELEMENT_INSTANCE_DATA]?: any;
    }>,
    userId: string,
    userEmail: string,
  ): Promise<Array<[KycElementInstance, boolean]>> {
    try {
      const body = {
        userInfo: {
          id: userId,
          email: userEmail,
        },
        elementInstances,
      };

      const retriedClosure = () => {
        return this.kycApi.post(`/elementInstances?tenantId=${tenantId}`, body);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating KYC element instances',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'createKycElementsInstances',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Delete a KYC element instance
   */
  async deleteKycElementInstance(
    tenantId: string,
    elementInstanceId: string,
  ): Promise<string> {
    try {
      const retriedClosure = () => {
        return this.kycApi.delete(
          `/elementInstances/${elementInstanceId}?tenantId=${tenantId}`,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting KYC element instance',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'deleteKycElementInstance',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Create KYC reviews between a kyc element instances and an entity(token/issuer)
   *
   * Example of KYC review:
   * {
   *  "objectId": "59b5a322-8d98-4a9d-9eda-303a99ee2e04",
   *  "entityId": "59b5a322-8d98-4a9d-9eda-303a99ee2e04",
   *  "status": "VALIDATED",
   *  "data": {}
   * }
   *
   */
  async createKycReviews(
    tenantId: string,
    reviews: Array<{
      objectId: string;
      entityId: string;
      entityType: EntityType;
      status: ReviewStatus;
      scope: ReviewScope;
    }>,
  ): Promise<Array<[KycReview, boolean]>> {
    try {
      const retriedClosure = () => {
        return this.kycApi.post(`/reviews?tenantId=${tenantId}`, reviews);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating KYC reviews',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createKycReviews', API_NAME, error, 500);
    }
  }

  /**
   * Retrieve KYC review(s)
   *
   *
   * **** GRANULARITY ****
   * If KYC review is done at template-level:
   *  - "object" corresponds to the ID the KYC template
   *
   * If KYC review is done element-per-element:
   *  - "object" corresponds to the ID the KYC element instance
   *
   *
   *
   * **** SCOPE ****
   * If the KYC review applies to a token (local KYC):
   *  - "entityId" corresponds to the ID the token
   *
   * If the KYC review applies to an issuer (global):
   *  - "entityId" corresponds to the ID the issuer
   *
   *
   */
  async retrieveKycReviews(
    tenantId: string,
    keyType: number,
    elementKey1: string,
    elementKey2: string,
    elementKey3: string,
    elementKey4: string,
  ) {
    try {
      const params: any = {
        tenantId,
      };

      if (keyType === ReviewEnum.reviewId) {
        params.reviewId = elementKey1;
      } else if (keyType === ReviewEnum.objectIdAndEntityId) {
        params.objectId = elementKey1;
        if (elementKey2) {
          params.entityId = elementKey2;
        }
      } else if (keyType === ReviewEnum.objectIdAndEntityIdAndInvestorId) {
        params.objectId = elementKey1;
        if (elementKey2) {
          params.entityId = elementKey2;
        }
        if (elementKey3) {
          params.entityClass = elementKey3;
        }
        params.investorId = elementKey4;
      } else {
        ErrorService.throwError(`unknown key type: ${keyType}`);
      }

      const retriedClosure = () => {
        return this.kycApi.get('/reviews', {
          params,
        });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving KYC review(s)',
        response,
        true, // allowZeroLengthData
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveKycReviews',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Update a list of KYC reviews
   */
  async updateKycReviews(
    tenantId: string,
    updatedReviews: Array<{
      [KycReviewKeys.DEPRECATED_REVIEW_ID]: string;
      [KycReviewKeys.REVIEW_STATUS]: ReviewStatus;
      [KycReviewKeys.REVIEW_CATEGORY]?: ClientCategory;
      [KycReviewKeys.REVIEW_RISK_PROFILE]?: RiskProfile;
      [KycReviewKeys.REVIEW_VALIDITY_DATE]?: Date;
      [KycReviewKeys.REVIEW_COMMENT]?: string;
    }>,
  ): Promise<Array<KycReview>> {
    try {
      const retriedClosure = () => {
        return this.kycApi.put(`/reviews?tenantId=${tenantId}`, updatedReviews);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating KYC review(s)',
        response,
        true, // allowZeroLengthData
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateKycReviews', API_NAME, error, 500);
    }
  }

  /**
   * Delete a KYC review
   */
  async deleteKycReview(tenantId: string, reviewId: string): Promise<string> {
    try {
      const retriedClosure = () => {
        return this.kycApi.delete(`/reviews/${reviewId}?tenantId=${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting KYC review',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteKycReview', API_NAME, error, 500);
    }
  }

  /**
   * Check KYC completion status of a user
   * (e.g. whether or not he provided all the required KYC elements)
   *
   *  - userId: ID of the user who needs to submit his KYC
   *  - entityId: ID of the entity (token/issuer) who's asking for the KYC elements
   *  - templateID: ID of the kyc template which defines which KYC elements are requested from the user
   *  - [OPTIONAL] topSectionKeys: keys of the sections of the template the user is restricted to. If undefined,
   *    the check needs to be valid for all topSections.
   */
  async checkKycCompletion(
    tenantId: string,
    userId: string,
    entityId: string,
    entityClass: string,
    templateId: string,
    topSectionKeys: Array<string>,
  ): Promise<[boolean, string]> {
    try {
      const params = {
        userId: userId,
        entityId: entityId,
        entityClass: entityClass,
        templateId: templateId,
        topSectionKeys: JSON.stringify(topSectionKeys),
      };

      const retriedClosure = () => {
        return this.kycApi.get(`/completion/check?tenantId=${tenantId}`, {
          params,
        });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        "checking user's KYC completion status",
        response,
      );

      const finalOutput = response.data;

      if (finalOutput.length !== 2) {
        throw new Error('wrong response format');
      }

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'checkKycCompletion',
        API_NAME,
        error,
        500,
      );
    }
  }

  async checkBatchKycValidations(
    tenantId: string,
    userIds: Array<string>,
    entityId: string,
    entityClass: string,
    templateId: string,
    topSectionKeysByUserId: {
      [userId: string]: Array<string>;
    },
    granularity: KycGranularity,
  ): Promise<[boolean, string]> {
    try {
      const userIds2: string[] = Object.keys(topSectionKeysByUserId);
      let missingUserId: string;
      const allTopSectionKeysProvided: boolean = userIds.every(
        (userId: string) => {
          if (userIds2.includes(userId)) {
            return true;
          } else {
            missingUserId = userId;
            return false;
          }
        },
      );
      if (!allTopSectionKeysProvided) {
        ErrorService.throwError(
          `invalid input parameter to retrieve batch of KYC validations - 'topSectionKeysByUserId' doesn't include topSectionKeys for user ${missingUserId}`,
        );
      }

      const params = {
        userIds: JSON.stringify(userIds),
        entityId: entityId,
        entityClass: entityClass,
        templateId: templateId,
        topSectionKeysByUserId: JSON.stringify(topSectionKeysByUserId),
        granularity: granularity,
      };

      const retriedClosure = () => {
        return this.kycApi.get(`/validation/check?tenantId=${tenantId}`, {
          params,
        });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        "checking batch of users' KYC validations status",
        response,
      );

      const finalOutput = response.data;

      if (finalOutput.length !== 2) {
        throw new Error('wrong response format');
      }

      return finalOutput;
    } catch (error) {
      ErrorService.throwApiCallError(
        'checkBatchKycValidations',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Check KYC validation status for a user
   * (e.g. whether or not he's been validated all provided KYC elements)
   *
   *  - userId: ID of the user who needs to submit his KYC
   *  - entityId: ID of the entity (token/issuer) who's asking for the KYC elements
   *  - templateID: ID of the kyc template which defines which KYC elements are requested from the user
   *  - [OPTIONAL] topSectionKeys: keys of the sections of the template the user is restricted to. If undefined,
   *    the check needs to be valid for all topSections.
   *
   */
  async checkKycValidation(
    tenantId: string,
    userId: string,
    entityId: string,
    entityClass: string,
    templateId: string,
    topSectionKeys: Array<string>,
    granularity: KycGranularity,
  ): Promise<[boolean, string]> {
    try {
      const params = {
        userId: userId,
        entityId: entityId,
        entityClass: entityClass,
        templateId: templateId,
        topSectionKeys: JSON.stringify(topSectionKeys),
        granularity: granularity,
      };

      const retriedClosure = () => {
        return this.kycApi.get(`/validation/check?tenantId=${tenantId}`, {
          params,
        });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        "checking user's KYC validation status",
        response,
      );

      const finalOutput = response.data;

      if (finalOutput.length !== 2) {
        throw new Error('wrong response format');
      }

      return finalOutput;
    } catch (error) {
      ErrorService.throwApiCallError(
        'checkKycValidation',
        API_NAME,
        error,
        500,
      );
    }
  }
}

@Injectable()
export class ApiKycUtilsService {
  constructor(
    private readonly apiCallHelperService: ApiCallHelperService,
    private readonly logger: NestJSPinoLogger,
  ) {
    logger.setContext(ApiKycCallService.name);
    this.kycApi = axios.create({
      baseURL: KYC_HOST,
    });
  }

  private kycApi: AxiosInstance;

  /**
   * [Delete Tenant data]
   */
  async deleteTenant(tenantId: string): Promise<KycApiTenantDeletionResponse> {
    try {
      const retriedClosure = () => {
        return this.kycApi.delete(`/utils/tenant/${tenantId}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting tenant related data',
        response,
      );

      this.logger.info(
        `Tenant data deleted for KYC API: ${JSON.stringify(response.data)}`,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteTenant', API_NAME, error, 500);
    }
  }
}
