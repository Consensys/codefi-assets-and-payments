import { Injectable } from '@nestjs/common'
import {
  IAccount,
  OrchestrateClient,
  IImportAccountRequest,
  IHeaders,
} from 'pegasys-orchestrate'
import cfg from '../config'

@Injectable()
export class OrchestrateAccountsService {
  private client: OrchestrateClient

  constructor() {
    this.client = new OrchestrateClient(cfg().orchestrateUrl)
  }

  async generateAccount(
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    storeId?: string,
  ): Promise<string> {
    // Alias example (can be useful for later)
    // const account: IAccount = await this.client.createAccount({ alias: 'account_1' }, authToken);
    const account: IAccount = await this.client.createAccount(
      { storeID: storeId },
      authToken,
      headers,
    )
    return account.address
  }

  async importAccount(
    accountDetails: IImportAccountRequest,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    const account: IAccount = await this.client.importAccount(
      accountDetails,
      authToken,
      headers,
    )
    return account.address
  }

  async isRegistered(
    address: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<boolean> {
    try {
      await this.client.getAccount(address, authToken, headers)
      return true
    } catch (_) {
      return false
    }
  }
}
