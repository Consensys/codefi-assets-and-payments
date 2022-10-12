/* eslint-disable @typescript-eslint/no-var-requires */
const HDWalletProvider = require('truffle-hdwallet-provider');

const providerWithMnemonic = (mnemonic, rpcEndpoint) => () =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = (network) =>
  providerWithMnemonic(
    process.env.MNEMONIC || '',
    `https://${network}.infura.io/${process.env.INFURA_API_KEY}`,
  );

const ropstenProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider('ropsten');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8555,
      network_id: '*', // eslint-disable-line camelcase
    },
    ropsten: {
      provider: ropstenProvider,
      network_id: 3, // eslint-disable-line camelcase
      gasPrice: 5000000000, // 5 Gwei
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '*', // eslint-disable-line camelcase
    },
  },
  compilers: {
    solc: {
      version: '0.5.10',
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 0, // Default: 200
        },
      },
    },
  },
};
