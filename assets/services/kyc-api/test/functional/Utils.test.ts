import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { getServer } from 'test/testServer';
import { ElementInstanceModel } from 'src/modules/ElementInstanceModule/ElementInstanceModel';
import { defaultElementInstance1 } from 'test/mocks/ElementInstanceMocks';
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
import { templateReviewCreateRequestMock } from 'test/mocks/ReviewMocks';
import { ReviewRequest } from 'src/modules/ReviewModule/ReviewRequest';

describe('utils', () => {
  const defaultUrl = '/utils';
  const tenantId = 'fakeTenantId';
  let app: request.SuperTest<request.Test>;
  let module: TestingModule;
  let elementInstanceModel: typeof ElementInstanceModel;
  let templateModel: typeof TemplateModel;
  let elementModel: typeof ElementModel;
  let reviewModel: typeof ReviewModel;

  const addNewElementInstanceToDb = (
    elementInstance: RequestElementInstance = defaultElementInstance1,
  ) => {
    return addElementInstanceToDb(elementInstanceModel, {
      ...elementInstance,
      tenantId,
    });
  };

  const addNewElementToDb = (
    element: ElementRequest = elementCreateRequestMock,
  ) => {
    return addElementToDb(elementModel, { ...element, tenantId });
  };

  const addNewTemplateToDb = (
    template: TemplateRequest = templateCreateRequestMock,
  ) => {
    return addTemplateToDb(templateModel, {
      ...template,
      tenantId,
    });
  };

  const addNewReviewToDb = (
    review: ReviewRequest = templateReviewCreateRequestMock,
  ) => {
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

  describe('DELETE /tenant/:tenantId', () => {
    beforeEach(async () => {
      await cleanDb();

      await addNewTemplateToDb();
      await addNewElementToDb();
      await addNewElementInstanceToDb();
      await addNewReviewToDb();
    });

    afterAll(async () => {
      await cleanDb();
    });

    it('Successufully deletes all entities by tenantId', async () => {
      const resp = await app
        .delete(`${defaultUrl}/tenant/${tenantId}`)
        .expect(200);

      expect(resp.body).toEqual({
        deletedElementInstancesTotal: 1,
        deletedElementsTotal: 1,
        deletedReviewsTotal: 1,
        deletedTemplatesTotal: 1,
        message: 'Tenant fakeTenantId deleted successfully',
      });
    });
  });
});
