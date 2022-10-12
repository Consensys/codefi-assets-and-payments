import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import nock from 'nock';
import { v4 as uuidv4 } from 'uuid';
import { getServer } from 'test/testServer';
import { ElementInstanceModel } from 'src/modules/ElementInstanceModule/ElementInstanceModel';
import {
  defaultElementInstance1,
  defaultElementInstance2,
  elementInstanceCreateRequestMock,
} from 'test/mocks/ElementInstanceMocks';
import { ElementType } from 'src/utils/constants/enum';
import { prettify } from 'src/utils/commun';
import { metadataApiRetrieveConfigMock } from 'test/mocks/ConfigMock';
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
import { elementInstancesReviewCreateRequestMock } from 'test/mocks/ReviewMocks';

const METADATA_HOST = process.env.METADATA_API;
const EXTERNAL_IDENTITY_HOST = process.env.EXTERNAL_IDENTITY_API;

describe('elementInstances', () => {
  const defaultUrl = '/elementInstances';
  const tenantId = 'fakeTenantId';
  let app: request.SuperTest<request.Test>;
  let module: TestingModule;
  let elementInstanceModel: typeof ElementInstanceModel;
  let templateModel: typeof TemplateModel;
  let elementModel: typeof ElementModel;
  let reviewModel: typeof ReviewModel;

  const addNewElementInstanceToDb = (
    elementInstance: RequestElementInstance,
  ) => {
    return addElementInstanceToDb(elementInstanceModel, {
      ...elementInstance,
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

    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  describe('GET /elementInstances', () => {
    let elementInstance1Id;

    beforeAll(async () => {
      await removeFromDb(elementInstanceModel, tenantId);
      const [[elementInstance1]] = await Promise.all([
        addNewElementInstanceToDb(defaultElementInstance1),
        addNewElementInstanceToDb(defaultElementInstance2),
      ]);

      elementInstance1Id = elementInstance1.id;
    });

    afterAll(async () => {
      await removeFromDb(elementInstanceModel, tenantId);
    });

    describe('with tenantId as query string', () => {
      it('Returns all elementInstances', async () => {
        const resp = await app
          .get(`${defaultUrl}?tenantId=${tenantId}`)
          .expect(200);

        expect(resp.body).toHaveLength(2);

        resp.body.forEach((elementInstance) => {
          const initialElementInstances = [
            defaultElementInstance1,
            defaultElementInstance2,
          ].find((e) => elementInstance.elementKey === e.elementKey);
          expect(elementInstance).toEqual(
            expect.objectContaining(initialElementInstances),
          );
        });
      });

      it('Returns all elementInstances by userId', async () => {
        const resp = await app
          .get(
            `${defaultUrl}?tenantId=${tenantId}&userId=${defaultElementInstance1.userId}`,
          )
          .expect(200);

        expect(resp.body).toHaveLength(1);
        expect(resp.body[0]).toEqual(
          expect.objectContaining(defaultElementInstance1),
        );
      });

      it('Returns all elementInstances by elementKey and userId', async () => {
        const resp = await app
          .get(
            `${defaultUrl}?tenantId=${tenantId}&elementKey=${defaultElementInstance1.elementKey}&userId=${defaultElementInstance1.userId}`,
          )
          .expect(200);

        expect(resp.body).toHaveLength(1);
        expect(resp.body[0]).toEqual(
          expect.objectContaining(defaultElementInstance1),
        );
      });

      it('Returns all elementInstances if only elementKey is sent (ignores elementKey filter)', async () => {
        const resp = await app
          .get(
            `${defaultUrl}?tenantId=${tenantId}&elementKey=${defaultElementInstance1.elementKey}`,
          )
          .expect(200);

        expect(resp.body).toHaveLength(2);

        resp.body.forEach((elementInstance) => {
          const initialElementInstances = [
            defaultElementInstance1,
            defaultElementInstance2,
          ].find((e) => elementInstance.elementKey === e.elementKey);
          expect(elementInstance).toEqual(
            expect.objectContaining(initialElementInstances),
          );
        });
      });

      it('Returns all elementInstances by elementId', async () => {
        const resp = await app
          .get(
            `${defaultUrl}?tenantId=${tenantId}&elementId=${elementInstance1Id}`,
          )
          .expect(200);

        expect(resp.body).toHaveLength(1);
        expect(resp.body[0]).toEqual(
          expect.objectContaining(defaultElementInstance1),
        );
      });
    });

    describe('without tenantId as query string', () => {
      it('Fails with a validation error', async () => {
        const resp = await app.get(`${defaultUrl}`).expect(422);

        expect(resp.body).toEqual({
          statusCode: 422,
          error: ['"tenantId" is required'],
          message: 'Validation error',
        });
      });
    });
  });

  describe('GET /elementInstances/admin', () => {
    let elementInstance1Id;
    let templateId;

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

    const element: ElementRequest = {
      ...elementCreateRequestMock,
      key: defaultElementInstance1.elementKey,
      type: ElementType.STRING,
      inputs: [],
    };

    const cleanDb = async () =>
      Promise.all([
        removeFromDb(elementInstanceModel, tenantId),
        removeFromDb(elementModel, tenantId),
        removeFromDb(templateModel, tenantId),
        removeFromDb(reviewModel, tenantId),
      ]);

    beforeAll(async () => {
      await cleanDb();

      const [template] = await addTemplateToDb(templateModel, {
        ...minimumTemplate,
        tenantId,
      });
      templateId = template.id;

      await addElementToDb(elementModel, { ...element, tenantId });

      const [elementInstance1] = await addNewElementInstanceToDb(
        defaultElementInstance1,
      );

      elementInstance1Id = elementInstance1.id;

      await addReviewToDb(reviewModel, {
        ...elementInstancesReviewCreateRequestMock,
        tenantId,
        entityClass: null,
        entityId: null,
        objectId: elementInstance1Id,
      });
    });

    afterAll(async () => {
      await cleanDb();
    });

    it('Returns all element instances of a kyc template for user given user', async () => {
      const resp = await app
        .get(`${defaultUrl}/admin`)
        .query({ tenantId, templateId, userId: defaultElementInstance1.userId })
        .expect(200);

      expect(Object.keys(resp.body)).toHaveLength(1);
      expect(Object.keys(resp.body)[0]).toEqual(
        defaultElementInstance1.elementKey,
      );
      expect(resp.body[defaultElementInstance1.elementKey]).toEqual(
        expect.objectContaining({
          id: elementInstance1Id,
          tenantId: 'fakeTenantId',
          elementKey: 'firstName_natural',
          userId: defaultElementInstance1.userId,
          value: ['test_value'],
          data: {},
          status: 'VALIDATED',
          comment: 'ok - no comment',
          validityDate: '2045-12-19T09:24:00.000Z',
          category: null,
          riskProfile: null,
        }),
      );
    });

    it('Fails to return all element instances of a kyc template when templateId does not exist on db', async () => {
      const fakeTemplateId = uuidv4();
      const resp = await app
        .get(`${defaultUrl}/admin`)
        .query({
          tenantId,
          templateId: fakeTemplateId,
          userId: defaultElementInstance1.userId,
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Failed fetching kyc template with ID: ${fakeTemplateId}`,
      });
    });
  });

  describe('POST /elementInstances', () => {
    beforeEach(async () => {
      await removeFromDb(elementInstanceModel, tenantId);
    });

    afterAll(async () => {
      await removeFromDb(elementInstanceModel, tenantId);
    });

    it('Successufully creates elementInstances', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(elementInstanceCreateRequestMock)
        .expect(201);

      expect(resp.body).toHaveLength(1);
      expect(resp.body[0]).toHaveLength(2);
      expect(resp.body[0][0]).toEqual(
        expect.objectContaining(
          elementInstanceCreateRequestMock.elementInstances[0],
        ),
      );
      expect(resp.body[0][1]).toBe(true);
    });

    describe('With onfido element', () => {
      it('Successufully creates an elementInstance and creates and applicant on onfido', async () => {
        nock(METADATA_HOST)
          .get(`/configs`)
          .query(true)
          .reply(200, [metadataApiRetrieveConfigMock]);

        nock(`${EXTERNAL_IDENTITY_HOST}/kyc-provider/onfido`)
          .post('/create-applicant')
          .query(true)
          .reply(201, '');

        nock(`${EXTERNAL_IDENTITY_HOST}/kyc-provider/onfido`)
          .get(
            `/jwt-token/userId=${elementInstanceCreateRequestMock.elementInstances[0].userId}`,
          )
          .query(true)
          .reply(200, 'fakeJWTToken');

        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send({
            ...elementInstanceCreateRequestMock,
            elementInstances: [
              {
                ...elementInstanceCreateRequestMock.elementInstances[0],
                elementKey: 'onfido_onfido_naturalPersonSection',
              },
            ],
          })
          .expect(201);

        expect(resp.body).toHaveLength(1);
        expect(resp.body[0]).toHaveLength(2);
        expect(resp.body[0][0]).toEqual(
          expect.objectContaining({
            ...elementInstanceCreateRequestMock.elementInstances[0],
            elementKey: 'onfido_onfido_naturalPersonSection',
            tenantId,
            data: { jwtToken: 'fakeJWTToken' },
            value: ['done'],
          }),
        );
        expect(resp.body[0][1]).toBe(true);
      });

      it('Successfully creates element, but bypasses onfido creation if it fails to retrieve tenant config', async () => {
        nock(METADATA_HOST).get(`/configs`).query(true).reply(200, []);

        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send({
            ...elementInstanceCreateRequestMock,
            elementInstances: [
              {
                ...elementInstanceCreateRequestMock.elementInstances[0],
                elementKey: 'onfido_onfido_naturalPersonSection',
              },
            ],
          })
          .expect(201);

        expect(resp.body).toHaveLength(1);
        expect(resp.body[0]).toHaveLength(2);
        expect(resp.body[0][0]).toEqual(
          expect.objectContaining({
            ...elementInstanceCreateRequestMock.elementInstances[0],
            elementKey: 'onfido_onfido_naturalPersonSection',
            tenantId,
            data: {
              onfidoError:
                'retrieveConfig --> [[Metadata-API]] no config has been found',
            },
            value: ['done'],
          }),
        );
        expect(resp.body[0][1]).toBe(true);
      });
    });

    it("Successufully creates an elementInstance even when there's an instance with the same keys but with different values", async () => {
      await addNewElementInstanceToDb({
        ...defaultElementInstance1,
        value: ['try to create over me'],
      });

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(elementInstanceCreateRequestMock)
        .expect(201);

      expect(resp.body).toHaveLength(1);
      expect(resp.body[0]).toHaveLength(2);
      expect(resp.body[0][0]).toEqual(
        expect.objectContaining(
          elementInstanceCreateRequestMock.elementInstances[0],
        ),
      );
      expect(resp.body[0][1]).toBe(true);
    });

    it('Fails to creates elementInstances when elementInstances have different userIds', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({
          ...elementInstanceCreateRequestMock,
          elementInstances: [
            ...elementInstanceCreateRequestMock.elementInstances,
            defaultElementInstance2,
          ],
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `all element instances shall have the same userId: ${elementInstanceCreateRequestMock.elementInstances[0].userId}`,
      });
    });

    it('Fails to creates elementInstances with element keys that do not exist', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({
          ...elementInstanceCreateRequestMock,
          elementInstances: [
            {
              ...elementInstanceCreateRequestMock.elementInstances[0],
              elementKey: 'this_element_does_not_exist',
            },
          ],
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error:
          'Invalid elementKey input: "this_element_does_not_exist" element does not exist',
      });
    });

    [
      {
        type: ElementType.CHECK,
        key: 'assetManagementMethod_investmentNature_risk-profile',
      },
      { type: ElementType.RADIO, key: 'investorType_investorType' },
    ].forEach((e) =>
      describe(`With element keys of type ${e.type}`, () => {
        it(`Fails to creates elementInstances if value is negative`, async () => {
          const value = ['-1'];
          const resp = await app
            .post(`${defaultUrl}?tenantId=${tenantId}`)
            .send({
              ...elementInstanceCreateRequestMock,
              elementInstances: [
                {
                  ...elementInstanceCreateRequestMock.elementInstances[0],
                  elementKey: e.key,
                  value,
                },
              ],
            })
            .expect(400);

          expect(resp.body).toEqual({
            status: 400,
            error: `Invalid 'value' input: ${prettify(
              value,
            )}. Since the associated element 'type' is '${
              e.type
            }', the elementInstance 'value' needs to contain an array of number(s), corresponding to the index(es) of the chosen response(s) in the element 'inputs' array`,
          });
        });

        it(`Fails to creates elementInstances if value is bigger than elements inputs length`, async () => {
          const value = ['3'];
          const resp = await app
            .post(`${defaultUrl}?tenantId=${tenantId}`)
            .send({
              ...elementInstanceCreateRequestMock,
              elementInstances: [
                {
                  ...elementInstanceCreateRequestMock.elementInstances[0],
                  elementKey: e.key,
                  value,
                },
              ],
            })
            .expect(400);

          expect(resp.body).toEqual({
            status: 400,
            error: `Invalid 'value' input: ${prettify(
              value,
            )}. Since the associated element 'type' is '${
              e.type
            }', the elementInstance 'value' needs to contain an array of number(s), corresponding to the index(es) of the chosen response(s) in the element 'inputs' array`,
          });
        });
      }),
    );

    it(`Fails to creates elementInstances if element key is type radio has more than one value`, async () => {
      const value = ['1', '0'];
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({
          ...elementInstanceCreateRequestMock,
          elementInstances: [
            {
              ...elementInstanceCreateRequestMock.elementInstances[0],
              elementKey: 'investorType_investorType',
              value,
            },
          ],
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Invalid 'value' input: ${prettify(
          value,
        )}. Since the associated element 'type' is 'radio', the elementInstance 'value' needs to contain an array of number(s), corresponding to the index(es) of the chosen response(s) in the element 'inputs' array`,
      });
    });
  });

  describe('PUT /elementInstances/:id', () => {
    let elementInstance1Id;

    beforeEach(async () => {
      await removeFromDb(elementInstanceModel, tenantId);
      const [elementInstance1] = await addNewElementInstanceToDb(
        defaultElementInstance1,
      );

      elementInstance1Id = elementInstance1.id;
    });

    afterAll(async () => {
      await removeFromDb(elementInstanceModel, tenantId);
    });

    it('Successufully updates elementInstances', async () => {
      const resp = await app
        .put(`${defaultUrl}/${elementInstance1Id}?tenantId=${tenantId}`)
        .send(defaultElementInstance2)
        .expect(200);

      expect(resp.body).toEqual(
        expect.objectContaining(defaultElementInstance2),
      );
    });

    it('Fails to update elementInstances that does not exist', async () => {
      const fakeId = uuidv4();
      const resp = await app
        .put(`${defaultUrl}/${fakeId}?tenantId=${tenantId}`)
        .send(defaultElementInstance2)
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the elementInstance with id=${fakeId}`,
      });
    });

    it('Fails to update elementInstances with element keys that do not exist', async () => {
      const resp = await app
        .put(`${defaultUrl}/${elementInstance1Id}?tenantId=${tenantId}`)
        .send({
          ...defaultElementInstance2,
          elementKey: 'this_element_does_not_exist',
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error:
          'Invalid elementKey input: "this_element_does_not_exist" element does not exist',
      });
    });

    [
      {
        type: ElementType.CHECK,
        key: 'assetManagementMethod_investmentNature_risk-profile',
      },
      { type: ElementType.RADIO, key: 'investorType_investorType' },
    ].forEach((e) =>
      describe(`With element keys of type ${e.type}`, () => {
        it(`Fails to update elementInstances if value is negative`, async () => {
          const value = ['-1'];
          const resp = await app
            .put(`${defaultUrl}/${elementInstance1Id}?tenantId=${tenantId}`)
            .send({ ...defaultElementInstance2, elementKey: e.key, value })
            .expect(400);

          expect(resp.body).toEqual({
            status: 400,
            error: `Invalid 'value' input: ${prettify(
              value,
            )}. Since the associated element is of type '${
              e.type
            }', the element 'value' needs to contain an array of number(s), corresponding to the index(es) of the chosen response(s) in the element 'inputs' array`,
          });
        });

        it(`Fails to update elementInstances if value is bigger than elements inputs length`, async () => {
          const value = ['3'];
          const resp = await app
            .put(`${defaultUrl}/${elementInstance1Id}?tenantId=${tenantId}`)
            .send({ ...defaultElementInstance2, elementKey: e.key, value })
            .expect(400);

          expect(resp.body).toEqual({
            status: 400,
            error: `Invalid 'value' input: ${prettify(
              value,
            )}. Since the associated element is of type '${
              e.type
            }', the element 'value' needs to contain an array of number(s), corresponding to the index(es) of the chosen response(s) in the element 'inputs' array`,
          });
        });
      }),
    );

    it(`Fails to update elementInstances if element key is type radio has more than one value`, async () => {
      const value = ['1', '0'];
      const resp = await app
        .put(`${defaultUrl}/${elementInstance1Id}?tenantId=${tenantId}`)
        .send({
          ...defaultElementInstance2,
          elementKey: 'investorType_investorType',
          value,
        })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Invalid 'value' input: ${prettify(
          value,
        )}. Since the associated element is of type 'radio', the element 'value' needs to contain an array of number(s), corresponding to the index(es) of the chosen response(s) in the element 'inputs' array`,
      });
    });
  });

  describe('DELETE /elementInstances/:id', () => {
    let elementInstance1Id;

    beforeEach(async () => {
      await removeFromDb(elementInstanceModel, tenantId);
      const [elementInstance1] = await addNewElementInstanceToDb(
        defaultElementInstance1,
      );

      elementInstance1Id = elementInstance1.id;
    });

    afterAll(async () => {
      await removeFromDb(elementInstanceModel, tenantId);
    });

    it('Successufully deletes elementInstances', async () => {
      const resp = await app
        .delete(`${defaultUrl}/${elementInstance1Id}?tenantId=${tenantId}`)
        .expect(200);

      expect(resp.body).toEqual({ message: '1 deleted elementInstance(s).' });
    });

    it('Fails to delete elementInstances that does not exist', async () => {
      const fakeId = uuidv4();
      const resp = await app
        .delete(`${defaultUrl}/${fakeId}?tenantId=${tenantId}`)
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the elementInstance with id=${fakeId}`,
      });
    });
  });
});
