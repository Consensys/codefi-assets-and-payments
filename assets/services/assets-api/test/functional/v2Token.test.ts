import request from 'supertest';
import nock from 'nock';
import { defaultOptions, nockMode, authToken } from 'test/nockHelper';
import { getServer } from 'test/testServer';

describe('v2Token', () => {
  const defaultUrl = '/v2/essentials/token';
  let app: request.SuperTest<request.Test>;
  const issuerId = '5754df3d-3959-4aa1-80db-09d6c5858911';

  beforeAll(() => {
    const { superTestApp } = getServer();
    app = superTestApp;
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    nock.back.setMode(nockMode);
    nock.back.fixtures = __dirname + '/nockFixtures/token';
  });

  afterEach(() => {
    nock.restore();
  });

  describe('POST v2/essentials/token/hybrid', () => {
    jest.setTimeout(10000);

    const defaultHybridUrl = `${defaultUrl}/hybrid`;

    it('successfully creates a token', async () => {
      const { nockDone } = await nock.back('token-create.json', defaultOptions);

      const requestBody = {
        symbol: 'TEST',
        name: 'TestHybridToken',
        classes: ['classA', 'classB', 'classI'],
        certificateType: 'SALT',
        unregulatedERC20transfersActivated: false,
      };

      const resp = await app
        .post(`${defaultHybridUrl}?userId=${issuerId}`)
        .send(requestBody)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(202);

      expect(resp.body).toMatchSnapshot();

      nockDone();
    });
  });
});
