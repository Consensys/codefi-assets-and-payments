# METADATA-API
## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Run Locally](#run-locally)
  - [Migrations](#migrations)
  - [Environment Variables](#environment-variables)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
  - [Functional Tests](#functional-tests)
  - [Coverage](#coverage)
- [API Documentation](#api-documentation)

## Overview

METADATA-API is a micro-service, part of the global Codefi Assets architecture, a technology stack for tokenization of financial assets.

Basically, METADATA-API is a module to run CRUD operations for Tokens (Along with Asset templates), App configuration (logo, colors...), Mailing Configuration...
It allows:

- Admin to define their AssetTemplate (set of AssetElements that will be requested from the issuers or asset creation), during their asset creation flow.
- Update the Mailing configuration (body text, colors, logo).
- Update UI and Application config (logo, colors, default network...).

## Getting Started

### Run Locally

 1. Copy `.env.sample` to `.env` and update the values as needed
 2. Start the service: `docker-compose up --build`

Note that once started the service will not be exposed by default. It will be reachable only through docker compose network. To expose it add a `ports` directive to `assets/services/metadata-api/docker-compose.yml` file.

### Migrations

Everytime a database model is updated, a migration needs to be performed.

This can be done by generating a new migration file in [/src/migrations](./src/migrations) folder, thanks to the following command:

````
npm run typeorm:create NameOfTheMigration

Then, complete the file with required migration commands.

Play last migration with following command:
npm run typeorm migration:run

Revert last migration with following command:
npm run typeorm migration:revert
````

### Environment Variables

#### General

| Name | Description |
| ---  | --- |
| PORT | Port on which servise run |
| LOG_LEVEL |Log level override, default is `ebug |
| DEFAULT_INITIALIZATION_TENANT_ID | Set initial tenant id (default tenant id is codefi) |

#### Initial Configuration

| Name | Optional | Description |
| ---  | --- | --- |
| POSTGRES_HOST | False | METADATA-API Database Host |
| POSTGRES_USER | False | METADATA-API Database Username |
| POSTGRES_PASSWORD | False | METADATA-API Database Password |
| POSTGRES_DB | False | METADATA-API Database Name |
| POSTGRES_PORT | False | METADATA-API Database Port |

## Tests

### Unit Tests

#### Run all unit tests:

``` bash
npm test:unit
```

## Functional Tests
#### Run all functional tests:

``` bash
npm run test:functional
```

### Coverage

To get the test coverage from both functional and unit tests combined run the below script:

```sh
npm run test:cov
```

## API Documentation

- [Swagger](http://localhost:7777/docs) (once started locally)
