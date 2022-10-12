import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { TestingModule } from '@nestjs/testing';
import fs from 'fs';
import path from 'path';
import { AssetTemplate } from '../../src/model/AssetTemplateEntity';
import { getServer } from '../testServer';
import {
  mockedTemplate,
  sectionWithWrongKey,
} from 'tests/mocks/AssetTemplatesMocks';
import { Repository } from 'typeorm';
import { AssetType } from 'src/utils/constants';

describe('Asset Templates routes', () => {
  // We need this timeout to allow typeorm migrations to run when createNestApplication
  jest.setTimeout(20000);

  let app: request.SuperTest<request.Test>;
  let moduleRef: TestingModule;
  let initialTemplateFiles: string[];
  let initialTemplates: AssetTemplate[];
  let assetTemplateRepository: Repository<AssetTemplate>;
  const defaultUrl = '/assetTemplates';
  const template = mockedTemplate;

  beforeAll(async () => {
    initialTemplateFiles = fs.readdirSync(
      path.resolve(__dirname, '../../src/configurations/assets/templates'),
    );
    initialTemplates = initialTemplateFiles.map((templateFile) => {
      const template = fs.readFileSync(
        path.resolve(
          __dirname,
          '../../src/configurations/assets/templates/',
          templateFile,
        ),
        'utf-8',
      );
      return JSON.parse(template) as AssetTemplate;
    });
  });

  beforeAll(async () => {
    const { superTestApp, moduleRef: module } = getServer();
    moduleRef = module;
    app = superTestApp;

    assetTemplateRepository = moduleRef.get('AssetTemplateRepository');
  });

  describe('POST /assetTemplates', () => {
    afterAll(async () => {
      await assetTemplateRepository.delete({ name: template.name });
    });
    it('create asset template', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${template.tenantId}`)
        .send(template)
        .expect(201);
      expect(body).toEqual(expect.objectContaining(template));
    });

    it('create asset template with existing name', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${template.tenantId}`)
        .send(template)
        .expect(400);
      expect(body).toEqual({
        error:
          'Template with name: TEST_TEMPLATE already exists, please choose another name',
        status: 400,
      });
      await assetTemplateRepository.delete({ name: template.name });
    });

    it('create asset template with wrong element', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${template.tenantId}`)
        .send({
          ...template,
          topSections: sectionWithWrongKey,
        })
        .expect(400);
      expect(body).toEqual({
        error: "Element with key: wrong_key doesn't exist.",
        status: 400,
      });
    });
  });

  describe('GET /assetTemplates', () => {
    it('returns list of templates', async () => {
      const resp = await app.get(`/assetTemplates?tenantId=codefi`).expect(200);
      const templates = resp.body;

      expect(templates.length).toBe(
        initialTemplates.filter((tmpl) => tmpl.tenantId === 'codefi').length,
      );
    });

    it('returns a templatate by name', async () => {
      const resp = await app
        .get(
          `/assetTemplates?name=${initialTemplates[0].name}&tenantId=${initialTemplates[0].tenantId}`,
        )
        .expect(200);
      const templates = resp.body;

      expect(templates[0].name).toBe(initialTemplates[0].name);
      expect(templates[0].topSections).toStrictEqual(
        initialTemplates[0].topSections,
      );
    });

    it('returns a templatate by name with also templatate title if someone has it', async () => {
      const templateWithTitle = initialTemplates.find((tmpl) => tmpl.title);
      const resp = await app
        .get(
          `/assetTemplates?name=${templateWithTitle?.name}&tenantId=${templateWithTitle?.tenantId}`,
        )
        .expect(200);
      const templates = resp.body;

      expect(templates[0].title).toStrictEqual(templateWithTitle?.title);
      expect(templates[0].title).toHaveProperty('en');
    });
  });

  describe('PUT /assetTemplates', () => {
    const templateId = uuidv4();
    beforeAll(async () => {
      await assetTemplateRepository.save({ ...template, id: templateId });
    });

    afterAll(async () => {
      await assetTemplateRepository.delete({ name: template.name });
    });

    it('update template', async () => {
      const { body } = await app
        .put(`${defaultUrl}/${templateId}?tenantId=${template.tenantId}`)
        .send({ ...template, type: AssetType.COLLECTIBLE })
        .expect(200);
      expect(body).toEqual(
        expect.objectContaining({ ...template, type: AssetType.COLLECTIBLE }),
      );
    });

    it('update template with wrong id', async () => {
      const wrongId = uuidv4();
      const { body } = await app
        .put(`${defaultUrl}/${wrongId}?tenantId=${template.tenantId}`)
        .send({ ...template, type: AssetType.COLLECTIBLE })
        .expect(400);
      expect(body).toEqual({
        error: `Unable to find the assetTemplate with id=${wrongId}`,
        status: 400,
      });
    });
  });

  describe('DELETE /assetTemplates', () => {
    const templateId = uuidv4();
    beforeAll(async () => {
      await assetTemplateRepository.save({ ...template, id: templateId });
    });

    it('delete template', async () => {
      const { body } = await app
        .delete(`${defaultUrl}/${templateId}?tenantId=${template.tenantId}`)
        .expect(200);

      expect(body).toEqual({ message: '1 deleted assetTemplate(s).' });
    });

    it('delete template with wrong id', async () => {
      const wrongId = uuidv4();
      const { body } = await app
        .delete(`${defaultUrl}/${wrongId}?tenantId=${template.tenantId}`)
        .expect(404);

      expect(body).toEqual({
        status: 404,
        error: `Unable to find the assetTemplate with id=${wrongId}`,
      });
    });
  });
});
