import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getServer } from '../testServer';
import { AssetUsecaseEntity } from 'src/model/AssetUsecaseEntity';
import { getMockedUseCase } from 'tests/mocks/UseCaseMocks';
import { v4 as uuidv4 } from 'uuid';

describe('Usecase routes', () => {
  jest.setTimeout(20000);

  let app: request.SuperTest<request.Test>;
  let moduleRef: TestingModule;
  const defaultUrl = '/usecases';
  const tenantId = 'fakeTenantId';
  let useCaseRepository: Repository<AssetUsecaseEntity>;
  const useCaseName = 'fakeUseCaseName';
  const useCase = getMockedUseCase(tenantId, useCaseName);
  beforeAll(async () => {
    const { superTestApp, moduleRef: module } = getServer();
    moduleRef = module;
    app = superTestApp;
    useCaseRepository = moduleRef.get('AssetUsecaseEntityRepository');
  });
  afterAll(async () => {
    await useCaseRepository.delete({ name: useCaseName });
  });

  describe('POST /usecase', () => {
    afterAll(async () => {
      await useCaseRepository.delete({ name: useCaseName });
    });
    it('create usecase', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(useCase)
        .expect(201);
      expect(body).toEqual({ message: '1 new usecase created.' });
    });

    it('create usecase with same tenant and name', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(useCase)
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'usecase already exists, please try usecase update instead',
      });
    });
  });

  describe('GET /usecase', () => {
    beforeAll(async () => {
      await useCaseRepository.save({ ...useCase, tenantId, id: uuidv4() });
    });
    afterAll(async () => {
      await useCaseRepository.delete({ name: useCaseName });
    });

    it('get usecase by name', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&usecase=${useCase.name}`)
        .expect(200);

      expect(body).toEqual(expect.objectContaining(useCase));
    });

    it('get all usecases', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}`)
        .expect(200);

      expect(body.length).toBeGreaterThan(1);
    });
  });

  describe('PUT /usecase', () => {
    beforeAll(async () => {
      await useCaseRepository.save({ ...useCase, tenantId, id: uuidv4() });
    });
    afterAll(async () => {
      await useCaseRepository.delete({ name: useCaseName });
    });

    it('update usecase', async () => {
      const { body } = await app
        .put(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...useCase, key: {} })
        .expect(200);

      expect(body).toEqual({ message: '1 new usecase updated.' });
    });

    it('update with wrong name', async () => {
      const { body } = await app
        .put(`${defaultUrl}?tenantId=${tenantId}`)
        .send({ ...useCase, name: 'updated usecase' })
        .expect(400);

      expect(body).toEqual({ status: 400, error: 'usecase not found' });
    });
  });

  describe('DELETE /usecase', () => {
    beforeAll(async () => {
      await useCaseRepository.save({ ...useCase, tenantId, id: uuidv4() });
    });
    it('delete usecase', async () => {
      const { body } = await app
        .delete(`${defaultUrl}?tenantId=${tenantId}?usecase=${useCase.name}`)
        .expect(200);

      expect(body).toEqual({ message: '1 usecase deleted.' });
    });
  });
});
