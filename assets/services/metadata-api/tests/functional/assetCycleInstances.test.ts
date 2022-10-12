import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getServer } from '../testServer';
import { v4 as uuidv4 } from 'uuid';
import { AssetTemplate } from 'src/model/AssetTemplateEntity';
import { Token } from 'src/model/TokenEntity';
import { AssetInstancesDto } from 'src/model/dto/AssetInstancesDto';
import { AssetInstance } from 'src/model/AssetInstanceEntity';
import { elementInstances } from 'tests/mocks/AssetInstanceMocks';
import { mockToken } from 'tests/mocks/TokensMocks';
import { AssetCycleInstance } from 'src/model/AssetCycleInstanceEntity';
import { getCycle } from 'tests/mocks/AssetCycleInstanceMocks';
import { AssetCycleInstanceDto } from 'src/model/dto/AssetCycleInstancesDto';
import { CycleStatus } from 'src/utils/constants';

describe('Asset cycle instances routes', () => {
  jest.setTimeout(20000);

  let app: request.SuperTest<request.Test>;
  let moduleRef: TestingModule;
  const defaultUrl = '/cycles';
  const tenantId = 'fakeTenantId';
  let assetTemplateRepository: Repository<AssetTemplate>;
  let assetTemplateId: string;
  let tokenRepository: Repository<Token>;
  let assetInstanceRepository: Repository<AssetInstance>;
  const defaultToken = mockToken(tenantId, uuidv4());
  let assetInstance: AssetInstancesDto;
  let assetCycleInstanceRepository: Repository<AssetCycleInstance>;
  let defaultCycle: AssetCycleInstanceDto;

  beforeAll(async () => {
    const { superTestApp, moduleRef: module } = getServer();
    moduleRef = module;
    app = superTestApp;
    assetTemplateRepository = moduleRef.get('AssetTemplateRepository');
    assetInstanceRepository = moduleRef.get('AssetInstanceRepository');
    assetCycleInstanceRepository = moduleRef.get(
      'AssetCycleInstanceRepository',
    );
    const currencyTemplate = await assetTemplateRepository.findOne({
      where: {
        name: 'CURRENCY',
      },
    });
    if (!currencyTemplate) {
      throw new Error('SOMETHING IS WRONG WITH THE TESTS');
    }
    assetTemplateId = currencyTemplate.id;

    tokenRepository = moduleRef.get('TokenRepository');
    assetInstance = {
      tokenId: defaultToken.id,
      templateId: assetTemplateId,
      issuerId: uuidv4(),
      elementInstances,
      tenantId,
      data: {},
    };
    await tokenRepository.save({
      ...defaultToken,
      assetTemplateId,
    });
    const instanceId = uuidv4();
    await assetInstanceRepository.save({
      ...assetInstance,
      id: instanceId,
    });
    defaultCycle = getCycle(instanceId, tenantId);
  });

  afterAll(async () => {
    await assetInstanceRepository.delete({});
    await tokenRepository.delete({});
    await assetCycleInstanceRepository.delete({});
  });

  describe('POST /cycles', () => {
    afterEach(async () => {
      await assetCycleInstanceRepository.delete({});
    });
    it('create asset cycle instance', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(defaultCycle)
        .expect(201);
      expect(body.assetInstanceId).toEqual(defaultCycle.assetInstanceId);
    });
    it('cycles with same dates', async () => {
      await assetCycleInstanceRepository.save({
        ...defaultCycle,
        id: uuidv4(),
      });
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(defaultCycle)
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'Invalid Cycle inputs: cycle with same dates already exists',
      });
    });
  });

  describe('GET /cycles', () => {
    const id = uuidv4();
    beforeAll(async () => {
      await assetCycleInstanceRepository.save({
        ...defaultCycle,
        id,
      });
    });
    afterAll(async () => {
      await assetCycleInstanceRepository.delete({});
    });
    it('get by id', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&cycleId=${id}`)
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toEqual(id);
    });

    it('get by assetInstanceId & assetInstanceClassKey & type)', async () => {
      const { body } = await app
        .get(
          `${defaultUrl}?tenantId=${tenantId}&assetInstanceId=${defaultCycle.assetInstanceId}&assetInstanceClassKey=${defaultCycle.assetInstanceClassKey}&type=${defaultCycle.type}`,
        )
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toEqual(id);
    });

    it('get by assetInstanceId & assetInstanceClassKey)', async () => {
      const { body } = await app
        .get(
          `${defaultUrl}?tenantId=${tenantId}&assetInstanceId=${defaultCycle.assetInstanceId}&assetInstanceClassKey=${defaultCycle.assetInstanceClassKey}}`,
        )
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toEqual(id);
    });
    it('get by assetInstanceId & type)', async () => {
      const { body } = await app
        .get(
          `${defaultUrl}?tenantId=${tenantId}&assetInstanceId=${defaultCycle.assetInstanceId}&type=${defaultCycle.type}}`,
        )
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toEqual(id);
    });
    it('get by assetInstanceId)', async () => {
      const { body } = await app
        .get(
          `${defaultUrl}?tenantId=${tenantId}&assetInstanceId=${defaultCycle.assetInstanceId}}`,
        )
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toEqual(id);
    });
    it('get all)', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}`)
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toEqual(id);
    });
  });

  describe('PUT /cycles', () => {
    const id = uuidv4();
    beforeAll(async () => {
      await assetCycleInstanceRepository.save({
        ...defaultCycle,
        id,
      });
    });
    afterAll(async () => {
      await assetCycleInstanceRepository.delete({});
    });

    it('update cycle', async () => {
      const { body } = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send({ ...defaultCycle, status: CycleStatus.CLOSED })
        .expect(200);
      expect(body.status).toEqual(CycleStatus.CLOSED);
    });
    it('update cycle with wrong id', async () => {
      const wrongId = uuidv4();
      const { body } = await app
        .put(`${defaultUrl}/${wrongId}?tenantId=${tenantId}`)
        .send({ ...defaultCycle, status: CycleStatus.CLOSED })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: `Unable to find the assetCycleInstance with id=${wrongId}`,
      });
    });
  });

  describe('DELETE /cycles', () => {
    const id = uuidv4();
    beforeAll(async () => {
      await assetCycleInstanceRepository.save({
        ...defaultCycle,
        id,
      });
    });

    it('delete cycle', async () => {
      const { body } = await app
        .delete(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .expect(200);
      expect(body).toEqual({ message: '1 deleted assetCycleInstance(s).' });
    });
    it('delete cycle with wrong id', async () => {
      const wrongId = uuidv4();
      const { body } = await app
        .delete(`${defaultUrl}/${wrongId}?tenantId=${tenantId}`)
        .expect(404);
      expect(body).toEqual({
        status: 404,
        error: `Unable to find the assetCycleInstance with id=${wrongId}`,
      });
    });
  });
});
