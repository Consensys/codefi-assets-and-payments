import request from 'supertest';
import nock from 'nock';
import { defaultOptions, nockMode, authToken } from 'test/nockHelper';
import { getServer } from 'test/testServer';

describe('v2AssetTemplate', () => {
  const defaultUrl = '/v2/essentials/asset/template';
  let app: request.SuperTest<request.Test>;
  const adminId = 'fd5a035a-df3b-447d-a514-8c5bd4bfde59';
  const issuerId = '3550dc31-2356-448b-a482-6ab898372550';
  const templateId = '593f1263-9739-4394-92ad-71702430759e';

  beforeAll(() => {
    const { superTestApp } = getServer();
    app = superTestApp;
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    nock.back.setMode(nockMode);
    nock.back.fixtures = __dirname + '/nockFixtures/assetTemplate';
  });

  afterEach(() => {
    nock.restore();
  });

  describe('GET v2/essentials/asset/template', () => {
    jest.setTimeout(10000);

    it('successfully returns list of templates', async () => {
      const { nockDone } = await nock.back(
        'templates-list.json',
        defaultOptions,
      );

      const resp = await app
        .get(`${defaultUrl}?userId=${adminId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resp.body).toMatchSnapshot();

      nockDone();
    });
  });

  describe('GET v2/essentials/asset/template/:assetTemplateId', () => {
    jest.setTimeout(10000);

    it('successfully returns the asset template', async () => {
      const { nockDone } = await nock.back(
        'template-retrieve.json',
        defaultOptions,
      );
      const resp = await app
        .get(`${defaultUrl}/${templateId}?userId=${issuerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resp.body).toMatchSnapshot();

      nockDone();
    });
  });
});
