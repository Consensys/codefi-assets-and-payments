export enum keys {
  DEPLOYMENT_ADDRESS = 'address',
  DEPLOYMENT_CHAIN_ID = 'chainId',
}

export interface Deployment {
  [keys.DEPLOYMENT_ADDRESS]: string;
  [keys.DEPLOYMENT_CHAIN_ID]: string;
}

export const DeploymentExample: Deployment = {
  [keys.DEPLOYMENT_ADDRESS]: '0xd200b5d89f719473573be585eadedc8c916e5515',
  [keys.DEPLOYMENT_CHAIN_ID]: '1',
};
