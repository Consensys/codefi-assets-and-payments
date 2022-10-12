const fs = require('fs-extra');
import { logger } from 'src/logging/logger.ts';

const PATH = './build/contracts/';
const ABIs = ['ERC1400'];

const ENVs = ABIs.map(async (contract) => {
  const json = JSON.parse(await fs.readFile(PATH + contract + '.json', 'utf8'));
  return (
    json.contractName +
    ':' +
    JSON.stringify(json.abi) +
    ':' +
    json.bytecode +
    ':' +
    json.deployedBytecode
  );
});

const env = ENVs.join(' ');

(async () => {
  await fs.writeFile('abi.env', env.replace(/"/g, '\\"'));
  logger.info('The file has been saved!');
})();
