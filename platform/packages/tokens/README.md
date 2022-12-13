# @consensys/tokens

A package to manage and interact with Ethereum Smart Contracts using @consensys/nestjs-orchestrate. This interface is callable via Kafka messages and API calls.

## Prerequisites

We're assuming all contracts involved here are registered in Orchestrate already under sequential numeric tags (if no "tag" config argument or env variable value is given).

## Usage

### Using convenience classes

There are convenience classes: `ERC20Token`, `ERC721Token` and `ERC1400Token` that can be used to create and/or interact with existing tokens. There are functions to deploy and interact with tokens with specific typed function signatures that are mapping the smart contract functions.
Example of how to deploy an ERC20:


```
// this instantiation should be done via IoC
const erc20 = new ERC20Token(contractManager)
await erc20.create('tokenName', 'TKN', '18', {
  chainId: 'xxx',
  from: 'xxx',
  transactionType: TransactionType.XXXX
})
```

Example of how to transfer an ERC20 token:

```
const erc20 = new ERC20Token(contractManager)
await erc20.transfer('0x111...111', '100', {
  chainId: 'xxx',
  from: 'xxx',
  to: 'xxx',
  transactionType: TransactionType.XXXX
})
```


### TransactionConfig

For all interactions where a transaction is involved, a configuration has to be provided:

```
export interface TransactionConfig {
  from: string
  chainName?: string
  nonce?: string
  to?: string
  gas?: string
  gasPrice?: string
  value?: string
  contractTag?: string
  privateFrom?: string
  privateFor?: string[]
  privacyGroupId?: string
  protocol?: ProtocolType
  transactionType?: TransactionType
}
```

Note that some of the configuration can be overridden by environment variables as described below.

### Transaction types

When performing a deployment or an interaction that involves a transaction with a token, the `TransactionType` configuration.
So far, we support:

* `TransactionType.SendTransaction`: Sends the transaction to the node (Orchestrate) and returns an Orchestrate object containing the uuid.
* `TransactionType.RawTransaction`: Returns the raw transaction that can be signed externally (e.g. hardware wallet).


### Contract calls

Some of the methods in the convenience classes are not involving transactions, but they read from the contract state (`view` or `pure` functions), for example: `ERC20Token.totalSupply` .

To perform those calls, we can use `ContractManager.call`, for example:

```
await contractManager.call('<contract name>', '<function ABI signature>', <params[]>, '<contractAddress>')
```


### ContractManager

```
async exec(contractName: string, functionName: string, config: TransactionConfig, params?: string[]): Promise<string | IRawTransaction>

async deploy(contractName: string, config: TransactionConfig, params?: string[], constructorName?: string): Promise<string | RawTransaction>

async call(contractName: string, config: TransactionConfig, functionName: string, contractAddress: string, params?: string[], ): Promise<any>

```

## Env vars

Optional to override some options (env vars values will have priority over anything else)

* `ORCHESTRATE_URL`
* `BLOCKCHAIN_URL`
* `ORCHESTRATE_CHAIN_NAME`
* `TRANSACTION_GAS`
* `TRANSACTION_GAS_PRICE`
