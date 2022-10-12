import Deployer from './deployer';
import { WALLETS } from '../config/constants';

class Chains {
  deployers: Deployer[];
  constructor() {
    this.deployers = WALLETS.map(
      ({ accounts, rpcEndpoint, key, ace }) =>
        new Deployer(key, accounts[0], rpcEndpoint, ace),
    );
  }
  init = async () =>
    await Promise.all(
      this.deployers.map((deployer) => {
        return deployer.init();
      }),
    );
}

const chainsInstance = new Chains();

export default chainsInstance;
