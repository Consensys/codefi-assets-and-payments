import { EntityNotFoundException } from '@codefi-assets-and-payments/error-handler'
import {
  ChainRegistry,
  ContractManager,
  IHeaders,
} from '@codefi-assets-and-payments/nestjs-orchestrate'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ChainService {
  constructor(
    private orchestrateChainRegistry: ChainRegistry,
    private contractManager: ContractManager,
  ) {}

  async findChainUuidFromChainName(
    chainName: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    const registeredChains: any[] =
      await this.orchestrateChainRegistry.getAllChains(authToken, headers)
    const foundChain = registeredChains.find(
      (chain) => chain.name === chainName,
    )
    if (!foundChain) {
      throw new EntityNotFoundException(
        `ChainNotFound`,
        `Chain with name=${chainName} was not found`,
        {
          chainName,
          registeredChains,
        },
      )
    }
    return foundChain.uuid
  }

  // IReceipt from orchestrate does not match exactly an ethereum receipt
  async findReceipt(
    chainName: string,
    txHash: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    const chainUuid = await this.findChainUuidFromChainName(
      chainName,
      authToken,
      headers,
    )
    const receipt = await this.contractManager.findTransactionReceiptByHash(
      txHash,
      chainUuid,
      authToken,
      headers,
    )
    return receipt
  }
}
