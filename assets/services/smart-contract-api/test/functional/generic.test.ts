import { getServer } from 'test/testServer';

describe('/generic', () => {
  let testApp;
  beforeAll(() => {
    testApp = getServer();
  });

  describe('GET /get-deployer-address', () => {
    it('Successfuly return deployer address', async () => {
      const resp = await testApp
        .get('/generic/get-deployer-address')
        .expect(200);

      expect(resp.body).toEqual([
        {
          deployer: '0xf24339a4451510a461563f5044260b22d6dadead',
          key: 'codefi_assets_dev_network_2',
        },
        {
          deployer: '0xf24339a4451510a461563f5044260b22d6dadead',
          key: 'rinkeby',
        },
      ]);
    });
  });
});
