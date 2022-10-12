import {
  createEthService,
  formatAllArgs,
  formatEmptyArgs,
} from '../utils/helper';
import express from 'express';
import Contracts from '../ethereum/contracts';
import { ContractName, EthService } from '../types';
import { SERVICE_TYPE_WEB3 } from '../config/constants';
import { logger } from '../logging/logger';
import extractErrorMessage from '../utils/errorMessage';

const identifierWalletID = 'walletID';

/**
 * ViewRouter class
 */
class ViewRouter {
  router;
  identifierContractAddress;
  identifierSignerAddress;
  constructor() {
    this.router = express.Router();
    this.identifierContractAddress = 'contractAddress';
    this.identifierSignerAddress = 'signerAddress';
  }

  // create View Request
  createViewRequest = (
    contractName: ContractName,
    defaultContractAddress: string,
    element: any,
  ) => {
    this.router.get(
      '/' + contractName + '/' + element.name,
      async (req, res) => {
        let isValid = true;
        let missingParameter;
        const parameters = [];
        const _reqQuery = req.query;
        for (let j = 0; j < element.inputs.length; j++) {
          if (_reqQuery[element.inputs[j].name]) {
            const param = formatAllArgs(_reqQuery[element.inputs[j].name]);
            parameters.push(param);
            if (_reqQuery[element.inputs[j].name] === identifierWalletID) {
              logger.error(
                {},
                'ERROR: CONTRACT FUNCTION PARAMETER NAMING NEEDS TO BE NAMED DIFFERENTLY.',
              );
            }
          } else if (element.inputs[j].name === '') {
            logger.info({}, `Function ${element.name} has empty parameter`);
            parameters.push(formatEmptyArgs(element.inputs[j].type));
          } else {
            logger.info({}, `Missing parameter: ${element.inputs[j].name}`);
            isValid = false;
            missingParameter = element.inputs[j].name;
          }
        }

        let localContractAddress = defaultContractAddress;
        if (_reqQuery[this.identifierContractAddress]) {
          localContractAddress = _reqQuery[this.identifierContractAddress];
        }

        if (!isValid) {
          logger.info(
            {},
            `Error: missing input parameters: ${missingParameter}`,
          );
          res.status(500);
          res.json({
            error: `Error: missing input parameters: ${missingParameter}`,
          });
        } else {
          let ethService: EthService;
          if (_reqQuery.chain) {
            try {
              ethService = createEthService(SERVICE_TYPE_WEB3, _reqQuery.chain);
            } catch (error) {
              res.status(error?.status || 500);
              res.json({ error: extractErrorMessage(error) });
            }
          } else {
            logger.info({}, `missing chain parameter`);
            res.status(500);
            res.json({
              error: `Error: missing chain parameter`,
            });
          }

          const contracts = new Contracts(ethService.data.rpcEndpoint);
          const signerAddress = _reqQuery[this.identifierSignerAddress];
          if (!signerAddress) {
            logger.info({}, `No signer address provided`);
            res.status(500);
            res.json({
              error: `Error: No signer address provided`,
            });
          } else {
            try {
              contracts.addContract(contractName, localContractAddress);
              const transaction = await contracts.craft(
                contractName,
                element.name,
                parameters,
              );
              const response = await transaction.call({
                from: signerAddress,
              });
              res.json(response);
            } catch (err) {
              res.status(err?.status || 500);
              res.json({ error: extractErrorMessage(err) });
            }
          }
        }
      },
    );
  };
}

export default ViewRouter;
