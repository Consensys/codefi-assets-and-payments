import { envString } from './utils/config-utils'

require('dotenv').config()

const configObject = {
  orchestrateUrl: envString('ORCHESTRATE_URL'),
  orchestrateKafkaUrl: envString('ORCHESTRATE_KAFKA_URL'),
  kafkaGroupId: process.env.KAFKA_GROUP_ID,
  orchestrateContractTag: (value?) => {
    return value || process.env.ORCHESTRATE_CONTRACT_TAG
  },
  orchestrateChainName: (value?) => {
    return value || process.env.ORCHESTRATE_CHAIN_NAME
  },
  transactionGas: (value?) => {
    return value || process.env.TRANSACTION_GAS || undefined
  },
  // 1 gwei
  transactionGasPrice: (value?) => {
    return value || process.env.TRANSACTION_GAS_PRICE || undefined
  },
  orchestrateFilterFlag: process.env.ORCHESTRATE_FILTER_FLAG, // Optional parameter, used to ensure a service recognizes (and consumes) only its own messages (useful for pipeline integration tests)
  orchestrateNamespace: envString('AUTH_CUSTOM_ORCHESTRATE_NAMESPACE'), // Used when Orchestrate multi-tenancy is enabled, to extract tenantId from authToken
}

export type ConfigType = typeof configObject

export default function cfg(): ConfigType {
  return configObject
}
