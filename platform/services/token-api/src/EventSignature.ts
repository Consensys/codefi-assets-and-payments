export enum EventSignature {
  DEPLOY_ERC20 = 'CodefiERC20Deployed(string,string,uint8)',
  DEPLOY_ERC721 = 'CodefiERC721Deployed(string,string)',
  TRANSFER = 'Transfer(address,address,uint256)',
}
