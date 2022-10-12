import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getServer } from '../testServer';
import { v4 as uuidv4 } from 'uuid';
import { Mail, MailVariables } from 'src/model/MailEntity';
import { getMockMail } from 'tests/mocks/MailsMocks';
import { DEFAULT_TENANT_ID } from 'src/utils/constants';
import path from 'path';
import fs from 'fs';
import { InitMailsDto } from 'src/model/dto/MailDto';

describe('Mails routes', () => {
  jest.setTimeout(20000);

  let app: request.SuperTest<request.Test>;
  let moduleRef: TestingModule;
  const defaultUrl = '/mails';
  const tenantId = 'fakeTenantId';
  let mailsRepository: Repository<Mail>;
  let mailVariablesRepository: Repository<MailVariables>;
  const mail = getMockMail(tenantId);
  let variables: MailVariables;
  let initialMails: InitMailsDto[] = [];
  beforeAll(async () => {
    const { superTestApp, moduleRef: module } = getServer();
    moduleRef = module;
    app = superTestApp;
    mailsRepository = moduleRef.get('MailRepository');
    mailVariablesRepository = moduleRef.get('MailVariablesRepository');
    variables = await mailVariablesRepository.save({
      key: mail.key,
      variables: [],
    });
    const files = fs.readdirSync(
      path.resolve(__dirname, '../../src/configurations/mails'),
    );
    for (const file of files)
      try {
        const parsedMails: InitMailsDto[] = JSON.parse(
          fs.readFileSync(
            path.resolve(__dirname, '../../src/configurations/mails/', file),
            'utf8',
          ),
        );
        initialMails = [...initialMails, ...parsedMails];
      } catch (e) {
        console.log(e);
        throw new Error('SOMETHING WENT WRONG WHILE PARSING MAILS');
      }
  });

  describe('POST /mails', () => {
    afterAll(async () => {
      await mailsRepository.delete({ key: mail.key });
    });
    it('create mail', async () => {
      const { body } = await app.post(`${defaultUrl}`).send(mail).expect(201);
      expect(body).toEqual(expect.objectContaining(mail));
    });
    it('create mail with existing key', async () => {
      const { body } = await app.post(`${defaultUrl}`).send(mail).expect(400);
      expect(body).toEqual({
        status: 400,
        error: `Mail with tenantId=${mail.tenantId} and key=${mail.key} already exists`,
      });
    });
    it('create mail without tenantId', async () => {
      const { body } = await app
        .post(`${defaultUrl}`)
        .send({ ...mail, tenantId: null })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'tenantId cannot be undefined',
      });
    });
    it('create mail with default tenantId', async () => {
      const { body } = await app
        .post(`${defaultUrl}`)
        .send({ ...mail, tenantId: DEFAULT_TENANT_ID })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'default mails cannot be created using the API',
      });
    });
    it('create mail without key', async () => {
      const { body } = await app
        .post(`${defaultUrl}`)
        .send({ ...mail, key: null })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'key cannot be undefined',
      });
    });
    it('create mail with invalid key', async () => {
      const { body } = await app
        .post(`${defaultUrl}`)
        .send({ ...mail, key: 'invalidKey' })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'invalid key invalidKey',
      });
    });
  });

  describe('GET /mails', () => {
    beforeAll(async () => {
      await mailsRepository.save({ ...mail, variables, id: uuidv4() });
    });
    afterAll(async () => {
      await mailsRepository.delete({ key: mail.key });
    });
    it('get mail by key', async () => {
      const { body } = await app
        .get(`${defaultUrl}?key=${mail.key}&tenantId=${mail.tenantId}`)
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0].key).toEqual(mail.key);
    });

    it('get all mails', async () => {
      const { body } = await app
        .get(`${defaultUrl}?}&tenantId=${mail.tenantId}`)
        .expect(200);
      expect(body).toHaveLength(initialMails.length + 1);
    });
  });

  describe('PUT /mails', () => {
    beforeAll(async () => {
      await mailsRepository.save({ ...mail, variables, id: uuidv4() });
    });
    afterAll(async () => {
      await mailsRepository.delete({ key: mail.key });
    });
    it('Update mail with key', async () => {
      const { body } = await app
        .put(`${defaultUrl}`)
        .send({ ...mail, message: 'update message' })
        .expect(200);
      expect(body).toEqual(
        expect.objectContaining({ ...mail, message: 'update message' }),
      );
    });

    it('Update mail without tenantId', async () => {
      const { body } = await app
        .put(`${defaultUrl}`)
        .send({ ...mail, tenantId: null })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'tenantId cannot be undefined',
      });
    });
    it('Update mail with default tenant', async () => {
      const { body } = await app
        .put(`${defaultUrl}`)
        .send({ ...mail, tenantId: DEFAULT_TENANT_ID })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'default mails cannot be updated using the API',
      });
    });
    it('Update mail without key', async () => {
      const { body } = await app
        .put(`${defaultUrl}`)
        .send({ ...mail, key: null })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'key cannot be undefined',
      });
    });
    it('Update mail with wrong key', async () => {
      const wrongKey = uuidv4();
      const { body } = await app
        .put(`${defaultUrl}`)
        .send({ ...mail, key: wrongKey })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: `Unable to find the mail with tenantId=${mail.tenantId} and key=${wrongKey}`,
      });
    });
  });

  describe('DELETE /mails', () => {
    beforeAll(async () => {
      await mailsRepository.save({ ...mail, variables, id: uuidv4() });
    });
    afterAll(async () => {
      await mailsRepository.delete({ key: mail.key });
    });

    it('delete mail', async () => {
      const { body } = await app
        .delete(`${defaultUrl}?tenantId=${mail.tenantId}&key=${mail.key}`)
        .expect(200);
      expect(body).toEqual({ message: 'mail deleted.' });
    });

    it('delete mail without tenantId', async () => {
      const { body } = await app
        .delete(`${defaultUrl}?&key=${mail.key}`)
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'tenantId cannot be undefined',
      });
    });

    it('delete mail with default tenantId', async () => {
      const { body } = await app
        .delete(`${defaultUrl}?tenantId=${DEFAULT_TENANT_ID}&key=${mail.key}`)
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'default mails cannot be deleted using the API',
      });
    });

    it('delete mail without key', async () => {
      const { body } = await app
        .delete(`${defaultUrl}?tenantId=${mail.tenantId}`)
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: 'key cannot be undefined',
      });
    });
    it('delete mail with wrong key', async () => {
      const wrongKey = uuidv4();
      const { body } = await app
        .delete(`${defaultUrl}?tenantId=${mail.tenantId}&key=${wrongKey}`)
        .expect(404);
      expect(body).toEqual({
        status: 404,
        error: `Unable to find the mail with tenantId=${mail.tenantId} and key=${wrongKey}.`,
      });
    });
  });
});
