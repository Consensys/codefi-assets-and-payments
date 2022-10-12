import nock from 'nock';
import { v4 as uuidv4 } from 'uuid';
import matches from 'lodash/matches';
import {
  ORCHESTRATE_URL,
  SERVICE_TYPE_ORCHESTRATE,
  NETWORKS,
} from 'src/config/constants';
import { getJwtTokenNock } from 'test/nocks/initNocks/getJwtNock';
import { getServer } from 'test/testServer';
import { ITransaction } from 'pegasys-orchestrate';
import { formatAllArgs } from 'src/utils/helper';

describe('/contract', () => {
  let testApp;
  beforeAll(() => {
    testApp = getServer();
  });

  describe('POST /contract/deploy', () => {
    it('Successfuly deploys an erc20 contract', async () => {
      const tenantId = 'fakeTenantId';
      const tokenName = 'testToken';
      const tokenSymbol = 'TT';
      const idempotencyKey = uuidv4();
      const chain = NETWORKS[0];
      const signerAddress = '0x5bE830D5c2974042be1301928D1F55Ba4108EC5E';
      const constractArguments = [tokenName, tokenSymbol, 18];
      const formattedArgs = formatAllArgs(constractArguments);

      const contractDeployRequestBody = {
        contractName: 'ERC20Token',
        context: 'Useless property?',
        signerAddress,
        tenantId,
        serviceName: 'Tests service',
        serviceUrl: 'http://fake.callback.url',
        ethServiceType: SERVICE_TYPE_ORCHESTRATE,
        chain: chain.key,
        arguments: constractArguments,
        idempotencyKey,
      };

      const txId = uuidv4();

      const transactionReturned: ITransaction = {
        uuid: txId,
        idempotencyKey,
        chain: chain.key,
        params: {
          from: signerAddress,
          value: '123450000000000000',
          gas: '2979110',
          gasPrice: '2000000000000',
          args: formattedArgs,
        },
        schedule: {
          uuid: uuidv4(),
          createdAt: new Date(1656001429128),
        },
        createdAt: new Date(1656001429128),
      };

      getJwtTokenNock();

      nock(
        'https://rinkeby.infura.io/v3/',
        { encodedQueryParams: true },
      )
        .post(
          '/xxx-xxxxx-xxx',
          matches({ jsonrpc: '2.0', method: 'eth_estimateGas' }),
        )
        .reply(200, function (uri, requestBody) {
          return {
            id: requestBody['id'],
            jsonrpc: '2.0',
            result: '0x16ba93',
          };
        });

      nock(ORCHESTRATE_URL, { encodedQueryParams: true })
        .post('/transactions/deploy-contract', {
          params: {
            gas: 2979110,
            contractName: 'ERC20Token',
            contractTag: 'latest',
            from: '0x5bE830D5c2974042be1301928D1F55Ba4108EC5E',
            args: ['testToken', 'TT', '0x12'],
            gasPrice: '0x0',
          },
          chain: 'rinkeby',
          labels: {
            environmentName: 'codefi-local-env-001',
            tenantId: 'fakeTenantId',
            serviceName: 'Tests service',
            serviceUrl: 'http://fake.callback.url',
          },
        })
        .reply(200, transactionReturned);

      const resp = await testApp
        .post('/contract/deploy')
        .query({
          forceTenantId: tenantId,
        })
        .send(contractDeployRequestBody)
        .expect(200);

      expect(resp.body).toEqual({
        txIdentifier: txId,
        tx: {
          params: {
            contractName: 'ERC20Token',
            contractTag: 'latest',
            from: signerAddress,
            args: formattedArgs,
          },
          chain: chain.key,
        },
        type: SERVICE_TYPE_ORCHESTRATE,
      });
    });
  });
});
