# Entity API

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Run Locally](#run-locally)
  - [Environment Variables](#environment-variables)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [Load Tests](#load-tests)
- [API Documentation](#api-documentation)

## Overview

Entity API is used to create and manage tenants, entities, and wallets, within Codefi.

These tenants and entities are used by the Codefi APIs to identify the user, and partition data so its access is restricted.

## Getting Started

### Run Locally

 1. Install and run [local-dev-env](https://gitlab.com/ConsenSys/codefi/common/local-dev-env)
 2. Copy `.env.sample` to `.env` and update the values as needed
 3. Start the service: `docker-compose up --build`

### Environment Variables

#### Initial Configuration

| Name | Description |
| ---  | --- |
| PERFORM_INITIAL_CONFIGURATION | Whether to create tenants, entities, and wallets when starting the service. |
| INITIAL_TENANTS_TO_CREATE | A JSON array of tenants to create on startup. |
| INITIAL_ENTITIES_TO_CREATE | A JSON array of entities to create on startup. |
| INITIAL_WALLETS_TO_CREATE | A JSON array of wallets to create on startup. |

#### Store Mappings

| Name | Description |
| ---  | --- |
| STORES | A JSON object containing the supported store IDs and their wallet types. | 
| STORES_FILE | A JSON file containing the supported store IDs and their wallet types. |

#### Recovery Mode

| Name | Description |
| ---  | --- |
| RECOVERY_MODE | Whether to start the service in recovery mode and regenerate the database using Kafka. | 
| RECOVERY_MODE_TIMESTAMP | The Unix time from which to replay Kafka messages, used by the recovery mode.|

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
docker exec entity-api_ms_1 npm run test:integration
```

#### Run specific integration tests:

``` bash
docker exec entity-api_ms_1 npm run test:integration:<TEST-NAME>
```

#### Possible Test Names

- tenant:get
- tenant:create
- tenant:update
- tenant:delete
- tenant-client:get
- tenant-client:create
- entity:get
- entity:create
- entity:update
- entity:delete
- entity-client:get
- entity-client:create
- wallet:get
- wallet:create
- wallet:update
- wallet:delete
- consumer:user-created
- orchestrate:wallet

### Load Tests

Load tests are written using K6 and ran via a Docker container to encapsulate the required dependencies.

#### Run all load tests:

``` bash
npm run test:load
```

#### Run specific load tests:

``` bash
npm run test:load:<TEST-NAME>
```

#### Possible Test Names

- endpoint
- endpoint:tenant:create
- endpoint:tenant:update
- endpoint:tenant:delete
- endpoint:entity:create
- endpoint:entity:update
- endpoint:entity:delete
- endpoint:wallet:create
- endpoint:wallet:update
- endpoint:wallet:delete
- kafka
- kafka:tenant:create
- kafka:tenant:update
- kafka:tenant:delete
- kafka:entity:create
- kafka:entity:update
- kafka:entity:delete
- kafka:wallet:create
- kafka:wallet:update
- kafka:wallet:delete

## API Documentation

- [Postman](https://documenter.getpostman.com/view/19439000/UVkgweHZ)
- [ReDoc](https://convergence-dev.api.codefi.network/entity/documentation)