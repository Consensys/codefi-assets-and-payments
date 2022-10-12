import request from 'supertest';
import nock from 'nock';
import { defaultOptions, nockMode, authToken } from 'test/nockHelper';
import { getServer } from 'test/testServer';

describe('v2Action', () => {
  const defaultUrl = '/v2/essentials/action';
  let app: request.SuperTest<request.Test>;
  const investorId = 'bec354b9-be6c-472c-a792-9167e3bbf543';
  const issuerId = '5754df3d-3959-4aa1-80db-09d6c5858911';
  const tokenId = '5594bf56-92e1-4d69-ab85-e7213e0fda84';
  const orderId = 422063;

  beforeAll(() => {
    const { superTestApp } = getServer();
    app = superTestApp;
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    nock.back.setMode(nockMode);
    nock.back.fixtures = __dirname + '/nockFixtures/action';
  });

  afterEach(() => {
    nock.restore();
  });

  describe('GET v2/essentials/action', () => {
    jest.setTimeout(10000);
    it('successfully returns list of actions', async () => {
      const { nockDone } = await nock.back('actions-list.json', defaultOptions);
      const resp = await app
        .get(
          `${defaultUrl}?offset=0&limit=10&tokenId=${tokenId}&userId=${issuerId}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resp.body).toMatchSnapshot();

      nockDone();
    });
  });

  describe('GET v2/essentials/action/:orderId', () => {
    it('successfully returns order details', async () => {
      const { nockDone } = await nock.back(
        'action-details.json',
        defaultOptions,
      );
      const resp = await app
        .get(`${defaultUrl}/${orderId}?userId=${investorId}`)

        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resp.body).toMatchSnapshot();

      nockDone();
    });
  });

  describe('GET v2/essentials/action/:orderId/transition', () => {
    it('successfully returns order transition details', async () => {
      const { nockDone } = await nock.back(
        'action-transition-details.json',
        defaultOptions,
      );
      const resp = await app
        .get(`${defaultUrl}/${orderId}/transition?userId=${investorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resp.body).toMatchSnapshot();

      nockDone();
    });
  });
});
