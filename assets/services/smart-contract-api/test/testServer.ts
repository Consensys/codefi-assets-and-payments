import 'tsconfig-paths/register';
import supertest from 'supertest';
import { Express } from 'express';
import nock from 'nock';
import { initAll } from 'src/app';
import { serverInitNocks } from 'test/nocks/initNocks/serverInitNocks';
import orchestrateInstance from 'src/orchestrate';

let testApp: supertest.SuperTest<supertest.Test>;
let app: Express;

const initServer = async () => {
  if (!testApp) {
    app = await initAll();
    testApp = supertest(app);
  }
};

jest.setTimeout(20000);

beforeAll(async function () {
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');

  serverInitNocks();

  await initServer();

  nock.cleanAll();
});

afterEach(() => {
  if (!nock.isDone()) {
    throw new Error(`Pending network mocks: ${nock.pendingMocks()}`);
  }

  nock.cleanAll();
});

afterAll(async function () {
  await orchestrateInstance.close();
  nock.restore();
});

export const getServer = () => testApp;
