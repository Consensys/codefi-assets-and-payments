import ethjs from 'ethereumjs-wallet';

import orchestrateInstance from '../orchestrate';
import { SERVICE_TYPE_ORCHESTRATE } from '../config/constants';
import { EthServiceType } from '../types';

class Wallet {
  ethService;
  address;
  wallet;
  privateKey;
  account;

  async create(
    ethServiceType: EthServiceType,
    forceTenantId: string,
    chain: string,
    storeId: string,
    authToken: string,
  ) {
    if (ethServiceType === SERVICE_TYPE_ORCHESTRATE) {
      this.address = await orchestrateInstance.generateAccount(
        forceTenantId,
        chain,
        storeId,
        authToken,
      );
    } else {
      this.wallet = ethjs.generate();
      this.address = this.wallet.getChecksumAddressString();
      this.privateKey = this.wallet.getPrivateKeyString().split('0x')[1];
    }
    return this.address;
  }

  async retrieve(address: string) {
    this.account = await orchestrateInstance.retrieveAccount(address);
    return this.account;
  }
}

export default Wallet;
