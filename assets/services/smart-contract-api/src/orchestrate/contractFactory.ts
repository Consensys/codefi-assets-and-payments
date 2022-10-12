import fs from 'fs';
import { IRegisterContractRequest } from 'pegasys-orchestrate';

import {
  CONTRACTS_DIRECTORY,
  CONTRACTS_TRUFFLE_BUILD_DIRECTORY,
  CONTRACTS_CUSTOM_BUILD_DIRECTORY,
} from '../config/constants';
import { logger } from '../logging/logger';
import path from 'path';

const contractFactory = ({ contractName, path }): IRegisterContractRequest => {
  const contractInterface = JSON.parse(fs.readFileSync(path).toString());
  if (
    !(
      contractInterface &&
      contractInterface.contractName &&
      contractInterface.compiler &&
      contractInterface.compiler.version &&
      contractInterface.bytecode &&
      contractInterface.deployedBytecode &&
      contractInterface.abi
    )
  ) {
    throw new Error(
      `Invalid json format for contract ${contractName} - Can not be added to Orchestrate contract registry`,
    );
  }
  const contractToRegister: IRegisterContractRequest = {
    name: contractName,
    // tag: [optional],
    abi: contractInterface.abi,
    bytecode: contractInterface.bytecode,
    deployedBytecode: contractInterface.deployedBytecode,
    // authToken: [optional],
  };
  return contractToRegister;
};

const buildInterfacePaths = (): {
  contractName: string;
  path: string;
}[] => {
  const standardContractFileNames = fs.readdirSync(CONTRACTS_DIRECTORY);
  const standardInterfacePaths = standardContractFileNames.map((fileName) => {
    const contractName = fileName.split('.sol')[0];
    return {
      contractName,
      path: `${CONTRACTS_TRUFFLE_BUILD_DIRECTORY}/${contractName}.json`,
    };
  });
  const customContractFileNames = fs.readdirSync(
    CONTRACTS_CUSTOM_BUILD_DIRECTORY,
  );
  const customInterfacePaths = customContractFileNames.map((fileName) => ({
    contractName: fileName.split('.json')[0],
    path: `${CONTRACTS_CUSTOM_BUILD_DIRECTORY}/${fileName}`,
  }));
  return [...standardInterfacePaths, ...customInterfacePaths];
};

const contractInterfacesFactory = (): IRegisterContractRequest[] => {
  try {
    const interfacePaths: {
      contractName: string;
      path: string;
    }[] = buildInterfacePaths();

    return interfacePaths.map(
      (interfacePath: { contractName: string; path: string }) =>
        contractFactory(interfacePath),
    );
  } catch (err) {
    logger.error(
      {
        err,
      },
      'Orchestrate - could not build contract objects',
    );
    throw err;
  }
};

export default contractInterfacesFactory;
