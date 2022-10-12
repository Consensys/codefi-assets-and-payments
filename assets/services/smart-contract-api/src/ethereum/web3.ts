import Web3 from 'web3';

import { WALLETS } from '../config/constants';

const currentWeb3 = {};

WALLETS.forEach(
  ({ rpcEndpoint, key }) => (currentWeb3[key] = new Web3(rpcEndpoint)),
);

export default currentWeb3;
