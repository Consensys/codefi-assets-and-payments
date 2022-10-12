import nock from 'nock';
import { getServer } from 'test/testServer';
import request from 'supertest';
import { defaultOptions, nockMode, authToken } from 'test/nockHelper';

describe('v3User', () => {
  const defaultUrl = '/v2/essentials/auth0user';
  const adminId = 'fd5a035a-df3b-447d-a514-8c5bd4bfde59';
  let app: request.SuperTest<request.Test>;

  beforeAll(() => {
    const { superTestApp } = getServer();
    app = superTestApp;
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    nock.back.setMode(nockMode);
    nock.back.fixtures = __dirname + '/nockFixtures/auth0User';
  });

  afterEach(() => {
    nock.restore();
  });

  describe('POST v2/essentials/auth0user', () => {
    jest.setTimeout(10000);

    it('successfully creates an Auth0 user for an entity', async () => {
      const { nockDone } = await nock.back(
        'entity-auth0user-create.json',
        defaultOptions,
      );

      const body = {
        email: 'test-123456789@example.com',
        firstName: 'firstName',
        lastName: 'lastName',
      };

      const resp = await app
        .post(`${defaultUrl}?userId=${adminId}`)
        .send(body)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(resp.body).toMatchSnapshot();

      nockDone();
    });
  });

  describe('GET v2/essentials/auth0user', () => {
    jest.setTimeout(10000);

    it("successfully lists entity's Auth0 users", async () => {
      const { nockDone } = await nock.back(
        'entity-auth0user-list-all.json',
        defaultOptions,
      );

      const resp = await app
        .get(`${defaultUrl}?offset=0&limit=10&userId=${adminId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resp.body).toMatchSnapshot();

      nockDone();
    });
  });
});
