import { TestingModule } from '@nestjs/testing';
import { ElementModel } from 'src/modules/ElementModule/ElementModel';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { getServer } from 'test/testServer';
import { initialSeedElements } from 'src/db/init/index';
import {
  elementCreateRequestMock,
  elementUpdateRequestMock,
} from 'test/mocks/ElementMocks';
import { addElementToDb, removeFromDb } from 'test/dbHelpers';

describe('elements', () => {
  const defaultUrl = '/elements';
  const tenantId = 'fakeTenantId';
  let app: request.SuperTest<request.Test>;
  let module: TestingModule;
  let elementModel: typeof ElementModel;

  beforeAll(async () => {
    const { superTestApp, moduleRef } = getServer();
    app = superTestApp;
    module = moduleRef;

    elementModel = module.get('ElementModelRepository');
  });

  describe('GET /elements', () => {
    it('Returns all elements', async () => {
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}`)
        .expect(200);

      resp.body.forEach((element) => {
        const seedElement = initialSeedElements.find(
          (e) => element.key === e.key,
        );

        expect(element).toEqual(expect.objectContaining(seedElement));
      });
    });

    it('Returns element filtered by key', async () => {
      const initialKey = initialSeedElements[0].key;
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&key=${initialKey}`)
        .expect(200);

      expect(resp.body[0]).toEqual(
        expect.objectContaining(initialSeedElements[0]),
      );
    });

    it('Returns element filtered by id', async () => {
      const initialKey = initialSeedElements[0].key;
      const element = await elementModel.findOne({
        where: { key: initialKey },
      });
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&elementId=${element.id}`)
        .expect(200);

      expect(resp.body[0]).toEqual(
        expect.objectContaining(initialSeedElements[0]),
      );
    });

    it('Fails to returns elements when tenantId is not sent', async () => {
      const resp = await app.get(`${defaultUrl}`).expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"tenantId" is required'],
        message: 'Validation error',
      });
    });
  });

  describe('POST /elements', () => {
    beforeEach(async () => {
      await removeFromDb(elementModel, tenantId);
    });

    afterAll(async () => {
      await removeFromDb(elementModel, tenantId);
    });

    it('Creates an element', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send([elementCreateRequestMock])
        .expect(201);

      expect(resp.body[0]).toHaveLength(2);
      expect(resp.body[0][0]).toEqual(
        expect.objectContaining(elementCreateRequestMock),
      );
      expect(resp.body[0][1]).toBe(true);
    });

    it('Fails to create element when tenantId is not sent', async () => {
      const resp = await app
        .post(`${defaultUrl}`)
        .send([elementCreateRequestMock])
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"tenantId" is required'],
        message: 'Validation error',
      });
    });

    it('Fails to create element when element does not have key', async () => {
      const { key, ...elementRequestWithoutKey } = elementCreateRequestMock;

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send([elementRequestWithoutKey])
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"[0].key" is required'],
        message: 'Validation error',
      });
    });

    it('Fails to create element when element does not have type', async () => {
      const { type, ...elementRequestWithoutType } = elementCreateRequestMock;

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send([elementRequestWithoutType])
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"[0].type" is required'],
        message: 'Validation error',
      });
    });

    it('Fails to create element when element type is not valid', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send([
          {
            ...elementCreateRequestMock,
            type: 'fakeType',
          },
        ])
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: [
          '"[0].type" must be one of [string, number, check, radio, document, multistring, date, title]',
        ],
        message: 'Validation error',
      });
    });

    it('Fails to create element when element does not have status', async () => {
      const { status, ...elementRequestWithoutStatus } =
        elementCreateRequestMock;

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send([elementRequestWithoutStatus])
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"[0].status" is required'],
        message: 'Validation error',
      });
    });

    it('Fails to create element when element status is not valid', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send([
          {
            ...elementCreateRequestMock,
            status: 'fakeStatus',
          },
        ])
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: [
          '"[0].status" must be one of [mandatory, optional, conditional]',
        ],
        message: 'Validation error',
      });
    });

    it('Fails to create element when element does not have label', async () => {
      const { label, ...elementRequestWithoutLabel } = elementCreateRequestMock;

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send([elementRequestWithoutLabel])
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"[0].label" is required'],
        message: 'Validation error',
      });
    });

    it('Fails to create element when element has inputs for a type that should not have inputs', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send([
          {
            ...elementCreateRequestMock,
            type: 'document',
          },
        ])
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"[0].inputs" is not allowed'],
        message: 'Validation error',
      });
    });
  });

  describe('PUT /elements/:id', () => {
    let elementId: string;

    beforeEach(async () => {
      await removeFromDb(elementModel, tenantId);
      const [elementCreated] = await addElementToDb(elementModel, {
        ...elementCreateRequestMock,
        tenantId,
      });

      elementId = elementCreated.id;
    });

    afterAll(async () => {
      await removeFromDb(elementModel, tenantId);
    });

    it('Updates an element by id', async () => {
      const resp = await app
        .put(`${defaultUrl}/${elementId}?tenantId=${tenantId}`)
        .send(elementUpdateRequestMock)
        .expect(200);

      expect(resp.body).toEqual(
        expect.objectContaining(elementUpdateRequestMock),
      );
    });

    it('Fails to update element that does not exist', async () => {
      const anotherElementId = uuidv4();

      const resp = await app
        .put(`${defaultUrl}/${anotherElementId}?tenantId=${tenantId}`)
        .send(elementUpdateRequestMock)
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the element with id=${anotherElementId}`,
      });
    });

    it('Fails to update element if already exists an element with the same key as the new key being sent', async () => {
      const key = initialSeedElements[0].key;

      const resp = await app
        .put(`${defaultUrl}/${elementId}?tenantId=${tenantId}`)
        .send({ ...elementUpdateRequestMock, key })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Another element already exists with key=${key}`,
      });
    });

    it('Fails to update element when tenantId is not sent', async () => {
      const resp = await app
        .put(`${defaultUrl}/${elementId}`)
        .send(elementUpdateRequestMock)
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"tenantId" is required'],
        message: 'Validation error',
      });
    });

    it('Fails to update element when element does not have key', async () => {
      const { key, ...elementRequestWithoutKey } = elementUpdateRequestMock;

      const resp = await app
        .put(`${defaultUrl}/${elementId}?tenantId=${tenantId}`)
        .send(elementRequestWithoutKey)
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"key" is required'],
        message: 'Validation error',
      });
    });

    it('Fails to update element when element does not have type', async () => {
      const { type, ...elementRequestWithoutType } = elementUpdateRequestMock;

      const resp = await app
        .put(`${defaultUrl}/${elementId}?tenantId=${tenantId}`)
        .send(elementRequestWithoutType)
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"type" is required'],
        message: 'Validation error',
      });
    });

    it('Fails to update element when element type is not valid', async () => {
      const resp = await app
        .put(`${defaultUrl}/${elementId}?tenantId=${tenantId}`)
        .send({
          ...elementUpdateRequestMock,
          type: 'fakeType',
        })
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: [
          '"type" must be one of [string, number, check, radio, document, multistring, date, title]',
        ],
        message: 'Validation error',
      });
    });

    it('Fails to update element when element does not have status', async () => {
      const { status, ...elementRequestWithoutStatus } =
        elementUpdateRequestMock;

      const resp = await app
        .put(`${defaultUrl}/${elementId}?tenantId=${tenantId}`)
        .send(elementRequestWithoutStatus)
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"status" is required'],
        message: 'Validation error',
      });
    });

    it('Fails to update element when element status is not valid', async () => {
      const resp = await app
        .put(`${defaultUrl}/${elementId}?tenantId=${tenantId}`)
        .send({
          ...elementUpdateRequestMock,
          status: 'fakeStatus',
        })
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"status" must be one of [mandatory, optional, conditional]'],
        message: 'Validation error',
      });
    });

    it('Fails to update element when element does not have label', async () => {
      const { label, ...elementRequestWithoutLabel } = elementUpdateRequestMock;

      const resp = await app
        .put(`${defaultUrl}/${elementId}?tenantId=${tenantId}`)
        .send(elementRequestWithoutLabel)
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"label" is required'],
        message: 'Validation error',
      });
    });

    it('Fails to create element when element has inputs for a type that should not have inputs', async () => {
      const resp = await app
        .put(`${defaultUrl}/${elementId}?tenantId=${tenantId}`)
        .send({
          ...elementUpdateRequestMock,
          type: 'document',
        })
        .expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"inputs" is not allowed'],
        message: 'Validation error',
      });
    });
  });

  describe('DELETE /elements/:id', () => {
    let elementId: string;

    beforeEach(async () => {
      await removeFromDb(elementModel, tenantId);
      const [elementCreated] = await addElementToDb(elementModel, {
        ...elementCreateRequestMock,
        tenantId,
      });

      elementId = elementCreated.id;
    });

    afterAll(async () => {
      await removeFromDb(elementModel, tenantId);
    });

    it('Deletes an element by id', async () => {
      const resp = await app
        .delete(`${defaultUrl}/${elementId}?tenantId=${tenantId}`)
        .expect(200);

      expect(resp.body).toEqual({
        message: '1 deleted element(s).',
      });
    });

    it('Fails to update element that does not exist', async () => {
      const anotherElementId = uuidv4();

      const resp = await app
        .delete(`${defaultUrl}/${anotherElementId}?tenantId=${tenantId}`)
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the element with id=${anotherElementId}`,
      });
    });

    it('Fails to delete element when tenantId is not sent', async () => {
      const resp = await app.delete(`${defaultUrl}/${elementId}`).expect(422);

      expect(resp.body).toEqual({
        statusCode: 422,
        error: ['"tenantId" is required'],
        message: 'Validation error',
      });
    });
  });
});
