import matches from 'lodash/matches';
import { getJwtTokenNock } from './getJwtNock';
import {
  getOrchestrateChainsNock,
  getOrchestrateContractsNock,
  orchestrateCodefiNetwork,
  orchestrateRinkebyNetwork,
  registerChainOrchestrateNock,
  registerContractsOrchestrateNocks,
} from './orchestrateNocks';
import {
  serverInitJsonRpcCodefiNetwork,
  serverInitJsonRpcRinkebyNetwork,
} from './web3NetworkNocks';

export function serverInitNocks() {
  getJwtTokenNock();

  // Orchestrate server init requests
  getOrchestrateChainsNock({ status: 200, body: [] });
  registerChainOrchestrateNock(
    { status: 200, body: orchestrateCodefiNetwork },
    matches({ name: 'codefi_assets_dev_network_2' }),
  );
  registerChainOrchestrateNock(
    { status: 200, body: orchestrateRinkebyNetwork },
    matches({ name: 'rinkeby' }),
  );
  getOrchestrateChainsNock({
    status: 200,
    body: [orchestrateCodefiNetwork, orchestrateRinkebyNetwork],
  });
  registerContractsOrchestrateNocks();
  getOrchestrateContractsNock();

  // JSON RPC mocks (web3)
  serverInitJsonRpcCodefiNetwork();
  serverInitJsonRpcRinkebyNetwork();
}
