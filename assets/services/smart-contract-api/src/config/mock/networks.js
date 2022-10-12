module.exports = {
  "networks": [
    {
      "tenantId": "codefi",
      "name": "Rinkeby Testnet",
      "key": "rinkeby",
      "chainId": "4",
      "type": "poa",
      "urls": ["https://rinkeby.infura.io/v3/" + process.env.INFURA_KEY],
      "description": "Rinkeby, the public Geth-only PoA testnet",
      "ethRequired": true,
      "kaleido": false,
      "ace": "0x6f143F72f1214ade68d2edC7aC8fE876C8f86B7C",
      "symbol": "ETH",
      "faucetMinEthValue": "300000000000000000"
    }
  ]
};
