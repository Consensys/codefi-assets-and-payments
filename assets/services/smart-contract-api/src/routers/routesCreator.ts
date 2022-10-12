import fs from 'fs';
import ViewRouters from './viewRouter';
import TransactionRouters from './transactionRouter';
import registryInstance from '../ethereum/registry';
import { logger } from '../logging/logger';

import { ALL_CONTRACTS_BUILD_PATH } from '../config/constants';

/**
 * RoutesCreator class
 */
class RoutesCreator {
  viewRouter;
  transactionRouter;
  identifierWalletID;
  identifierEthValue;
  identifierContractAddress;
  constructor() {
    this.viewRouter = new ViewRouters();
    this.transactionRouter = new TransactionRouters();
    // Forbidden identifier names
    this.identifierWalletID = 'walletID';
    this.identifierEthValue = 'ethValue';
    this.identifierContractAddress = 'contractAddress';
  }

  createContractsRoutes() {
    // Get contract list from contracts.json
    Object.keys(
      JSON.parse(fs.readFileSync(ALL_CONTRACTS_BUILD_PATH, 'utf8')),
    ).forEach((contract) => this.createContractRoutes(contract));
  }

  createContractRoutes(contractName) {
    const contractABI = JSON.parse(
      fs.readFileSync(ALL_CONTRACTS_BUILD_PATH, 'utf8'),
    )[contractName].abi;
    const contractAddress = registryInstance.getAddress(contractName);

    // Create route for each contract's method
    for (let i = 0; i < contractABI.length; i++) {
      const element = contractABI[i];
      if (element.type === 'function') {
        for (let j = 0; j < element.inputs.length; j++) {
          if (element.inputs[j].name === this.identifierWalletID) {
            logger.error(
              {},
              `ERROR: RENAME PARAMETER OF FUNCTION ${element.inputs[j].name}`,
            );
          }
          if (element.inputs[j].name === this.identifierEthValue) {
            logger.error(
              {},
              `ERROR: RENAME PARAMETER OF FUNCTION ${element.inputs[j].name}`,
            );
          }
          if (element.inputs[j].name === this.identifierContractAddress) {
            logger.error(
              {},
              `ERROR: RENAME PARAMETER OF FUNCTION ${element.inputs[j].name}`,
            );
          }
        }

        if (
          element.stateMutability === 'view' ||
          element.stateMutability === 'pure'
        ) {
          this.viewRouter.createViewRequest(
            contractName,
            contractAddress,
            element,
          );
        } else if (
          element.stateMutability === 'nonpayable' ||
          element.stateMutability === 'payable'
        ) {
          this.transactionRouter.createTransactionRequest(
            contractName,
            contractAddress,
            element,
            // element.stateMutability === 'payable',
          ); // eslint-disable-line max-len
        } else {
          logger.info({}, 'ERROR: UNKNOWN FUNCTION TYPE.');
        }
      }
    }
  }

  registerRouters(app) {
    app.use('/call', this.viewRouter.router);
    app.use('/transaction', this.transactionRouter.router);
  }
}

export default RoutesCreator;
