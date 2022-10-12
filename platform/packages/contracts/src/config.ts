require('dotenv').config()

const configObject = {
  kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
  contractRegistryHost: process.env.CONTRACT_REGISTRY_HOST || 'localhost:8080',
  chainData: process.env.CHAIN_DATA,
  ethAccount: process.env.ETH_ACCOUNT,
  faucetAccount: process.env.FAUCET_ACCOUNT,
  registerHost: process.env.REGISTER_CHAIN_FAUCET_HOST,
  counterContractAddress: process.env.COUNTER_CONTRACT_ADDRESS,
}

export type ConfigType = typeof configObject

export default function cfg(): ConfigType {
  return configObject
}
