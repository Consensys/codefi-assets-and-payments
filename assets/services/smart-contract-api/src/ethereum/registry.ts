import CONTRACTS_CONFIG from '../config/contractsConfig';

class AddressRegistry {
  addresses;
  constructor() {
    this.addresses = {};
    this.initializeAddresses();
  }

  initializeAddresses() {
    for (const contractName in CONTRACTS_CONFIG) {
      this.addresses[contractName] = CONTRACTS_CONFIG[contractName].address;
    }
  }

  getAddress(contractName) {
    return this.addresses[contractName];
  }

  setAddress(contractName, address) {
    this.addresses[contractName] = address;
  }
}

const registryInstance = new AddressRegistry();

export default registryInstance;
