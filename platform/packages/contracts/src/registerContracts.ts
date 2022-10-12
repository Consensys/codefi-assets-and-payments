import {
  ContractRegistry,
  IContract,
  IRegisterContractRequest,
} from 'pegasys-orchestrate'
import contracts = require('./contractsToRegister')
import cfg from './config'

const getContract = async (
  contractRegistry: ContractRegistry,
  name: string,
  tag: string,
) => {
  const contract: IContract = await contractRegistry
    .get(name, tag)
    .then((res: any) => res)
    .catch(() => null)
  return contract
}

const getContractBytecode = async (
  contractRegistry: ContractRegistry,
  name: string,
  tag: string,
) => {
  console.log(`Getting bytecode of ${name}, ${tag}`)
  const response = await getContract(contractRegistry, name, tag)
  if (!response || !response.name || !response.bytecode) {
    return ''
  }
  return response.bytecode.toString() // hex
}

const getLastTag = async (
  registry: ContractRegistry,
  contractName: string,
): Promise<number> => {
  try {
    const contractTags = await registry.getTags(contractName)
    console.log(`Contract tags for ${contractName} are: ${contractTags}`)
    if (!contractTags || !contractTags) {
      return 0
    }
    const orderedTags = contractTags
      .filter((tag: string) => {
        return Number.isInteger(parseInt(tag))
      })
      .map((tag: string) => parseInt(tag))
      .sort((a: any, b: any) => a - b)
    if (orderedTags.length === 0) {
      return 0
    }
    return orderedTags[orderedTags.length - 1]
  } catch (e) {
    console.error(e)
    return 0
  }
}

const registerContract = async (
  registry: ContractRegistry,
  contractName: string,
  contractTag: string,
  contractArtifact: any,
) => {
  const contract: IRegisterContractRequest = {
    name: contractName,
    tag: contractTag,
    abi: contractArtifact.abi,
    bytecode: contractArtifact.bytecode,
    deployedBytecode: contractArtifact.deployedBytecode,
  }

  try {
    await registry.register(contract)
    console.log(`Contract: ${contractName} registered with tag ${contractTag}`)
  } catch (e) {
    console.error(e)
  }
}

const registerNewContractVersions = async (registry: any) => {
  contracts.contractsToRegister.forEach(async (contractName: string) => {
    console.log(`Checking contract ${contractName}`)
    const lastTag = await getLastTag(registry, contractName)
    console.log(`Last tag for ${contractName} is ${lastTag}`)
    const registeredBytecode = await getContractBytecode(
      registry,
      contractName,
      lastTag.toString(),
    )
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const contractJson = require(`../build/contracts/${contractName}.json`)
    if (!contractJson) {
      return
    }

    if (contractJson.bytecode !== registeredBytecode) {
      const nextTag = lastTag + 1
      console.log(
        `Contract bytecode does not match with registered bytecode for: contractName=${contractName}, tag=${lastTag}, registering with new tag=${nextTag}`,
      )
      await registerContract(
        registry,
        contractName,
        nextTag.toString(),
        contractJson,
      )
    } else {
      console.log(
        `Contract was not registered, bytecode matched. Current contract=${contractName}, tag=${lastTag}.`,
      )
    }
  })
}
;(async () => {
  try {
    const endpoint = cfg().contractRegistryHost
    const registry: ContractRegistry = new ContractRegistry(endpoint)
    await registerNewContractVersions(registry)
  } catch (error) {
    console.log(error)
  }
})().catch(() => {
  // Logged within async block
})
