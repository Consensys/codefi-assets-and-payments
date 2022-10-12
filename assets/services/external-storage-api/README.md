![Codefi](../assets-api/images/Picture1.png)

# External-Storage-API
## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Run Locally](#run-locally)
  - [Environment Variables](#environment-variables)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
  - [Functional Tests](#functional-tests)
- [API Documentation](#api-documentation)

## Overview

External-Storage-API is a micro-service, part of the global Codefi Assets architecture, a technology stack for tokenization of financial assets.

External-Storage-API is a service used to store files on IPFS or AWS.

## Getting Started

### Prerequisites

External-Storage-API needs either a configured S3 bucket or an IPFS provider to run.

### Run Locally

 1. Copy `.env.sample` to `.env` and update the values as needed
 2. Start the service: `docker-compose up --build`

Note that once started the service will not be exposed by default. It will be reachable only through docker compose network. To expose it add a `ports` directive to `assets/services/external-storage-api/docker-compose.yml` file.

### Environment Variables

#### Initial Configuration

| Name | Optional | Description |
| ---  | --- | --- |
| DB_ENABLE | Yes | Choose to enable database usage (Defaults to `true`) |
| DB_HOST | Yes | External-Storage-API Database Host |
| DB_PORT | Yes | External-Storage-API Database Port |
| DB_USERNAME | Yes | External-Storage-API Database Username |
| DB_PASSWORD | Yes | External-Storage-API Database Password |
| DB_DATABASE_NAME | Yes | External-Storage-API Database Name |
| DB_CACHE | Yes | External-Storage-API Database Cache enabled |
| DB_DROP_SCHEMA | Yes | Drop database schema on startup |
| DB_LOGGING | Yes | Enable External-Storage-API Database logging |
| DB_SYNCHRONIZE | Yes | Synchronize External-Storage-API database with models structures |

#### AWS Configuration
| Name | Optional | Description |
| ---  | --- | --- |
| AWS_DEFAULT_REGION | Yes | External-Storage-API Database Host |
| AWS_REGION | Yes | External-Storage-API Database Port |
| AWS_ROLE_ARN | Yes | External-Storage-API Database Username |
| AWS_S3_BUCKET_NAME | Yes | AWS S3 Default bucket name |

#### IPFS Configuration
| Name | Optional | Description |
| ---  | --- | --- |
| IPFS_HOST | Yes | IPFS Provider Host |
| IPFS_PROJECT_ID | Yes | IPFS Project ID |
| IPFS_PROJECT_SECRET | Yes | IPFS Project Secret |

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

## API Documentation

- [Swagger](http://localhost:3002/docs) (once started locally)