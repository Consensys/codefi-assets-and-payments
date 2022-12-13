import {
  OrchestrateClient,
  IChain,
  IRegisterChainRequest,
  IUpdateChainRequest,
  IHeaders,
} from 'pegasys-orchestrate'
import cfg from '../config'
import { Injectable } from '@nestjs/common'
import { createLogger } from '@consensys/observability'

@Injectable()
export class ChainRegistry {
  private client: OrchestrateClient
  private logger = createLogger('orchestrate')

  constructor() {
    this.client = new OrchestrateClient(cfg().orchestrateUrl)
  }

  async getAllChains(
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<IChain[]> {
    try {
      return await this.client.searchChains(authToken, headers)
    } catch (e) {
      this.logger.error(e)
      return []
    }
  }

  async getChain(
    chainName: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<IChain> {
    const chains = await this.getAllChains(authToken, headers)
    return chains.find((chain) => chain.name === chainName)
  }

  async deleteChain(
    chainId: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    try {
      await this.client.deleteChain(chainId, authToken, headers)
      this.logger.info(`Chain with UUID ${chainId} deleted in Orchestrate.`)
      return
    } catch (e) {
      this.logger.error(e)
      throw e
    }
  }

  async registerChain(
    chainName: string,
    networkUrl: string[],
    listeners?: any,
    privateTxManager?: any,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ) {
    const chain: IRegisterChainRequest = {
      name: chainName,
      urls: networkUrl,
      listener: listeners,
      privateTxManager: privateTxManager,
      labels,
    }

    try {
      const chainRegistered = await this.client.registerChain(
        chain,
        authToken,
        headers,
      )
      this.logger.info(
        `Chain with name ${chainRegistered.name} and UUID ${chainRegistered.uuid} registered in Orchestrate.`,
      )
      return chainRegistered
    } catch (e) {
      this.logger.error(e)
      throw e
    }
  }

  async updateChain(
    chainUUID: string,
    chainRequest: IUpdateChainRequest,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    try {
      const chainUpdated = await this.client.updateChain(
        chainUUID,
        chainRequest,
        authToken,
        headers,
      )
      this.logger.info(
        `Chain with name ${chainUpdated.name} and UUID ${chainUpdated.uuid} updated in Orchestrate.`,
      )
      return chainUpdated
    } catch (e) {
      this.logger.error(e)
      throw e
    }
  }
}
