import Contracts from './contracts';
import CONTRACTS_CONFIG from '../config/contractsConfig';
import registryInstance from './registry';
import { ContractName } from '../types';
import {
  ERC1820_DEPLOYER_ADDRESS,
  ERC1820_RAW_TX,
  ERC1820_ADDRESS,
  ERC1820,
  MINIMUM_ETH_AMOUNT_THRESHOLD,
  ZERO_ADDRESS,
} from '../config/constants';
import { logger } from '../logging/logger';
import execRetry from '../utils/retry';

/**
 * Class for initial contract deployments
 */
class Deployer extends Contracts {
  deployerAddress;
  rawERC1820Tx;
  node;
  account;
  wallet;
  name;
  ace;
  constructor(name, wallet, rpcEndpoint, ace) {
    super(rpcEndpoint);
    this.name = name;
    this.wallet = wallet;
    this.setWallet(wallet);
    this.ace = ace;
  }

  init = async (): Promise<boolean> => {
    try {
      // This is a test to see if the network is reachable
      // If yes, we shall trigger contract deployments
      // If not, we shall skip contract deployments
      const networkOk: boolean = await this.networkCanBeReached();
      if (!networkOk) {
        logger.error(
          {
            name: this.name,
          },
          `Deployer - failed reaching network ${this.name} - skip contract deployments`,
        );
        return false;
      }

      // Deploy ERC1820
      const erc1820deployed = await this.checkERC1820deployed();
      if (erc1820deployed) {
        logger.info(
          {
            name: this.name,
          },
          `Deployer - ERC1820Registry already deployed on network ${this.name} - skipping`,
        );
      } else {
        const deployerFunded = await this.checkDeployerFunded();
        if (!deployerFunded) {
          const faucetFunded = await this.checkFaucetFunded();
          if (faucetFunded) {
            await this.fundERC1820Deployer();
            await this.deployERC1820();
          } else {
            return false;
          }
        } else {
          await this.fundERC1820Deployer();
          await this.deployERC1820();
        }
      }
      this.addContract(ERC1820, ERC1820_ADDRESS);

      // Deploy other contracts (DVP, BatchReader, Validator extension, etc.)
      await this.deployContracts();

      return true;
    } catch (err) {
      logger.error(
        {
          err,
          name: this.name,
        },
        'Deployer - init',
      );
      throw err;
    }
  };

  networkCanBeReached = async (): Promise<boolean> => {
    try {
      const faucetAddress = this.wallet.address;
      const retriedClosure = () => {
        return this.web3.eth.getBalance(faucetAddress);
      };
      await execRetry(retriedClosure, 3, 6000, 1); // Wait for 6s in case of Kaleido rate-limiting
      return true;
    } catch (error) {
      return false;
    }
  };

  checkERC1820deployed = async (): Promise<boolean> => {
    try {
      const retriedClosure = () => {
        return this.web3.eth.getCode(ERC1820_ADDRESS);
      };
      const code = await execRetry(retriedClosure, 3, 6000, 1); // Wait for 6s in case of Kaleido rate-limiting
      if (code === '0x') {
        return false;
      } else {
        return true;
      }
    } catch (err) {
      logger.error(
        {
          err,
          name: this.name,
        },
        `Deployer - checking if ERC1820 is deployed on network ${this.name}`,
      );
      throw err;
    }
  };

  checkFaucetFunded = async (): Promise<boolean> => {
    try {
      const faucetAddress = this.wallet.address;

      const retriedClosure = () => {
        return this.web3.eth.getBalance(faucetAddress);
      };
      const faucetBalance = await execRetry(retriedClosure, 3, 6000, 1); // Wait for 6s in case of Kaleido rate-limiting

      if (faucetBalance < MINIMUM_ETH_AMOUNT_THRESHOLD) {
        logger.error(
          {
            faucetBalance,
            faucetAddress,
            name: this.name,
          },
          `Deployer - Faucet balance is too low on network ${this.name}`,
        );
        return false;
      } else {
        logger.info(
          {
            faucetBalance,
            faucetAddress,
            name: this.name,
          },
          `Deployer - Faucet balance is sufficient on network ${this.name} - ${
            faucetBalance / 10 ** 18
          } >= ${MINIMUM_ETH_AMOUNT_THRESHOLD / 10 ** 18} ETH`,
        );
        return true;
      }
    } catch (err) {
      logger.error(
        {
          err,
          name: this.name,
        },
        `Deployer - checking if faucet is funded on network ${this.name}`,
      );
      throw err;
    }
  };

  checkDeployerFunded = async (): Promise<boolean> => {
    try {
      const retriedClosure = () => {
        return this.web3.eth.getBalance(ERC1820_DEPLOYER_ADDRESS);
      };
      const deployerBalance = await execRetry(retriedClosure, 3, 6000, 1); // Wait for 6s in case of Kaleido rate-limiting

      if (deployerBalance < MINIMUM_ETH_AMOUNT_THRESHOLD) {
        logger.info(
          {
            deployerBalance,
            deployerAddress: ERC1820_DEPLOYER_ADDRESS,
            minBalance: MINIMUM_ETH_AMOUNT_THRESHOLD,
            name: this.name,
          },
          `Deployer - Deployer balance is low on network ${this.name}`,
        );
        return false;
      } else {
        logger.info(
          {
            deployerBalance,
            deployerAddress: ERC1820_DEPLOYER_ADDRESS,
            name: this.name,
          },
          `Deployer - Deployer balance is sufficient on network ${
            this.name
          } - ${deployerBalance / 10 ** 18} >= ${
            MINIMUM_ETH_AMOUNT_THRESHOLD / 10 ** 18
          } ETH`,
        );
        return true;
      }
    } catch (err) {
      logger.error(
        {
          err,
          name: this.name,
        },
        `Deployer - checking if deployer is funded on network ${this.name}`,
      );
      throw err;
    }
  };

  fundERC1820Deployer = async () => {
    try {
      const gasPrice = await this.getGasPrice();

      const txParams = {
        from: this.wallet.address,
        to: ERC1820_DEPLOYER_ADDRESS,
        value: this.web3.utils.toWei(this.web3.utils.toBN(1), 'ether'),
        gas: 6721975,
        gasPrice: this.craftGasPrice(this.name, gasPrice),
      };
      logger.info(
        {
          txParams,
          name: this.name,
        },
        `Deployer - Fund deployer on network ${this.name} - funding from the faucet`,
      );

      const retriedClosure = () => {
        return this.web3.eth.sendTransaction(txParams);
      };
      await execRetry(retriedClosure, 3, 6000, 1); // Wait for 6s in case of Kaleido rate-limiting
    } catch (err) {
      logger.error(
        {
          err,
          name: this.name,
        },
        'Deployer - fundERC1820Deployer',
      );
      throw err;
    }
  };

  deployERC1820 = async () => {
    try {
      logger.info(
        {
          name: this.name,
        },
        `Deployer - deploying ERC1820Registry on network ${this.name}`,
      );

      const retriedClosure = () => {
        return this.web3.eth.sendSignedTransaction(ERC1820_RAW_TX);
      };
      await await execRetry(retriedClosure, 3, 6000, 1); // Wait for 6s in case of Kaleido rate-limiting
    } catch (err) {
      logger.error(
        {
          err,
          name: this.name,
        },
        `Deployer - could not deploy ERC1820 on network ${this.name}`,
      );
      throw err;
    }
  };

  isContractRegistered = async (contractName: ContractName) => {
    try {
      const retriedClosure = () => {
        return this.call(ERC1820, 'getInterfaceImplementer', [
          this.wallet.address,
          this.web3.utils.soliditySha3(contractName),
        ]);
      };

      const registeredAddress = (await execRetry(
        retriedClosure,
        3,
        1500,
        1,
      )) as string;
      if (registeredAddress === ZERO_ADDRESS) {
        return false;
      } else {
        logger.info(
          {
            contractName,
            address: registeredAddress,
            name: this.name,
          },
          `Deployer - contract ${contractName} is deployed and registered on ${this.name} network at address ${registeredAddress}`,
        );
        return true;
      }
    } catch (err) {
      logger.error(
        {
          err,
          name: this.name,
          contractName,
        },
        `Deployer - error checking if contract ${contractName} is already registered`,
      );
      throw err;
    }
  };

  registerContract = async (contractName: ContractName, address: string) => {
    try {
      const tx = this.craft(ERC1820, 'setInterfaceImplementer', [
        this.wallet.address,
        this.web3.utils.soliditySha3(contractName),
        address,
      ]);
      await this.send(tx, 'receipt');
    } catch (err) {
      logger.error(
        {
          err,
          name: this.name,
          contractName,
        },
        `Deployer - could not register contract ${contractName}`,
      );
    }
  };

  deployContract = async (contractName: ContractName, args: any[]) => {
    try {
      const address = await this.deploy(contractName, args);
      this.addContract(contractName, address);
      registryInstance.setAddress(contractName, address);
      await this.registerContract(contractName, address);
      const isRegistered = await this.isContractRegistered(contractName);
      if (isRegistered) {
        logger.info(
          {
            contractName,
            address,
            name: this.name,
          },
          `Deployer - successfully deployed and registered contract ${contractName}`,
        );
      } else {
        throw new Error('Contract is not registered - something went wrong');
      }
    } catch (err) {
      logger.error(
        {
          err,
          name: this.name,
          contractName,
          args,
        },
        `Deployer - could not deploy contract ${contractName}`,
      );
      throw err;
    }
  };

  deployContracts = async () => {
    try {
      const contractNames: string[] = Object.keys(CONTRACTS_CONFIG);

      for (let index = 0; index < contractNames.length; index++) {
        const contractName: ContractName = contractNames[index] as ContractName;
        const contractConfig = CONTRACTS_CONFIG[contractName];
        if (contractConfig.deploy) {
          const isContractRegistered = await this.isContractRegistered(
            contractName,
          );
          if (
            !isContractRegistered ||
            (contractConfig.forceDeploy &&
              (!contractConfig.forceDeployNetwork ||
                contractConfig.forceDeployNetwork === this.name))
          ) {
            let args = contractConfig.args;

            let bypassDeployment;
            if (contractName.endsWith('ACE')) {
              if (this.ace && this.ace !== ZERO_ADDRESS) {
                args = [this.ace];
              } else {
                bypassDeployment = true;
              }
            }

            if (bypassDeployment) {
              logger.info(
                {
                  contractName,
                  name: this.name,
                },
                `Contract ${contractName} could not be deployed on ${this.name} network - missing ACE address`,
              );
            } else {
              await this.deployContract(contractName, args);
            }
          }
        }
      }
    } catch (err) {
      logger.error(
        {
          err,
          name: this.name,
        },
        'Deployer - deployContracts',
      );
      throw err;
    }
  };

  isQuorumNetwork = (name: string) => {
    // We assume Quorum networks include an occurence of 'qbs' in their name
    return name.includes('qbs');
  };

  craftGasPrice = (name: string, gasprice: string) => {
    // Quorum networks only accept transactions with gasPrice set to 0
    return this.isQuorumNetwork(name) ? '0x0' : gasprice;
  };
}

export default Deployer;
