import nock from 'nock';
import { getServer } from 'test/testServer';
import request from 'supertest';
import { defaultOptions, nockMode, authToken } from 'test/nockHelper';

describe('v2User', () => {
  const defaultUrl = '/v2/essentials/user';
  const adminId = 'fd5a035a-df3b-447d-a514-8c5bd4bfde59';
  const issuerId = 'c723c9ba-4c17-4687-a590-08f25443fb32';
  let app: request.SuperTest<request.Test>;

  beforeAll(() => {
    const { superTestApp } = getServer();
    app = superTestApp;
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    nock.back.setMode(nockMode);
    nock.back.fixtures = __dirname + '/nockFixtures/user';
  });

  afterEach(() => {
    nock.restore();
  });

  describe('POST v2/essentials/user', () => {
    jest.setTimeout(10000);

    describe('as an admin', () => {
      it('successfully creates an issuer', async () => {
        const { nockDone } = await nock.back(
          'user-admin-create-issuer.json',
          defaultOptions,
        );

        const body = {
          email: 'test-123456789@example.com',
          firstName: 'firstName',
          lastName: 'lastName',
          userType: 'ISSUER',
        };
        const resp = await app
          .post(`${defaultUrl}?userId=${adminId}`)
          .send(body)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(201);

        expect(resp.body).toMatchSnapshot();

        nockDone();
      });

      it('successfully creates a notary', async () => {
        const { nockDone } = await nock.back(
          'user-admin-create-notary.json',
          defaultOptions,
        );

        const body = {
          email: 'test-notary123456789@example.com',
          firstName: 'notaryFirstName',
          lastName: 'notaryLastName',
          userType: 'NOTARY',
        };

        const resp = await app
          .post(`${defaultUrl}?userId=${adminId}`)
          .send(body)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(201);

        expect(resp.body).toMatchSnapshot();

        nockDone();
      });

      it('successfully creates a nav manager', async () => {
        const { nockDone } = await nock.back(
          'user-admin-create-navmanager.json',
          defaultOptions,
        );

        const body = {
          email: 'test-navmanager123456789@example.com',
          firstName: 'navmanagerFirstName',
          lastName: 'navmanagerLastName',
          userType: 'NAV_MANAGER',
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

    describe('as an issuer', () => {
      it('successfully creates an investor', async () => {
        const { nockDone } = await nock.back(
          'user-issuer-create-investor.json',
          defaultOptions,
        );

        const body = {
          email: 'test-investor-123456789@example.com',
          firstName: 'firstInvestorName',
          lastName: 'lastInvestorName',
          userType: 'INVESTOR',
        };
        const resp = await app
          .post(`${defaultUrl}?userId=${issuerId}`)
          .send(body)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(201);

        expect(resp.body).toMatchSnapshot();

        nockDone();
      });

      it('successfully creates an agent', async () => {
        const { nockDone } = await nock.back(
          'user-issuer-create-agent.json',
          defaultOptions,
        );

        const body = {
          email: 'test-agent-123456789@example.com',
          firstName: 'agentFirstName',
          lastName: 'agentLastName',
          userType: 'AGENT',
        };
        const resp = await app
          .post(`${defaultUrl}?userId=${issuerId}`)
          .send(body)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(201);

        expect(resp.body).toMatchSnapshot();

        nockDone();
      });
    });
  });
});
