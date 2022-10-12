export enum WalletRole {
  DEPLOYER = "deployer", // Sign Smart-Contracts deployment transactions
  OWNER = "owner", // Own Smart-Contracts
  CONTROLLER = "controller", // Mint, forceBurn, forceTransfer, put tokens on hold
  HOLDER = "holder", // Hold, Transfer Tokens
  PAYER = "payer", // Hold Currencies, Receive Payments
}
