# Token API

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Run Locally](#run-locally)
  - [Environment Variables](#environment-variables)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
- [API Documentation](#api-documentation)

## Overview

Token API is used to create and manage confidential and non-confidential tokens on Ethereum blockchains using an event-based architecture.

## Getting Started

### Run Locally

 1. Install and run [local-dev-env](https://gitlab.com/ConsenSys/codefi/common/local-dev-env)
 2. Copy `.env.sample` to `.env` and update the values as needed
 3. Start the service: `docker-compose up --build`

### Environment Variables

#### Initial Configuration

| Name | Description |
| ---  | --- |
| PERFORM_INITIAL_CONFIGURATION | Whether to register contracts when starting the service. |
| CONTRACTS_TO_REGISTER | A JSON array of contracts to register on startup. |

#### Recovery Mode

| Name | Description |
| ---  | --- |
| RECOVERY_MODE | Whether to start the service in recovery mode and regenerate the database using the blockchain. | 
| RECOVERY_MODE_BATCH_SIZE | How many event logs to process at a time. |
| RECOVERY_MODE_TIMEOUT_LOGS | How long to wait (in milliseconds) between retrieving event logs. |
| RECOVERY_MODE_TIMEOUT_TRANSACTION | How long to wait (in milliseconds) between retrieving transaction receipts. |

## Tests
### Unit Tests

#### Run all unit tests:

``` bash
npm test
```

#### Run all unit tests and calculate coverage:

``` bash
npm run test:cov
```

### Integration Tests

Integration tests are written in Jest and require a running instance of the service.

#### Run all integration tests:

``` bash
docker exec token-api_token-api_1 npm run test:integration
```

#### Run specific integration tests:

``` bash
docker exec token-api_token-api_1 npm run <TEST-NAME>
```

#### Possible Test Names

- operations:get
- tokens:get
- tokens:erc20:burn
- tokens:erc20:deploy
- tokens:erc20:register
- tokens:erc20:mint
- tokens:erc20:transfer
- tokens:erc20:exec
- tokens:erc721:deploy
- tokens:erc721:register
- tokens:erc721:mint
- tokens:erc721:burn
- tokens:erc721:transfer
- tokens:erc721:exec
- tokens:erc721:set-token-uri

## API Documentation

- [Postman](https://documenter.getpostman.com/view/5733481/UV5XiHtZ)
- [ReDoc](https://convergence-dev.api.codefi.network/token/documentation)