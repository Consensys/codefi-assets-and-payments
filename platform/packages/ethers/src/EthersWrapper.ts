import { ethers } from 'ethers'
import { ProviderAuth } from './types/ProviderAuth'

export class EthersWrapper {
  private ethersInstance: any

  instance(blockchainRpcUrl: string, reload?: boolean): any {
    if (!this.ethersInstance || reload) {
      this.ethersInstance = this.buildProvider(blockchainRpcUrl)
      return this.ethersInstance
    } else {
      return this.ethersInstance
    }
  }

  contract(abi: any[], address?: string): ethers.Contract {
    if (!this.ethersInstance) {
      throw new Error(
        `ethersInstance is not defined. Call instance() function first`,
      )
    }
    return new ethers.Contract(address, abi, this.ethersInstance)
  }

  private buildProvider(blockchainRpcUrl: string) {
    let providerAuth: ProviderAuth
    const url = new URL(blockchainRpcUrl)

    if (url.username && url.password) {
      // contains basic auth
      const user = url.username
      const password = url.password
      url.username = ''
      url.password = ''
      const href = url.href

      providerAuth = {
        url: href,
        password,
        user,
      }
    } else {
      // does not contain basic auth
      providerAuth = {
        url: blockchainRpcUrl,
      }
    }

    const httpProvider = new ethers.providers.JsonRpcProvider(providerAuth)
    return httpProvider
  }
}
