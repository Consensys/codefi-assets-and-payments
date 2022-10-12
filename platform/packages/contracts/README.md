# Loading Codefi Smart Contracts into PegaSys Orchestrate v2

This repo is a fork of [PegaSys Quickstart](https://gitlab.com/ConsenSys/client/fr/core-stack/quick-start) and is used to compile Custom Smart Contracts into bytecode, before uploading them to Orchestrate's ABI Contract Registry in the Codefi Clusters. 

## Requirements to run Locally

- Have [`docker`](https://www.docker.com/) and [`docker-compose`](https://docs.docker.com/compose/install/) installed
- Have [`node` and `npm`](https://nodejs.org/en/) installed

## Setup for Orchestrate

### Configure the ENV variables

Create a `.env` file based on the file `.env.sample`

#### Set the variables to pull the Orchestrate image

> _Note_: If running Orchestrate for the 1st you will first need to login on Orchestrate Docker registry, base on the information provide by the Orchestrate team

```
docker login -u <username> -p <password or API key> consensys-docker-pegasys-orchestrate.bintray.io
```

```.env
# Docker image and version
DOCKER_REGISTRY=<DOCKER_REGISTRY>
ORCHESTRATE_VERSION=<ORCHESTRATE_VERSION>
```

## Start Orchestrate

Run the following command:

```
make up
```

> Run `make down` to kill all containers

This will:

- start the dependencies (Kafka, Redis, Postgres, etc.). See `scripts/deps/docker-compose.yml`)
- Create the Kafka topics with default names (see `scripts/kafka/initTopics.sh`)
- Start Orchestrate Microservices

## Register all Contracts

- Create the contract `./contracts` and add tests into `./test` folder.
- Include the name of contracts to be registered  into `contractsToRegister.ts`

Run the following command to compile and test your contract:

```bash
# Compile
npm run compile

# Test
npm run test

# Coverage
npm run test:cov
```

Register all contracts specified on `contrasToRegister.ts`

```bash
npm run register:all
```

> To register the contracts directly into the cluster, you have to port forward: 

```bash
# Open a port that connects to the api-contract-registry in your cluster
kubectl port-forward -n orchestrate $(kubectl get pods -lapp.kubernetes.io/instance=api-contract-registry -n orchestrate  -o json | jq -r '.items[].metadata.name') 8020:8020
```



## Manipulate the PegaSys Orchestrate CLI

Run the following command:

```bash
npm install
```

### List of commands of PegaSys Orchestrate CLI

Run the following command:

```bash
npm run orchestrate help
```

To access details of each command:

```bash
npm run orchestrate [cmd] help
```

> Example: `npm run orchestrate contracts help`

> To ease the use of this Quick start, some shortcut commands have been defined and can be seen in the `package.json` file.

### Account generator

To generate an Ethereum account, run the following command:

```bash
npm run generate-account
```

> See the `package.json` for reference

Save the address of the generated account for the next step.

### Registering a new chain and a faucet in the chain registry

#### Set Ethereum client endpoints

For the quickstart we will connect to Rinkeby through Infura

- Replace the <INFURA_KEY> placeholders with your Infura key below:

```.env
CHAIN_DATA={"name":"rinkeby","urls":["https://rinkeby.infura.io/v3/<INFURA_KEY>"]}
```

- _When creating new Ethereum accounts, they won't have any ETH if not funded and they won't be able to send transactions as they need a minimum of ETH to be able to pay for transaction fees_. In order to add a new faucet to the chain registry, you will need an account that holds some ETH on the Rinkeby testnet. Add the address of the generated account to the `.env` file and make sure you send some ETH to it (you can use MetaMask do that that):

```.env
FAUCET_ACCOUNT=<FAUCET_ACCOUNT>
```

To add a new chain to the chain registry and start listening to transactions coming from that chain, run the following command:

```bash
npm run register-chain
```

by doing that, we connect Orchestrate to the Rinkeby tesnet though Infura and register a new faucet.

> Have a look at the script `src/register-chain/register.ts` for reference

### Smart Contract management

Use Truffle (already installed) to compile your smart contracts into the `build` folder:

```bash
npm run compile
```

Register the generated artifacts into Orchestrate:

```bash
npm run register-contract
```

Verify that the contract has been successfully registered:

```bash
npm run get-catalog
```

You can also get the full details of the registered contract:

```bash
npm run get-contract
```

## Manipulate the SDK

### Register a new account for transactions

Generate a new account that will be used to send transactions by running the following command:

```bash
npm run generate-account
```

and add the address to the `.env` file:

```.env
ETH_ACCOUNT=<ETHEREUM_ACCOUNT_ADDRESS>
```

> We don't reuse the same address as the faucet address to showcase that the newly created account will be funded automatically.

### Consuming transaction messages

_PegaSys is a transaction orchestrator. Transactions on Ethereum being asynchronous, you will receive the result of a transaction by consuming messages coming from Orchestrate._

To do so, open two tabs on your terminal. In one tab we will consume messages and check the transaction receipt. On the other, we will send transactions. On the first tab, run:

```bash
npm run consume
```

### Deploying a contract

We will deploy a contract on the Rinkeby testnet. On the second tab, run:

> Have a look at the script `src/deploy-contract/deploy.ts` for reference

```bash
npm run deploy
```

Verify in the first tab that you received the message successfully and copy-paste the value of the `contractAddress` in the `.env` file:

```.env
COUNTER_CONTRACT_ADDRESS=<COUNTER_CONTRACT_ADDRESS>
```

### Sending a transaction

We will now send a transaction to the `Counter` contract we just deployed to increment the counter by 1.

> Have a look at the script `src/send-tx/send-tx.ts` for reference

```bash
npm run send-tx
```

Check the receipt in the first tab.

## Inspect Accounts stored in Hashicorp Vault

1. You can inspect Ethereum accounts that have been stored in Hashicorp Vault by running

```bash
make hashicorp-accounts
```

That will return list of addresses

```bash
Keys
----
0x05a34cE77Ea9fc49E4E5C7c4bC0E9aB2447AB6f0
0x67689FDDecD92938932B21D566D089cc45A62769
0x7E654d251Da770A068413677967F6d3Ea2FeA9E4
```

2. You can run any hashicorp Vault CLI command (c.f. https://www.vaultproject.io/docs/commands/) by running

```bash
make hashicorp-vault COMMAND="<command>"
```

For example

```bash
make hashicorp-vault COMMAND="token lookup"
Key                 Value
---                 -----
accessor            ZxDozUcdrwEFENpialO3AvWi
creation_time       1578672722
creation_ttl        0s
display_name        root
entity_id           n/a
expire_time         <nil>
explicit_max_ttl    0s
id                  s.LjlIldnulzUvUgZpVnrPy6Qb
meta                <nil>
num_uses            0
orphan              true
path                auth/token/root
policies            [root]
ttl                 0s
type                service
```
