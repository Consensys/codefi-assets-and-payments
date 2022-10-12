import Account from 'web3-eth-accounts/lib';

const accounts = new Account();

if (!process.env.CERTIFICATE_SIGNER_PRIVATE_KEY) {
  throw new Error('missing env variable: CERTIFICATE_SIGNER_PRIVATE_KEY');
}
if (!process.env.HOLD_NOTARY_PRIVATE_KEY) {
  throw new Error('missing env variable: HOLD_NOTARY_PRIVATE_KEY');
}

export const CERTIFICATE_SIGNER_ADDRESS: string = accounts.privateKeyToAccount(
  process.env.CERTIFICATE_SIGNER_PRIVATE_KEY,
).address;
export const HOLD_NOTARY_ADDRESS: string = accounts.privateKeyToAccount(
  process.env.HOLD_NOTARY_PRIVATE_KEY,
).address;
