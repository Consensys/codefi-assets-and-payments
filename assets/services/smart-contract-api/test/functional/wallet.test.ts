import nock from 'nock';
import { IAccount } from 'pegasys-orchestrate';
import {
  ORCHESTRATE_URL,
  SERVICE_TYPE_ORCHESTRATE,
  NETWORKS,
} from 'src/config/constants';
import { getJwtTokenNock } from 'test/nocks/initNocks/getJwtNock';
import { getServer } from 'test/testServer';

describe('/wallet', () => {
  let testApp;
  beforeAll(() => {
    testApp = getServer();
  });

  const walletAccount: IAccount = {
    address: '0x5bE830D5c2974042be1301928D1F55Ba4108EC5E',
    publicKey:
      'a3bc1ae285a53be8bac12131c28e01708fa625df83db1cd283249ca05725e484',
    compressedPublicKey:
      'a3bc1ae285a53be8bac12131c28e01708fa625df83db1cd283249ca05725e484',
    tenantID: 'fakeTenantId',
    active: true,
    createdAt: new Date(1655922934623),
    updatedAt: new Date(1655922934623),
  };

  describe('GET /create', () => {
    it('Successfuly creates a wallet', async () => {
      getJwtTokenNock();

      nock(ORCHESTRATE_URL, { encodedQueryParams: true })
        .post('/accounts', { chain: '10' })
        .reply(200, walletAccount);

      const resp = await testApp
        .get('/wallet/create')
        .query({
          ethServiceType: SERVICE_TYPE_ORCHESTRATE,
          chain: NETWORKS[0].chainId,
          forceTenantId: walletAccount.tenantID,
        })
        .expect(200);

      expect(resp.body).toEqual({ address: walletAccount.address });
    });
  });

  describe('GET /retrieve', () => {
    it('Successfuly fetches a wallet', async () => {
      getJwtTokenNock();

      nock(ORCHESTRATE_URL, { encodedQueryParams: true })
        .get(`/accounts/${walletAccount.address}`)
        .reply(200, walletAccount);

      const resp = await testApp
        .get('/wallet/retrieve')
        .query({ address: walletAccount.address })
        .expect(200);

      expect(resp.body).toEqual({
        account: {
          ...walletAccount,
          createdAt: walletAccount.createdAt.toISOString(),
          updatedAt: walletAccount.updatedAt.toISOString(),
        },
      });
    });
  });
});
