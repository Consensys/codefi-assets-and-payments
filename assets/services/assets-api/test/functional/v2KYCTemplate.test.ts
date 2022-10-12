import request from 'supertest';
import nock from 'nock';
import { defaultOptions, nockMode, authToken } from 'test/nockHelper';
import { getServer } from 'test/testServer';

describe('v2KYCTemplate', () => {
  const defaultUrl = '/v2/essentials/kyc/template';
  let app: request.SuperTest<request.Test>;
  const issuerId = '28feab66-1d52-406f-8d80-b61431f4c561';

  beforeAll(() => {
    const { superTestApp } = getServer();
    app = superTestApp;
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    nock.back.setMode(nockMode);
    nock.back.fixtures = __dirname + '/nockFixtures/kycTemplate';
  });

  afterEach(() => {
    nock.restore();
  });

  describe('GET v2/essentials/kyc/template', () => {
    jest.setTimeout(10000);
    it('successfully returns a token by id', async () => {
      const { nockDone } = await nock.back(
        'kyc-template-get-all.json',
        defaultOptions,
      );
      const resp = await app
        .get(`${defaultUrl}?userId=${issuerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resp.body).toMatchSnapshot();

      nockDone();
    });
  });
});
