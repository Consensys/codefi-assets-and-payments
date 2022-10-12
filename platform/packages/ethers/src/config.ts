require('dotenv').config()

const configObject = {
  blockchainWs: process.env.BLOCKCHAIN_WS || 'ws://localhost:8545',
  rpcEndpoint:
    process.env.RPC_ENDPOINT ||
    'https://e0cbffbent-e0qx3iztg6-rpc.de0-aws.kaleido.io/',
  networkUserId: process.env.NETWORK_USER_ID || 'e0zobo5siy',
  networkSecret:
    process.env.NETWORK_SECRET || 'eBgLufmv5IsrK0cKjCRtrF3Bqg5OdebGJbe4xEBFJwY',
}

export type ConfigType = typeof configObject

export default function cfg(): ConfigType {
  return configObject
}
