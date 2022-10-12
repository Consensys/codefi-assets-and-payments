import {
  IContract,
  IHeaders,
  IRegisterContractRequest,
  OrchestrateClient,
} from 'pegasys-orchestrate'
import cfg from '../config'
import { Injectable } from '@nestjs/common'
import { EntityNotFoundException } from '@codefi-assets-and-payments/error-handler'
import { createLogger } from '@codefi-assets-and-payments/observability'

@Injectable()
export class ContractRegistry {
  private client: OrchestrateClient
  private logger = createLogger('orchestrate')

  constructor() {
    this.client = new OrchestrateClient(cfg().orchestrateUrl)
  }

  async getContract(
    name: string,
    tag: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<IContract> {
    try {
      return await this.client.getContract(name, tag, authToken, headers)
    } catch (e) {
      this.logger.error(e)
      return
    }
  }

  async getContractBytecode(
    name: string,
    tag: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    this.logger.info(`Getting bytecode of ${name}, ${tag}`)
    const response = await this.getContract(name, tag, authToken, headers)
    if (!response || !response.name || !response.bytecode) {
      return ''
    }
    return response.bytecode.toString() // hex
  }

  async getLastTag(
    contractName: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<number> {
    try {
      const contractTags = await this.client.getContractTags(
        contractName,
        authToken,
        headers,
      )
      this.logger.info(`Contract tags for ${contractName} are: ${contractTags}`)
      if (!contractTags) {
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
      this.logger.error(e)
      return 0
    }
  }

  async registerContract(
    contractName: string,
    contractTag: string,
    contractArtifact: any,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    const contract: IRegisterContractRequest = {
      name: contractName,
      tag: contractTag,
      abi: contractArtifact.abi,
      bytecode: contractArtifact.bytecode,
      deployedBytecode: contractArtifact.deployedBytecode,
    }

    try {
      await this.client.registerContract(contract, authToken, headers)
      this.logger.info(
        `Contract: ${contractName} registered with tag ${contractTag}`,
      )
    } catch (e) {
      this.logger.error(e)
      throw e
    }
  }

  async registerNewContractVersion(
    contractName: string,
    contractArtifact: any,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    this.logger.info(`Checking contract ${contractName}`)
    const lastTag = await this.getLastTag(contractName, authToken, headers)
    this.logger.info(`Last tag for ${contractName} is ${lastTag}`)
    const registeredBytecode = await this.getContractBytecode(
      contractName,
      lastTag.toString(),
      authToken,
      headers,
    )

    if (contractArtifact.bytecode !== registeredBytecode) {
      const nextTag = registeredBytecode === '' ? lastTag : lastTag + 1
      this.logger.info(
        `Contract bytecode does not match with registered bytecode for: contractName=${contractName}, tag=${lastTag}, registering with new tag=${nextTag}`,
      )
      await this.registerContract(
        contractName,
        nextTag.toString(),
        contractArtifact,
        authToken,
        headers,
      )
    } else {
      this.logger.info(
        `Contract was not registered, bytecode matched. Current contract=${contractName}, tag=${lastTag}.`,
      )
    }
  }

  async getContractByContractName(
    contractName: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<IContract> {
    const contractLastTag = await this.getLastTag(
      contractName,
      authToken,
      headers,
    )
    const contractObject = this.getContract(
      contractName,
      contractLastTag.toString(),
      authToken,
      headers,
    )
    if (!contractObject) {
      throw new EntityNotFoundException(
        'Cotnract not found',
        `Contract ${contractName} could not be found in Orchestrate with headers=${JSON.stringify(
          headers || {},
        )}`,
        {
          contractName,
          authToken,
          headers,
        },
      )
    }
    return contractObject
  }
}
