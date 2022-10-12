import { TestingModule } from '@nestjs/testing';
import { AssetElement } from 'src/model/AssetElementEntity';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getServer } from '../testServer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

describe('Asset Elements routes', () => {
  jest.setTimeout(20000);

  let app: request.SuperTest<request.Test>;
  let moduleRef: TestingModule;
  const defaultUrl = '/assetElements';
  const tenantId = 'fakeTenantId';
  const initialElements: AssetElement[] = [];
  let assetElementRepository: Repository<AssetElement>;

  const testElement = {
    key: 'test_element',
    map: 'asset_general_test',
    type: 'string',
    status: 'mandatory',
    label: {
      en: 'Name',
      fr: 'Nom',
    },
    size: 3,
    maxLength: 25,
    updatable: false,
    hidden: false,
  };

  beforeAll(async () => {
    const elementFiles = fs.readdirSync(
      path.resolve(__dirname, '../../src/configurations/assets/elements'),
    );
    elementFiles.forEach((elementFile) => {
      const template = fs.readFileSync(
        path.resolve(
          __dirname,
          '../../src/configurations/assets/elements/',
          elementFile,
        ),
        'utf-8',
      );
      initialElements.push(...(JSON.parse(template) as AssetElement[]));
    });
  });

  beforeAll(async () => {
    const { superTestApp, moduleRef: module } = getServer();
    moduleRef = module;
    app = superTestApp;
    assetElementRepository = moduleRef.get('AssetElementRepository');
  });

  describe('POST /assetElements', () => {
    it('Create element', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(testElement)
        .expect(201);
      expect(resp.body).toEqual(expect.objectContaining(testElement));
      await assetElementRepository.delete({ id: resp.body.id });
    });

    it('Cannot create element with existing key', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(testElement)
        .expect(201);
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(testElement)
        .expect(400);
      expect(resp.body.error).toEqual(
        `Element with key: ${testElement.key} already exists, please choose another key`,
      );
      await assetElementRepository.delete({ id: body.id });
    });

    it('Require tenantId', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=`)
        .send(testElement)
        .expect(400);
      expect(body.error).toEqual('tenantId can not be undefined');
    });
  });

  describe('GET /assetElements', () => {
    let savedElement: AssetElement;
    beforeAll(async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(testElement)
        .expect(201);
      savedElement = body;
    });

    afterAll(async () => {
      await assetElementRepository.delete({ id: savedElement.id });
    });
    it('Get element by id', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&id=${savedElement.id}`)
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual(expect.objectContaining(savedElement));
    });
    it('Get element by wrong id', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&id=${uuidv4()}`)
        .expect(200);
      expect(body).toHaveLength(0);
    });
    it('Get element by key', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&key=${savedElement.key}`)
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual(expect.objectContaining(savedElement));
    });
    it('Get all elements', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}`)
        .expect(200);
      expect(body).toHaveLength(initialElements.length + 1);
    });
  });

  describe('PUT /assetElements', () => {
    let savedElement: AssetElement;
    beforeAll(async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(testElement)
        .expect(201);
      savedElement = body;
    });
    afterAll(async () => {
      await assetElementRepository.delete({ id: savedElement.id });
    });
    it('Update element', async () => {
      await app
        .put(`${defaultUrl}/${savedElement.id}?tenantId=${tenantId}`)
        .send({ ...savedElement, key: 'test_update_element' })
        .expect(200);

      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&id=${savedElement.id}`)
        .expect(200);
      expect(body[0].key).toEqual('test_update_element');
    });
    it('Update key to already existing one', async () => {
      const { body } = await app
        .put(`${defaultUrl}/${savedElement.id}?tenantId=${tenantId}`)
        .send({ ...savedElement, key: initialElements[0].key })
        .expect(400);
      expect(body.error).toEqual(
        `Element with key: ${initialElements[0].key} already exists, please choose another key`,
      );
    });
    it('Update with wrong tenant', async () => {
      const { body } = await app
        .put(`${defaultUrl}/${savedElement.id}?tenantId=wrongTenant`)
        .send({ ...savedElement, key: 'test_update_element' })
        .expect(400);
      expect(body.error).toEqual(
        `invalid tenantId (wrongTenant <> ${savedElement.tenantId})`,
      );
    });
  });

  describe('DELETE /assetElements', () => {
    it('delete element', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(testElement)
        .expect(201);

      const { body: deleteBody } = await app
        .delete(`${defaultUrl}/${body.id}?tenantId=${tenantId}`)
        .expect(200);
      expect(deleteBody.message).toEqual('1 deleted assetElement(s).');
    });
    it('delete element with unexisting id', async () => {
      const id = uuidv4();
      const { body } = await app
        .delete(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .expect(404);
      expect(body.error).toEqual(
        `Unable to find the assetElement with id=${id}`,
      );
    });
  });
});
