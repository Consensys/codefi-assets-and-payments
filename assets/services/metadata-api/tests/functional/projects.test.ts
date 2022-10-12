import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getServer } from '../testServer';
import { v4 as uuidv4 } from 'uuid';
import { Project } from 'src/model/ProjectEntity';
import { getMockedProject } from 'tests/mocks/ProjectsMocks';

describe('Projects routes', () => {
  jest.setTimeout(20000);

  let app: request.SuperTest<request.Test>;
  let moduleRef: TestingModule;
  const defaultUrl = '/projects';
  const tenantId = 'fakeTenantId';
  let projectsRepository: Repository<Project>;
  const project = getMockedProject(tenantId);
  beforeAll(async () => {
    const { superTestApp, moduleRef: module } = getServer();
    moduleRef = module;
    app = superTestApp;
    projectsRepository = moduleRef.get('ProjectRepository');
  });

  afterAll(async () => {
    await projectsRepository.delete({});
  });

  describe('POST /projects', () => {
    afterAll(async () => {
      await projectsRepository.delete({});
    });
    it('create project', async () => {
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(project)
        .expect(201);
      expect(body).toEqual(expect.objectContaining(project));
    });
    it('create project with same key', async () => {
      await projectsRepository.save({ ...project, id: uuidv4() });
      const { body } = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(project)
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: `Invalid Project inputs: project with key ${project.key} already exists`,
      });
    });
  });

  describe('GET /projects', () => {
    const id = uuidv4();
    beforeAll(async () => {
      await projectsRepository.save({ ...project, id });
    });
    afterAll(async () => {
      await projectsRepository.delete({});
    });

    it('get by project id', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&id=${id}`)
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual(expect.objectContaining(project));
    });
    it('get by project key', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&key=${project.key}`)
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual(expect.objectContaining(project));
    });
    it('get by project name', async () => {
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&name=${project.name}`)
        .expect(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual(expect.objectContaining(project));
    });

    it('get all projects', async () => {
      await projectsRepository.save({
        ...project,
        id: uuidv4(),
        key: 'newkey',
      });
      const { body } = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&name=${project.name}`)
        .expect(200);
      expect(body).toHaveLength(2);
    });

    it('get projects batch', async () => {
      const secondId = uuidv4();
      await projectsRepository.save({
        ...project,
        id: secondId,
        key: 'newkey',
      });
      const { body } = await app
        .get(
          `${defaultUrl}?tenantId=${tenantId}&projectIds=${JSON.stringify([
            id,
            secondId,
          ])}`,
        )
        .expect(200);
      expect(body).toHaveLength(2);
    });
  });

  describe('PUT /projects', () => {
    const id = uuidv4();
    beforeAll(async () => {
      await projectsRepository.save({ ...project, id });
    });

    it('update project', async () => {
      const { body } = await app
        .put(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .send({ ...project, name: 'updated_name' })
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({ ...project, name: 'updated_name' }),
      );
    });

    it('update project with wrong id', async () => {
      const wrongId = uuidv4();
      const { body } = await app
        .put(`${defaultUrl}/${wrongId}?tenantId=${tenantId}`)
        .send({ ...project, name: 'updated_name' })
        .expect(400);
      expect(body).toEqual({
        status: 400,
        error: `Unable to find the project with id=${wrongId}`,
      });
    });
  });
  describe('DELETE /projects', () => {
    const id = uuidv4();
    beforeAll(async () => {
      await projectsRepository.save({ ...project, id });
    });

    it('delete project', async () => {
      const { body } = await app
        .delete(`${defaultUrl}/${id}?tenantId=${tenantId}`)
        .expect(200);
      expect(body).toEqual({ message: '1 deleted project(s).' });
    });
    it('delete project with wrong id', async () => {
      const wrongId = uuidv4();
      const { body } = await app
        .delete(`${defaultUrl}/${wrongId}?tenantId=${tenantId}`)
        .expect(404);
      expect(body).toEqual({
        status: 404,
        error: `Unable to find the project with id=${wrongId}`,
      });
    });
  });
});
