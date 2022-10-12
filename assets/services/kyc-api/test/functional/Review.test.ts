import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { getServer } from 'test/testServer';
import { ElementInstanceModel } from 'src/modules/ElementInstanceModule/ElementInstanceModel';
import { defaultElementInstance1 } from 'test/mocks/ElementInstanceMocks';
import { ElementType } from 'src/utils/constants/enum';
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
  elementInstancesReviewUpdateRequestMock,
  templateReviewCreateRequestMock,
  templateReviewUpdateRequestMock,
} from 'test/mocks/ReviewMocks';
import { ReviewRequest } from 'src/modules/ReviewModule/ReviewRequest';
import { prettify } from 'src/utils/commun';

describe('reviews', () => {
  const defaultUrl = '/reviews';
  const tenantId = 'fakeTenantId';
  let app: request.SuperTest<request.Test>;
  let module: TestingModule;
  let elementInstanceModel: typeof ElementInstanceModel;
  let templateModel: typeof TemplateModel;
  let elementModel: typeof ElementModel;
  let reviewModel: typeof ReviewModel;

  const minimumTemplate: TemplateRequest = {
    ...templateCreateRequestMock,
    topSections: [
      {
        ...templateCreateRequestMock.topSections[0],
        sections: [
          {
            ...templateCreateRequestMock.topSections[0].sections[0],
            elements: [defaultElementInstance1.elementKey],
          },
        ],
      },
    ],
  };

  const minmumElement: ElementRequest = {
    ...elementCreateRequestMock,
    key: defaultElementInstance1.elementKey,
    type: ElementType.STRING,
    inputs: [],
  };

  const addNewElementInstanceToDb = (
    elementInstance: RequestElementInstance,
  ) => {
    return addElementInstanceToDb(elementInstanceModel, {
      ...elementInstance,
      tenantId,
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

  beforeAll(async () => {
    const { superTestApp, moduleRef } = getServer();
    app = superTestApp;
    module = moduleRef;

    elementInstanceModel = module.get('ElementInstanceModelRepository');
    templateModel = module.get('TemplateModelRepository');
    elementModel = module.get('ElementModelRepository');
    reviewModel = module.get('ReviewModelRepository');
  });

  describe('GET /reviews', () => {
    let elementInstanceReview: ReviewModel;
    let templateReview: ReviewModel;

    beforeAll(async () => {
      await removeFromDb(reviewModel, tenantId);
      const [reviewCreated] = await addNewReviewToDb(
        elementInstancesReviewCreateRequestMock,
      );

      elementInstanceReview = reviewCreated;

      const [templateReviewCreated] = await addNewReviewToDb(
        templateReviewCreateRequestMock,
      );

      templateReview = templateReviewCreated;
    });

    afterAll(async () => {
      await removeFromDb(reviewModel, tenantId);
    });

    it('Returns a review by reviewId', async () => {
      const resp = await app
        .get(`${defaultUrl}`)
        .query({ tenantId, reviewId: templateReview.id })
        .expect(200);

      expect(resp.body).toHaveLength(1);
      expect(resp.body[0]).toEqual(
        expect.objectContaining({
          ...templateReviewCreateRequestMock,
          validityDate:
            templateReviewCreateRequestMock.validityDate.toISOString(),
        }),
      );
    });

    it('Returns a review by objectId', async () => {
      const resp = await app
        .get(`${defaultUrl}`)
        .query({
          tenantId,
          objectId: templateReview.objectId,
          entityId: templateReview.entityId,
          entityClass: templateReview.entityClass,
        })
        .expect(200);

      expect(resp.body).toHaveLength(1);
      expect(resp.body[0]).toEqual(
        expect.objectContaining({
          ...templateReviewCreateRequestMock,
          validityDate:
            templateReviewCreateRequestMock.validityDate.toISOString(),
        }),
      );
    });

    it('Returns a review by objectId and investorId', async () => {
      const resp = await app
        .get(`${defaultUrl}`)
        .query({
          tenantId,
          objectId: elementInstanceReview.objectId,
          entityId: elementInstanceReview.entityId,
          entityClass: elementInstanceReview.entityClass,
          investorId: elementInstanceReview.investorId,
        })
        .expect(200);

      expect(resp.body).toHaveLength(1);
      expect(resp.body[0]).toEqual(
        expect.objectContaining({
          ...elementInstancesReviewCreateRequestMock,
          validityDate:
            elementInstancesReviewCreateRequestMock.validityDate.toISOString(),
        }),
      );
    });

    it('Returns a all reviews by tenantId', async () => {
      const resp = await app
        .get(`${defaultUrl}`)
        .query({ tenantId })
        .expect(200);

      expect(resp.body).toHaveLength(2);

      resp.body.forEach((review) => {
        const initialReviewModel = [templateReview, elementInstanceReview].find(
          (r) => review.id === r.id,
        );

        const initialReview = initialReviewModel.toJSON();
        expect(review).toEqual(
          expect.objectContaining({
            ...initialReview,
            validityDate: initialReviewModel.validityDate.toISOString(),
            createdAt: initialReviewModel.createdAt.toISOString(),
            updatedAt: initialReviewModel.updatedAt.toISOString(),
          }),
        );
      });
    });
  });

  describe('POST /reviews', () => {
    let elementInstanceId;
    let templateId;

    const cleanDb = async () =>
      Promise.all([
        removeFromDb(elementInstanceModel, tenantId),
        removeFromDb(elementModel, tenantId),
        removeFromDb(templateModel, tenantId),
        removeFromDb(reviewModel, tenantId),
      ]);

    beforeAll(async () => {
      await cleanDb();

      const [template] = await addNewTemplateToDb();
      templateId = template.id;

      await addNewElementToDb();

      const [elementInstance] = await addNewElementInstanceToDb(
        defaultElementInstance1,
      );

      elementInstanceId = elementInstance.id;
    });

    afterAll(async () => {
      await cleanDb();
    });

    describe('With scope set to TEMPLATE', () => {
      it('Successfully creates a template review', async () => {
        const objectId = templateId;
        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send([{ ...templateReviewCreateRequestMock, objectId }])
          .expect(201);

        expect(resp.body).toHaveLength(1);
        expect(resp.body[0]).toHaveLength(2);
        expect(resp.body[0][0]).toEqual(
          expect.objectContaining({
            ...templateReviewCreateRequestMock,
            validityDate:
              templateReviewCreateRequestMock.validityDate.toISOString(),
            objectId,
          }),
        );
      });

      it('Fails to create a template review when templateId does not exist on db', async () => {
        const fakeTemplateId = uuidv4();
        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send([
            { ...templateReviewCreateRequestMock, objectId: fakeTemplateId },
          ])
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid objectId input: ${prettify(
            fakeTemplateId,
          )} template does not exist`,
        });
      });
    });

    describe('With scope set to ELEMENT_INSTANCE', () => {
      it('Successfully creates an element instance review', async () => {
        const objectId = elementInstanceId;
        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send([{ ...elementInstancesReviewCreateRequestMock, objectId }])
          .expect(201);

        expect(resp.body).toHaveLength(1);
        expect(resp.body[0]).toHaveLength(2);
        expect(resp.body[0][0]).toEqual(
          expect.objectContaining({
            ...elementInstancesReviewCreateRequestMock,
            validityDate:
              elementInstancesReviewCreateRequestMock.validityDate.toISOString(),
            objectId,
          }),
        );
      });

      it('Fails to create an element instance review when templateId does not exist on db', async () => {
        const fakeElementInstanceId = uuidv4();
        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send([
            {
              ...elementInstancesReviewCreateRequestMock,
              objectId: fakeElementInstanceId,
            },
          ])
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid objectId input: ${prettify(
            fakeElementInstanceId,
          )} elementInstance does not exist`,
        });
      });
    });
  });

  describe('PUT /reviews', () => {
    let elementInstanceId;
    let templateId;
    let elementInstanceReview: ReviewModel;
    let templateReview: ReviewModel;

    const cleanDb = async () =>
      Promise.all([
        removeFromDb(elementInstanceModel, tenantId),
        removeFromDb(elementModel, tenantId),
        removeFromDb(templateModel, tenantId),
        removeFromDb(reviewModel, tenantId),
      ]);

    beforeEach(async () => {
      await cleanDb();

      const [template] = await addNewTemplateToDb();
      await addNewElementToDb();
      const [elementInstance] = await addNewElementInstanceToDb(
        defaultElementInstance1,
      );

      templateId = template.id;
      elementInstanceId = elementInstance.id;

      const [reviewCreated] = await addNewReviewToDb({
        ...elementInstancesReviewCreateRequestMock,
        objectId: elementInstanceId,
      });
      const [templateReviewCreated] = await addNewReviewToDb({
        ...templateReviewCreateRequestMock,
        objectId: templateId,
      });

      elementInstanceReview = reviewCreated;
      templateReview = templateReviewCreated;
    });

    afterAll(async () => {
      await cleanDb();
    });

    describe('With scope set to TEMPLATE', () => {
      it('Successfully updates a template review', async () => {
        const objectId = templateId;
        const reviewId = templateReview.id;
        const resp = await app
          .put(`${defaultUrl}?tenantId=${tenantId}`)
          .send([{ ...templateReviewUpdateRequestMock, objectId, reviewId }])
          .expect(200);

        expect(resp.body).toHaveLength(1);
        expect(resp.body[0]).toEqual(
          expect.objectContaining({
            ...templateReviewUpdateRequestMock,
            validityDate:
              templateReviewCreateRequestMock.validityDate.toISOString(),
            objectId,
          }),
        );
      });

      it('Fails to update a template review when templateId does not exist on db', async () => {
        const objectId = uuidv4();
        const reviewId = templateReview.id;
        const resp = await app
          .put(`${defaultUrl}?tenantId=${tenantId}`)
          .send([{ ...templateReviewUpdateRequestMock, objectId, reviewId }])
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid objectId input: ${prettify(
            objectId,
          )} template does not exist`,
        });
      });
    });

    describe('With scope set to ELEMENT_INSTANCE', () => {
      it('Successfully updates an element instance review', async () => {
        const objectId = elementInstanceId;
        const reviewId = elementInstanceReview.id;
        const resp = await app
          .put(`${defaultUrl}?tenantId=${tenantId}`)
          .send([
            { ...elementInstancesReviewUpdateRequestMock, objectId, reviewId },
          ])
          .expect(200);

        expect(resp.body).toHaveLength(1);
        expect(resp.body[0]).toEqual(
          expect.objectContaining({
            ...elementInstancesReviewUpdateRequestMock,
            validityDate:
              elementInstancesReviewUpdateRequestMock.validityDate.toISOString(),
            objectId,
          }),
        );
      });

      it('Fails to update an element instance review when templateId does not exist on db', async () => {
        const objectId = uuidv4();
        const reviewId = elementInstanceReview.id;
        const resp = await app
          .put(`${defaultUrl}?tenantId=${tenantId}`)
          .send([
            { ...elementInstancesReviewUpdateRequestMock, objectId, reviewId },
          ])
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid objectId input: ${prettify(
            objectId,
          )} element instance does not exist`,
        });
      });
    });

    it('Fails to update a review when reviewId does not exist on db', async () => {
      const objectId = templateId;
      const reviewId = uuidv4();
      const resp = await app
        .put(`${defaultUrl}?tenantId=${tenantId}`)
        .send([{ ...templateReviewUpdateRequestMock, objectId, reviewId }])
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the review with id=${reviewId}`,
      });
    });

    it('Fails to update a review when there is already a review on the database with the same objectId and entityId', async () => {
      const reviewId = templateReview.id;
      const [newTemplate] = await addNewTemplateToDb({
        ...templateCreateRequestMock,
        name: 'another template',
      });

      const [newTemplateReview] = await addNewReviewToDb({
        ...templateReviewCreateRequestMock,
        objectId: newTemplate.id,
      });

      const objectId = newTemplate.id;
      const entityId = newTemplateReview.entityId;

      const resp = await app
        .put(`${defaultUrl}?tenantId=${tenantId}`)
        .send([
          { ...templateReviewUpdateRequestMock, objectId, reviewId, entityId },
        ])
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to update the review, since another review with same IDs already exists`,
      });
    });
  });

  describe('DELETE /reviews/:id', () => {
    let templateReview: ReviewModel;

    beforeEach(async () => {
      await removeFromDb(reviewModel, tenantId);

      const [templateReviewCreated] = await addNewReviewToDb(
        templateReviewCreateRequestMock,
      );

      templateReview = templateReviewCreated;
    });

    afterAll(async () => {
      await removeFromDb(reviewModel, tenantId);
    });

    it('Successfully deletes a template review', async () => {
      const reviewId = templateReview.id;
      const resp = await app
        .delete(`${defaultUrl}/${reviewId}?tenantId=${tenantId}`)
        .expect(200);

      expect(resp.body).toEqual({
        message: '1 deleted review(s).',
      });
    });

    it('Fails to delete a review when reviewId does not exist on db', async () => {
      const reviewId = uuidv4();
      const resp = await app
        .delete(`${defaultUrl}/${reviewId}?tenantId=${tenantId}`)
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the review with id=${reviewId}`,
      });
    });
  });
});
