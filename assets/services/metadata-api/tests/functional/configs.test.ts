import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getServer } from '../testServer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Configs } from 'src/model/ConfigEntity';
import { InitConfigsDto } from 'src/model/dto/ConfigsDto';
import { mockedConfig } from 'tests/mocks/ConfigsMocks';

describe('Configs routes', () => {
  jest.setTimeout(20000);

  let app: request.SuperTest<request.Test>;
  let moduleRef: TestingModule;
  const defaultUrl = '/configs';
  const tenantId = 'fakeTenantId';
  let configsRepository: Repository<Configs>;
  const userId = 'fakeUserId';
  let initConfigs: InitConfigsDto[] = [];

  beforeAll(async () => {
    const { superTestApp, moduleRef: module } = getServer();
    moduleRef = module;
    app = superTestApp;
    configsRepository = moduleRef.get('ConfigsRepository');
    const files = fs.readdirSync(
      path.resolve(__dirname, '../../src/configurations/configs'),
    );
    for (const file of files)
      try {
        const parsedConfigs: InitConfigsDto = JSON.parse(
          fs.readFileSync(
            path.resolve(__dirname, '../../src/configurations/configs/', file),
            'utf8',
          ),
        );
        initConfigs = [...initConfigs, parsedConfigs];
      } catch (e) {
        console.log(e);
        throw new Error('SOMETHING WENT WRONG WHILE PARSING CONFIGS');
      }
  });

  describe('POST /configs', () => {
    afterAll(async () => {
      await configsRepository.delete({ tenantId, userId });
    });

    it('create config', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}&userId=${userId}`)
        .send(mockedConfig)
        .expect(201);
      expect(body).toEqual(expect.objectContaining(mockedConfig));
    });

    it('create config without tenantId', async () => {
      const { body } = await app
        .post(`${defaultUrl}?userId=${userId}`)
        .send(mockedConfig)
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'tenantId can not be undefined',
      });
    });

    it('create config with existing tenantId and userId', async () => {
      await configsRepository.save({
        ...mockedConfig,
        id: uuidv4(),
        tenantId,
        userId,
      });
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}&userId=${userId}`)
        .send(mockedConfig)
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: `Config with tenantId ${tenantId} and userId ${userId} already exists`,
      });
    });
  });

  describe('GET /configs', () => {
    const configId = uuidv4();
    beforeAll(async () => {
      await configsRepository.save({
        ...mockedConfig,
        id: configId,
        tenantId,
        userId,
      });
    });

    afterAll(async () => {
      await configsRepository.delete({ tenantId, userId });
    });

    it('get config by tenantId and userId', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&userId=${userId}`)
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual(
        expect.objectContaining({
          ...mockedConfig,
          id: configId,
          tenantId,
          userId,
        }),
      );
    });

    it('get all configs', async () => {
      const { body } = await app.get(`${defaultUrl}`).expect(200);
      expect(body).toHaveLength(initConfigs.length + 1);
    });
  });

  describe('PUT /configs', () => {
    beforeAll(async () => {
      await configsRepository.save({
        ...mockedConfig,
        id: uuidv4(),
        tenantId,
        userId,
      });
    });

    afterAll(async () => {
      await configsRepository.delete({ tenantId, userId });
    });

    it('update config', async () => {
      const { body } = await app
        .put(`${defaultUrl}?tenantId=${tenantId}&userId=${userId}`)
        .send({ ...mockedConfig, name: 'updated config' })
        .expect(200);
      expect(body).toEqual(
        expect.objectContaining({ ...mockedConfig, name: 'updated config' }),
      );
    });

    it('update config without tenantId', async () => {
      const { body } = await app
        .put(`${defaultUrl}?&userId=${userId}`)
        .send({ ...mockedConfig, name: 'updated config' })
        .expect(400);
      expect(body).toEqual({
        error: 'tenantId can not be undefined',
        status: 400,
      });
    });

    it('update config with wrong tenantId', async () => {
      const { body } = await app
        .put(`${defaultUrl}?tenantId=wrongTenantId&userId=${userId}`)
        .send({ ...mockedConfig, name: 'updated config' })
        .expect(400);
      expect(body).toEqual({
        error: 'no config found for tenantId wrongTenantId',
        status: 400,
      });
    });
  });
  describe('DELETE /configs', () => {
    it('delete config', async () => {
      await configsRepository.save({
        ...mockedConfig,
        id: uuidv4(),
        tenantId,
        userId,
      });
      const { body } = await app
        .delete(`${defaultUrl}?tenantId=${tenantId}&userId=${userId}`)
        .expect(200);
      expect(body).toEqual({ message: '1 deleted config(s).' });
    });
    it('delete config with unexisting tenantId', async () => {
      const { body } = await app
        .delete(`${defaultUrl}?tenantId=${tenantId}&userId=${userId}`)
        .expect(400);
      expect(body).toEqual({
        error: 'no config found for tenantId fakeTenantId',
        status: 400,
      });
    });
  });
});
