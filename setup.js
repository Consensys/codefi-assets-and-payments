'use strict';
const { createReadStream, createWriteStream } = require('fs');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');

const servicePaths = [
  '',
  'platform/services/entity-api/',
  'platform/services/token-api/',
  'platform/services/admin-api/',
  'platform/services/mailing-api/',
  'platform/tools/local-dev-env/',
  'assets/services/assets-api/',
  'assets/services/assets-front/',
  'assets/services/cofidocs-api/',
  'assets/services/external-identity-api/',
  'assets/services/external-storage-api/',
  'assets/services/i18n-api/',
  'assets/services/kyc-api/',
  'assets/services/metadata-api/',
  'assets/services/smart-contract-api/',
  'assets/services/workflow-api/',
];

async function run() {
  for (const path of servicePaths) {
    const transform = new Transform({
      transform(chunk, encoding, callback) {
        const inputData = chunk.toString();
        const outputData = inputData;
        callback(null, outputData);
      }
    })
    try {
      await pipeline(
        createReadStream(`${path}.env.sample`),
        transform,
        createWriteStream(`${path}.env`, { flags: "w" }),
      )
      console.log(`Success with file ${path}.env`)
    } catch (error) {
      console.error(`Error with file ${path}.env - ${error.code}`)
      transform.destroy()
    }
  }
}

run().catch(console.error)
