require('ts-node/register')
require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider')

/**
 * Create a web3 provider from a mnemonic and rpc endpoint
 * @param  {string} mnemonic    mnemonic seed phrase
 * @param  {string} rpcEndpoint rpc endpoint of the targeted blockchain
 * @return {object}             web3 provider set up with accounts derived
 * from the mnemonic
 */
const providerWithMnemonic = (mnemonic, rpcEndpoint) => () =>
  new HDWalletProvider(mnemonic, rpcEndpoint)

/**
 * Create a web3 provider for a particular network using infura api key and
 * mmemonic (in env)
 * @param  {string} network the targeted network, allowed values: 'mainnet',
 * 'ropsten', 'rinkeby', etc...
 * @return {object}         web3 provider for a given network set up with
 * accounts derived from the mnemonic
 */
const infuraProvider = network =>
  providerWithMnemonic(
    process.env.MNEMONIC || '',
    `https://${network}.infura.io/${process.env.INFURA_API_KEY}`,
  )

const ropstenProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider('ropsten')

module.exports = {
  mocha: {
    enableTimeouts: false,
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      gasPrice: 36,
    },
  },
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */
  contracts_directory: "./codefi_contracts",
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*', // eslint-disable-line camelcase
    },
    ropsten: {
      provider: ropstenProvider,
      network_id: 3, // eslint-disable-line camelcase
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
    dotEnvNetwork: {
      provider: providerWithMnemonic(
        process.env.MNEMONIC,
        process.env.RPC_ENDPOINT,
      ),
      network_id: parseInt(process.env.NETWORK_ID) || '*', // eslint-disable-line camelcase
    },
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: '0.8.0', // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200,
        },
        //  evmVersion: "byzantium"
      },
    },
  },
  plugins: ['solidity-coverage'],
}
