import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { getServer } from 'test/testServer';
import { ElementInstanceModel } from 'src/modules/ElementInstanceModule/ElementInstanceModel';
import { defaultElementInstance1 } from 'test/mocks/ElementInstanceMocks';
import {
  ElementType,
  KycGranularity,
  ReviewStatus,
} from 'src/utils/constants/enum';
import { TemplateModel } from 'src/modules/TemplateModule/TemplateModel';
import { ElementModel } from 'src/modules/ElementModule/ElementModel';
import { ElementRequest } from 'src/modules/ElementModule/ElementRequest';
import { templateCreateRequestMock } from 'test/mocks/TemplateMocks';
import { TemplateRequest } from 'src/modules/TemplateModule/TemplateRequest';
import { elementCreateRequestMock } from 'test/mocks/ElementMocks';
import { ReviewModel } from 'src/modules/ReviewModule/ReviewModel';
import {
  addElementInstanceToDb,
  addElementToDb,
  addTemplateToDb,
  addReviewToDb,
  removeFromDb,
} from 'test/dbHelpers';
import { RequestElementInstance } from 'src/modules/ElementInstanceModule/RequestElementInstance';
import {
  elementInstancesReviewCreateRequestMock,
  templateReviewCreateRequestMock,
} from 'test/mocks/ReviewMocks';
import { ReviewRequest } from 'src/modules/ReviewModule/ReviewRequest';

describe('check', () => {
  const tenantId = 'fakeTenantId';
  let app: request.SuperTest<request.Test>;
  let module: TestingModule;
  let elementInstanceModel: typeof ElementInstanceModel;
  let templateModel: typeof TemplateModel;
  let elementModel: typeof ElementModel;
  let reviewModel: typeof ReviewModel;

  const elementKey = 'fake_element_key';

  const minimumTemplate: TemplateRequest = {
    ...templateCreateRequestMock,
    topSections: [
      {
        ...templateCreateRequestMock.topSections[0],
        sections: [
          {
            ...templateCreateRequestMock.topSections[0].sections[0],
            elements: [elementKey],
          },
        ],
      },
    ],
  };

  const minmumElement: ElementRequest = {
    ...elementCreateRequestMock,
    key: elementKey,
    type: ElementType.STRING,
    inputs: [],
  };

  const addNewElementInstanceToDb = (
    elementInstance: RequestElementInstance = defaultElementInstance1,
  ) => {
    return addElementInstanceToDb(elementInstanceModel, {
      ...elementInstance,
      tenantId,
      elementKey,
    });
  };

  const addNewElementToDb = (element: ElementRequest = minmumElement) => {
    return addElementToDb(elementModel, { ...element, tenantId });
  };

  const addNewTemplateToDb = (template: TemplateRequest = minimumTemplate) => {
    return addTemplateToDb(templateModel, {
      ...template,
      tenantId,
    });
  };

  const addNewReviewToDb = (review: ReviewRequest) => {
    return addReviewToDb(reviewModel, {
      ...review,
      tenantId,
    });
  };

  const cleanDb = async () =>
    Promise.all([
      removeFromDb(elementInstanceModel, tenantId),
      removeFromDb(elementModel, tenantId),
      removeFromDb(templateModel, tenantId),
      removeFromDb(reviewModel, tenantId),
    ]);

  beforeAll(async () => {
    const { superTestApp, moduleRef } = getServer();
    app = superTestApp;
    module = moduleRef;

    elementInstanceModel = module.get('ElementInstanceModelRepository');
    templateModel = module.get('TemplateModelRepository');
    elementModel = module.get('ElementModelRepository');
    reviewModel = module.get('ReviewModelRepository');
  });

  describe('GET /completion/check', () => {
    let template: TemplateModel;
    let elementInstance: ElementInstanceModel;
    let elementInstanceReview: ReviewModel;

    beforeEach(async () => {
      await cleanDb();

      const [templateCreated] = await addNewTemplateToDb();
      await addNewElementToDb();
      const [elementInstanceCreated] = await addNewElementInstanceToDb();

      template = templateCreated;
      elementInstance = elementInstanceCreated;

      const [reviewCreated] = await addNewReviewToDb({
        ...elementInstancesReviewCreateRequestMock,
        objectId: elementInstance.id,
        status: ReviewStatus.SUBMITTED,
      });

      elementInstanceReview = reviewCreated;
    });

    afterAll(async () => {
      await cleanDb();
    });

    it('Returns true if kyc is completed', async () => {
      const { userId } = elementInstance;
      const { entityId, entityClass } = elementInstanceReview;
      const { id: templateId, topSections } = template;

      const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));
      const resp = await app
        .get('/completion/check')
        .query({
          tenantId,
          templateId,
          entityId,
          entityClass,
          userId,
          topSectionKeys,
        })
        .expect(200);

      expect(resp.body).toEqual([
        true,
        'Successful kyc completion check: All requested kyc elements have been submitted',
      ]);
    });

    it('Returns true if kyc is completed for all template topSections when topSections is sent as an empty array', async () => {
      const { userId } = elementInstance;
      const { entityId, entityClass } = elementInstanceReview;
      const { id: templateId } = template;

      const topSectionKeys = JSON.stringify([]);
      const resp = await app
        .get('/completion/check')
        .query({
          tenantId,
          templateId,
          entityId,
          entityClass,
          userId,
          topSectionKeys,
        })
        .expect(200);

      expect(resp.body).toEqual([
        true,
        'Successful kyc completion check: All requested kyc elements have been submitted',
      ]);
    });

    it('Fails if templateId does not exist', async () => {
      const { userId } = elementInstance;
      const { entityId, entityClass } = elementInstanceReview;
      const { topSections } = template;
      const templateId = uuidv4();
      const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));

      const resp = await app
        .get('/completion/check')
        .query({
          tenantId,
          templateId,
          entityId,
          entityClass,
          userId,
          topSectionKeys,
        })
        .expect(404);

      expect(resp.body).toEqual({
        status: 404,
        error: `kycCompletionCheck: Template with ID ${templateId} can not be found in DB`,
      });
    });

    it('Fails if topSectionKey is not part of the template topSection keys', async () => {
      const { userId } = elementInstance;
      const { entityId, entityClass } = elementInstanceReview;
      const { id: templateId } = template;
      const invalidTopSectionKey = 'this_top_section_does_not_exist';
      const topSectionKeys = JSON.stringify([invalidTopSectionKey]);

      const resp = await app
        .get('/completion/check')
        .query({
          tenantId,
          templateId,
          entityId,
          entityClass,
          userId,
          topSectionKeys,
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `kycValidationCheck: topSection with key '${invalidTopSectionKey}' is not contained in template with ID ${templateId}`,
      });
    });

    it('Fails if topSectionKey is not an array', async () => {
      const { userId } = elementInstance;
      const { entityId, entityClass } = elementInstanceReview;
      const { id: templateId } = template;
      const invalidTopSectionKey = 'this_top_section_does_not_exist';
      const topSectionKeys = JSON.stringify({ invalidTopSectionKey });

      const resp = await app
        .get('/completion/check')
        .query({
          tenantId,
          templateId,
          entityId,
          entityClass,
          userId,
          topSectionKeys,
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error:
          'kycValidationCheck: parameter "topSectionKeys" is supposed to be an array',
      });
    });

    it('Fails if we are not sending the userId as querystring', async () => {
      const { entityId, entityClass } = elementInstanceReview;
      const { topSections, id: templateId } = template;
      const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));

      const resp = await app
        .get('/completion/check')
        .query({
          tenantId,
          templateId,
          entityId,
          entityClass,
          topSectionKeys,
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `kycValidationCheck: Missing input parameter (userId)`,
      });
    });

    it('Fails if we are not sending the topSectionKeyss as querystring', async () => {
      const { userId } = elementInstance;
      const { entityId, entityClass } = elementInstanceReview;
      const { id: templateId } = template;

      const resp = await app
        .get('/completion/check')
        .query({
          tenantId,
          templateId,
          userId,
          entityId,
          entityClass,
        })
        .expect(404);

      expect(resp.body).toEqual({
        status: 404,
        error: `kycValidationCheck: Missing input parameter (topSectionKeys)`,
      });
    });

    it('Fails if we are not sending the templateId as querystring', async () => {
      const { userId } = elementInstance;
      const { entityId, entityClass } = elementInstanceReview;
      const { topSections } = template;
      const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));

      const resp = await app
        .get('/completion/check')
        .query({
          tenantId,
          userId,
          entityId,
          entityClass,
          topSectionKeys,
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `kycValidationCheck: Missing input parameter (templateId)`,
      });
    });
  });

  describe('GET /validation/check', () => {
    let template: TemplateModel;
    let elementInstance: ElementInstanceModel;
    let elementInstanceReview: ReviewModel;
    let templateReview: ReviewModel;

    beforeEach(async () => {
      await cleanDb();

      const [templateCreated] = await addNewTemplateToDb();
      await addNewElementToDb();
      const [elementInstanceCreated] = await addNewElementInstanceToDb();

      template = templateCreated;
      elementInstance = elementInstanceCreated;

      const [reviewCreated] = await addNewReviewToDb({
        ...elementInstancesReviewCreateRequestMock,
        objectId: elementInstance.id,
      });
      const [templateReviewCreated] = await addNewReviewToDb({
        ...templateReviewCreateRequestMock,
        objectId: template.id,
        investorId: elementInstance.userId,
        entityId: reviewCreated.entityId,
        entityClass: reviewCreated.entityClass,
      });

      elementInstanceReview = reviewCreated;
      templateReview = templateReviewCreated;
    });

    afterAll(async () => {
      await cleanDb();
    });

    describe('With batch users', () => {
      describe(`With granularity ${KycGranularity.TEMPLATE_ONLY}`, () => {
        it('Returns true if kyc is validated', async () => {
          const { userId } = elementInstance;
          const { entityId, entityClass } = templateReview;
          const { id: templateId, topSections } = template;

          const resp = await app
            .get('/validation/check')
            .query({
              tenantId,
              templateId,
              entityId,
              entityClass,
              userIds: JSON.stringify([userId]),
              topSectionKeysByUserId: JSON.stringify({
                [userId]: topSections.map((t) => t.key),
              }),
              granularity: KycGranularity.TEMPLATE_ONLY,
            })
            .expect(200);

          expect(resp.body).toEqual([
            true,
            `Batch of 1 user(s) is validated at template granularity level`,
          ]);
        });

        it('Returns false if no validated template review is found', async () => {
          const { userId } = elementInstance;
          const { entityId } = templateReview;
          const { id: templateId, topSections } = template;

          const resp = await app
            .get('/validation/check')
            .query({
              tenantId,
              templateId,
              entityId,
              entityClass: 'this_does_not_exist',
              userIds: JSON.stringify([userId]),
              topSectionKeysByUserId: JSON.stringify({
                [userId]: topSections.map((t) => t.key),
              }),
              granularity: KycGranularity.TEMPLATE_ONLY,
            })
            .expect(200);

          expect(resp.body).toEqual([
            false,
            `User ${userId} is not validated at template granularity level`,
          ]);
        });
      });

      it('Fails if we are not sending the topSectionKeyss as querystring', async () => {
        const { userId } = elementInstance;
        const { entityId, entityClass } = templateReview;
        const { id: templateId } = template;

        const resp = await app
          .get('/validation/check')
          .query({
            tenantId,
            templateId,
            entityId,
            entityClass,
            userIds: JSON.stringify([userId]),
            granularity: KycGranularity.TEMPLATE_ONLY,
          })
          .expect(404);

        expect(resp.body).toEqual({
          status: 404,
          error:
            "kycValidationCheckBatch: Missing 'topSectionKeysByUserId' input parameter to retrieve batch of validations",
        });
      });

      it('Fails if templateId does not exist', async () => {
        const { userId } = elementInstance;
        const { entityId, entityClass } = templateReview;
        const { topSections } = template;
        const templateId = uuidv4();

        const resp = await app
          .get('/validation/check')
          .query({
            tenantId,
            templateId,
            entityId,
            entityClass,
            userIds: JSON.stringify([userId]),
            topSectionKeysByUserId: JSON.stringify({
              [userId]: topSections.map((t) => t.key),
            }),
            granularity: KycGranularity.TEMPLATE_ONLY,
          })
          .expect(404);

        expect(resp.body).toEqual({
          status: 404,
          error: `kycValidationCheck: Template with ID ${templateId} can not be found in DB`,
        });
      });
    });

    describe(`With granularity ${KycGranularity.TEMPLATE_ONLY}`, () => {
      it('Returns true if kyc is validated', async () => {
        const { userId } = elementInstance;
        const { entityId, entityClass } = templateReview;
        const { id: templateId, topSections } = template;

        const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));
        const resp = await app
          .get('/validation/check')
          .query({
            tenantId,
            templateId,
            entityId,
            entityClass,
            userId,
            topSectionKeys,
            granularity: KycGranularity.TEMPLATE_ONLY,
          })
          .expect(200);

        expect(resp.body).toEqual([
          true,
          `User ${userId} is validated at template granularity level`,
        ]);
      });

      it('Returns false if no validated template review is found', async () => {
        const { userId } = elementInstance;
        const { entityId } = templateReview;
        const { id: templateId, topSections } = template;

        const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));
        const resp = await app
          .get('/validation/check')
          .query({
            tenantId,
            templateId,
            entityId,
            entityClass: 'this_does_not_exist',
            userId,
            topSectionKeys,
            granularity: KycGranularity.TEMPLATE_ONLY,
          })
          .expect(200);

        expect(resp.body).toEqual([
          false,
          `User ${userId} is not validated at template granularity level`,
        ]);
      });
    });

    describe(`With granularity ${KycGranularity.ELEMENT_ONLY}`, () => {
      it('Returns true if kyc is validated', async () => {
        const { userId } = elementInstance;
        const { entityId, entityClass } = elementInstanceReview;
        const { id: templateId, topSections } = template;

        const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));
        const resp = await app
          .get('/validation/check')
          .query({
            tenantId,
            templateId,
            entityId,
            entityClass,
            userId,
            topSectionKeys,
            granularity: KycGranularity.ELEMENT_ONLY,
          })
          .expect(200);

        expect(resp.body).toEqual([
          true,
          `User is validated at element granularity level`,
        ]);
      });

      it('Returns false if no validated template review is found', async () => {
        const { userId, elementKey: elementInstanceKey } = elementInstance;
        const { entityId } = elementInstanceReview;
        const { id: templateId, topSections } = template;

        const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));
        const resp = await app
          .get('/validation/check')
          .query({
            tenantId,
            templateId,
            entityId,
            entityClass: 'this_does_not_exist',
            userId,
            topSectionKeys,
            granularity: KycGranularity.ELEMENT_ONLY,
          })
          .expect(200);

        expect(resp.body).toEqual([
          false,
          `verifyAllElements: A mandatory kyc element has not been provided or validated: ${elementInstanceKey}`,
        ]);
      });
    });

    describe(`With granularity ${KycGranularity.TEMPLATE_AND_ELEMENT}`, () => {
      it('Returns true if kyc is validated', async () => {
        const { userId } = elementInstance;
        const { entityId, entityClass } = templateReview;
        const { id: templateId, topSections } = template;

        const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));
        const resp = await app
          .get('/validation/check')
          .query({
            tenantId,
            templateId,
            entityId,
            entityClass,
            userId,
            topSectionKeys,
            granularity: KycGranularity.TEMPLATE_AND_ELEMENT,
          })
          .expect(200);

        expect(resp.body).toEqual([
          true,
          `User is validated both at template and at element granularity level`,
        ]);
      });

      it('Returns false if no validated template review is found', async () => {
        const { userId } = elementInstance;
        const { entityId } = templateReview;
        const { id: templateId, topSections } = template;

        const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));
        const resp = await app
          .get('/validation/check')
          .query({
            tenantId,
            templateId,
            entityId,
            entityClass: 'this_does_not_exist',
            userId,
            topSectionKeys,
            granularity: KycGranularity.TEMPLATE_AND_ELEMENT,
          })
          .expect(200);

        expect(resp.body).toEqual([
          false,
          `User is neither validated at template nor at element granularity level: User ${userId} is not validated at template granularity level and verifyAllElements: A mandatory kyc element has not been provided or validated: fake_element_key`,
        ]);
      });
    });

    describe(`With granularity ${KycGranularity.TEMPLATE_OR_ELEMENT}`, () => {
      it('Returns true if kyc is validated at Template level', async () => {
        const { userId } = elementInstance;
        const { entityId, entityClass } = templateReview;
        const { id: templateId, topSections } = template;

        const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));
        const resp = await app
          .get('/validation/check')
          .query({
            tenantId,
            templateId,
            entityId,
            entityClass,
            userId,
            topSectionKeys,
            granularity: KycGranularity.TEMPLATE_OR_ELEMENT,
          })
          .expect(200);

        expect(resp.body).toEqual([
          true,
          `User ${userId} is validated at template granularity level`,
        ]);
      });

      it('Returns false if no validated template review is found', async () => {
        const { userId } = elementInstance;
        const { entityId } = templateReview;
        const { id: templateId, topSections } = template;

        const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));
        const resp = await app
          .get('/validation/check')
          .query({
            tenantId,
            templateId,
            entityId,
            entityClass: 'this_does_not_exist',
            userId,
            topSectionKeys,
            granularity: KycGranularity.TEMPLATE_OR_ELEMENT,
          })
          .expect(200);

        expect(resp.body).toEqual([
          false,
          `User is neither validated at template nor at element granularity level: User ${userId} is not validated at template granularity level and verifyAllElements: A mandatory kyc element has not been provided or validated: fake_element_key`,
        ]);
      });
    });

    it('Returns false if element does not exist anymore', async () => {
      await removeFromDb(elementModel, tenantId);
      const { userId } = elementInstance;
      const { entityId, entityClass } = templateReview;
      const { topSections, id: templateId } = template;
      const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));

      const resp = await app
        .get('/validation/check')
        .query({
          tenantId,
          templateId,
          entityId,
          entityClass,
          userId,
          topSectionKeys,
          granularity: KycGranularity.TEMPLATE_AND_ELEMENT,
        })
        .expect(200);

      expect(resp.body).toEqual([
        false,
        `verifyAllElements: Shall never happen - Element doesnt exist anymore: ${elementKey}`,
      ]);
    });

    it('Fails if templateId does not exist', async () => {
      const { userId } = elementInstance;
      const { entityId, entityClass } = templateReview;
      const { topSections } = template;
      const templateId = uuidv4();
      const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));

      const resp = await app
        .get('/validation/check')
        .query({
          tenantId,
          templateId,
          entityId,
          entityClass,
          userId,
          topSectionKeys,
          granularity: KycGranularity.TEMPLATE_AND_ELEMENT,
        })
        .expect(404);

      expect(resp.body).toEqual({
        status: 404,
        error: `kycValidationCheck: Template with ID ${templateId} can not be found in DB`,
      });
    });

    it('Fails if we are not sending granularity querystring', async () => {
      const { userId } = elementInstance;
      const { entityId, entityClass } = elementInstanceReview;
      const { id: templateId, topSections } = template;
      const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));

      const resp = await app
        .get('/validation/check')
        .query({
          tenantId,
          templateId,
          entityId,
          entityClass,
          userId,
          topSectionKeys,
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `kycValidationCheck: Missing input parameter (granularity)`,
      });
    });

    it('Fails if granularity is not a known value', async () => {
      const { userId } = elementInstance;
      const { entityId, entityClass } = elementInstanceReview;
      const { id: templateId, topSections } = template;
      const topSectionKeys = JSON.stringify(topSections.map((t) => t.key));
      const granularity = 'this_granularity_does_not_exist';

      const resp = await app
        .get('/validation/check')
        .query({
          tenantId,
          templateId,
          entityId,
          entityClass,
          userId,
          topSectionKeys,
          granularity,
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `invalid KYC granularity: ${granularity}`,
      });
    });
  });
});
