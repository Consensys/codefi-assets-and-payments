![Codefi](../assets-api/images/Picture1.png)

# External-Identity-API
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

External-Identity-API is a micro-service, part of the global Codefi Assets architecture, a technology stack for tokenization of financial assets.

External-Identity-API is a service that can be used to verify user identities and documents. The service uses OnFido as third party verification provider.

## Getting Started

### Prerequisites

External-Identity-API needs an Onfido API Key to run, in order to send verification requests to the provider. You can also use a Sandbox API Key.

Once you have your OnFido API Key (along with Domain Name and Webhook Token), you can fill the respective [environment variables](#environment-variables)

### Run Locally

 1. Copy `.env.sample` to `.env` and update the values as needed
 2. Start the service: `docker-compose up --build`

Note that once started the service will not be exposed by default. It will be reachable only through docker compose network. To expose it add a `ports` directive to `assets/services/external-identity-api/docker-compose.yml` file.

### Environment Variables

#### **Database**

| Name | Optional | Description |
| ---  | --- | --- |
| DB_ENABLE | No | Choose to enable database usage (Defaults to `true`) |
| DB_HOST | No | External-Identity-API Database Host |
| DB_PORT | No | External-Identity-API Database Port |
| DB_USERNAME | No | External-Identity-API Database Username |
| DB_PASSWORD | No | External-Identity-API Database Password |
| DB_DATABASE_NAME | No | External-Identity-API Database Name |
| DB_CACHE | No | External-Identity-API Database Cache enabled |
| DB_DROP_SCHEMA | No | Drop database schema on startup |
| DB_LOGGING | No | Enable External-Identity-API Database logging |
| DB_SYNCHRONIZE | No | Synchronize External-Identity-API database with models structures |

#### **OnFido**
| Name | Optional | Description |
| ---  | --- | --- |
| ONFIDO_API_TOKEN | No | OnFido API Token |
| DOMAIN_NAME | No | OnFido Account domain name |
| ONFIDO_WEBHOOK_TOKEN | No | OnFido configured webhook token |

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