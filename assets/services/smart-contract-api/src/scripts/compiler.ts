#!/usr/bin/env node

/* eslint-disable */
const program = require('commander');
const fs = require('fs-extra');
const path = require('path');
const solc = require('solc');
const {
  CONTRACTS_DIRECTORY,
  CONTRACTS_TRUFFLE_BUILD_DIRECTORY,
  CONTRACTS_CUSTOM_BUILD_DIRECTORY,
  ALL_CONTRACTS_BUILD_PATH,
} = require('../config/constants');
import { logger } from '../logging/logger';
/* eslint-enable */

program
  .version('0.0.1')
  .description('Compile smart contract')
  .parse(process.argv);

class Compiler {
  compiled;
  constructor() {
    this.compiled = [];
  }

  // get all contracts
  async getAll() {
    // get all solidity contracts ('.sol' files)
    const solidityFiles = await fs.readdir(CONTRACTS_DIRECTORY);
    await Promise.all(
      solidityFiles.map((solidityFile) => {
        // get contract name
        return this.get(solidityFile);
      }),
    );

    // get all json contracts ('.json' files)
    const jsonFiles = await fs.readdir(CONTRACTS_CUSTOM_BUILD_DIRECTORY);
    await Promise.all(
      jsonFiles.map((jsonFile) => {
        // get contract name
        return this.get(path.basename(jsonFile, '.json') + '.sol');
      }),
    );
  }

  // copy Json contracts in build file (for contracts without .sol file)
  async copyAllJsonContracts() {
    const files = await fs.readdir(CONTRACTS_CUSTOM_BUILD_DIRECTORY);
    const response = await Promise.all(
      files.map((file) => {
        return fs.copyFile(
          `${CONTRACTS_CUSTOM_BUILD_DIRECTORY}/${file}`,
          `${CONTRACTS_TRUFFLE_BUILD_DIRECTORY}/${file}`,
        );
      }),
    );
    return response;
  }

  // get contract
  async get(contractFilename) {
    logger.info({}, `Get contract ${contractFilename} bytecode and abi`);

    // Get contract name
    const contractName = path.basename(contractFilename, '.sol');

    // Get json file
    const compiledContract = JSON.parse(
      await fs.readFile(
        `${CONTRACTS_TRUFFLE_BUILD_DIRECTORY}/${contractName}.json`,
        'utf8',
      ),
    );

    // Get abi
    const abi = compiledContract.abi;

    // Get bytecode
    const bytecode = compiledContract.bytecode;

    // Create json contract data
    this.compiled[contractFilename] = {
      contract: contractName,
      file: contractFilename,
      date: new Date(),
      abi: abi,
      bytecode: bytecode,
    };
    // Return compiled contract
    return this.compiled[contractFilename];
  }

  // compile all contracts
  async compileAll() {
    const files = await fs.readdir(CONTRACTS_DIRECTORY);
    await Promise.all(
      files.map(async (file) => {
        // Start compile
        return this.compile(file);
      }),
    );
  }

  // compile get contract abi and bytecode
  async compile(contractFilename) {
    logger.info(
      {},
      `Start generate contract ${contractFilename} bytecode and abi, it takes 5-10 secondes`,
    );
    // Get contract name
    const contractName = path.basename(contractFilename, '.sol');
    // Solc compile
    const input = {
      [contractFilename]: await fs.readFile(
        './contracts/' + contractFilename,
        'utf8',
      ),
    };
    const compiledContract = solc.compile({ sources: input }, 1);
    logger.info({ compiledContract }, `compiled contract: ${contractFilename}`);
    // Get abi
    const abi =
      compiledContract.contracts[contractFilename + ':' + contractName]
        .interface;
    // Get bytecode
    const bytecode =
      '0x' +
      compiledContract.contracts[contractFilename + ':' + contractName]
        .bytecode;

    logger.info({}, `${contractFilename} contract abi and bytecode generated`);
    // Create json contract data
    this.compiled[contractFilename] = {
      contract: contractName,
      file: contractFilename,
      date: new Date(),
      abi: abi,
      bytecode: bytecode,
    };
    // Return compiled contract
    return this.compiled[contractFilename];
  }

  // write all contracts
  async init() {
    const config = {};

    try {
      await fs.writeFile(ALL_CONTRACTS_BUILD_PATH, JSON.stringify(config));

      logger.info(
        {},
        `File ${ALL_CONTRACTS_BUILD_PATH} initialized successfuly`,
      );
    } catch (err) {
      logger.error(
        {
          err,
        },
        'Compiler - could not initialize compiler',
      );
      throw err;
    }
  }

  // write all contracts
  async writeAll() {
    for (const contractFilename of Object.keys(this.compiled)) {
      // Start write
      await this.write(contractFilename);
    }
  }

  // write contract data file
  async write(contractFilename) {
    // Get current contracts
    let config;
    const file = await fs.readFile(ALL_CONTRACTS_BUILD_PATH, 'utf8');
    if (!file) {
      config = {};
    } else {
      config = JSON.parse(file);
    }

    // Update json
    const contractName = this.compiled[contractFilename].contract;
    config[contractName] = this.compiled[contractFilename];

    // Write new file
    await fs.writeFile(ALL_CONTRACTS_BUILD_PATH, JSON.stringify(config));

    logger.info(
      {},
      `${contractName} compiled and saved to ${ALL_CONTRACTS_BUILD_PATH}`,
    );
  }
}

(async () => {
  const compiler = new Compiler();
  await compiler.init();
  await compiler.copyAllJsonContracts();
  await compiler.getAll();
  await compiler.writeAll();
})();
