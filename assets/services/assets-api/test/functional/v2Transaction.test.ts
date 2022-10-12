import request from 'supertest';
import nock from 'nock';
import { defaultOptions, nockMode, authToken } from 'test/nockHelper';
import { getServer } from 'test/testServer';

describe('v2Transaction', () => {
  const defaultUrl = '/v2/essentials/transaction';
  let app: request.SuperTest<request.Test>;
  const issuerId = 'ab3bd9cd-0192-4035-a9de-22c359deb6e1';
  const transactionId = 'b56e2ac0-7191-4ca6-b1d0-f65989c53531';

  beforeAll(() => {
    const { superTestApp } = getServer();
    app = superTestApp;
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    nock.back.setMode(nockMode);
    nock.back.fixtures = __dirname + '/nockFixtures/transaction';
  });

  afterEach(() => {
    nock.restore();
  });

  describe('GET v2/essentials/transaction/:id', () => {
    jest.setTimeout(10000);

    it('successfully checks transaction status', async () => {
      const { nockDone } = await nock.back(
        'transaction-check-status.json',
        defaultOptions,
      );

      const resp = await app
        .get(
          `${defaultUrl}/${transactionId}?withContext=true&userId=${issuerId}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resp.body).toMatchSnapshot();

      nockDone();
    });
  });
});
