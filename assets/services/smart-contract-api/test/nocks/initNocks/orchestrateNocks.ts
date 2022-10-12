import nock, { RequestBodyMatcher } from 'nock';
import { ORCHESTRATE_URL } from 'src/config/constants';

export const orchestrateCodefiNetwork = {
  uuid: 'f7e0562f-196b-4fc8-8038-ffe01b2b9d73',
  name: 'codefi_assets_dev_network_2',
  tenantID: '_',
  urls: [
    'https://transaction-1.codefimember1.codefi-9228.onquorum.net:3200/EJX5yNaaXtv095cS6Srae0pa',
  ],
  chainID: 10,
  listenerDepth: 0,
  listenerCurrentBlock: 2651345,
  listenerStartingBlock: 2651345,
  listenerBackOffDuration: '5s',
  listenerExternalTxEnabled: false,
  createdAt: '2022-06-14T15:57:29.774283Z',
  updatedAt: '2022-06-14T15:57:29.774283Z',
};

export const orchestrateRinkebyNetwork = {
  uuid: '1e33457b-e7b1-4045-ba28-74a288c3d531',
  name: 'rinkeby',
  tenantID: '_',
  urls: ['https://rinkeby.infura.io/v3/7203f9a4d3af4664890c64b0ddf02a3d'],
  chainID: 4,
  listenerDepth: 0,
  listenerCurrentBlock: 10851431,
  listenerStartingBlock: 10851431,
  listenerBackOffDuration: '5s',
  listenerExternalTxEnabled: false,
  createdAt: '2022-06-14T15:57:30.096356Z',
  updatedAt: '2022-06-14T15:57:30.096356Z',
};

export function registerContractsOrchestrateNocks() {
  nock(ORCHESTRATE_URL, { encodedQueryParams: true })
    .persist()
    .post('/contracts')
    .reply(200);
}

export function registerChainOrchestrateNock(
  response,
  requestBody?: RequestBodyMatcher,
) {
  nock(ORCHESTRATE_URL, { encodedQueryParams: true })
    .post('/chains', requestBody)
    .reply(response.status, response.body);
}

export function getOrchestrateChainsNock(response) {
  nock(ORCHESTRATE_URL, { encodedQueryParams: true })
    .get('/chains')
    .reply(response.status, response.body);
}

export function getOrchestrateContractsNock() {
  nock(ORCHESTRATE_URL, { encodedQueryParams: true })
    .get('/contracts')
    .reply(200, [
      'BatchBalanceReader',
      'BatchReader',
      'BatchTokenIssuer',
      'DVP',
      'DVPHoldableLockable',
      'ERC1400',
      'ERC1400CertificateNonceAuditedV2',
      'ERC1400CertificateSaltAuditedV2',
      'ERC1400ERC20AuditedV1',
      'ERC1400HoldableCertificateToken',
      'ERC1400TokensValidator',
      'ERC1820Registry',
      'ERC20HoldableToken',
      'ERC20Token',
      'ERC721Token',
      'Example',
      'MultiSigWallet',
    ]);
}
