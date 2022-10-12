import bip39 from 'bip39';
import { hdkey } from 'ethereumjs-wallet';

export const generateAddressesFromSeed = (_seed, _count) => {
  const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(_seed));
  const walletHDpath = "m/44'/60'/0'/0/"; // eslint-disable-line quotes

  const accounts = [];
  for (let i = 0; i < _count; i++) {
    const wallet = hdwallet.derivePath(walletHDpath + i).getWallet();
    const address = `0x${wallet.getAddress().toString('hex')}`;
    const privateKey = wallet.getPrivateKey().toString('hex');
    accounts.push({ address: address, privateKey: privateKey });
  }
  return accounts;
};
