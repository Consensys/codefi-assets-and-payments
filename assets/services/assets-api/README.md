![Codefi](images/Picture1.png)

# Assets-API

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

Assets-API is a micro-service, part of the global Codefi Assets architecture, a technology stack for tokenization of financial assets.

Basically, Assets-API is the only module which dialogs with the UI. It's purpose is to:

- Aggregate data from all different micro-services, prepare it, and return it to the UI
- Act as a business workflow middleware (state machine based on workflows and states provided by Api-Process) to make sure actions requested by the UI are authorized
- Act as an IAM middleware (based on user and token data provided by Metadata-API) to make sure actions requested by the UI are authorized

## Getting Started

### Prerequisites

As Assets-API aggregates data from all the underlying non-exposed Assets stack services,
you will need to configure and run all the services located in `assets/services` folder, with the exception of `assets/services/assets-front`.

When running Assets-API locally, you will find all the environment variables already configured to connect to local underlying services using the docker compose network. Alternatively, you can change those addresses to connect to remote services instead of local ones.

### Run Locally

1.  Copy `.env.sample` to `.env` and update the values as needed
2.  Start the service: `docker-compose up --build`

### Environment Variables

#### Initial Configuration

| Name                                     | Optional | Description                                                                               |
| ---------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| APP_URL                                  | No       | Assets-API own address                                                                    |
| API_SECRET                               | No       | Secret used to connect to internal Assets services                                        |
| FORCE_CALLBACK_URL                       | No       | Address Smart-Contract-API will send callback to when a transaction is validated or fails |
| SUPERADMIN_EMAIL                         | No       | Assets superadmin email address                                                           |
| FUNDER_ADDRESS                           | No       | Transaction signer wallet public address                                                  |
| CERTIFICATE_SIGNER_PRIVATE_KEY           | No       | Wallet private key used to sign any kind of action for ERC1400CertificateNonce tokens     |
| HOLD_NOTARY_PRIVATE_KEY                  | No       | Wallet private key used as Hold Notary for HTLC transactions                              |
| HTLC_SECRET_ENCRYPTION_KEY               | No       | AES encryption key used to encrypt HTLC secret                                            |
| DEFAULT_CONFIG                           | No       | Default tenant config (eg. "codefi")                                                      |
| DEFAULT_INITIALIZATION_TENANT_ID         | Yes      | Assets-API own address                                                                    |
| DEFAULT_KYC_TEMPLATE_NAME                | No       | Default KYC template name (should exists in KYC-API)                                      |
| DEFAULT_DOCUSIGN_ID                      | No       | Default user DocuSign id used to sign documents                                           |
| DEFAULT_PASSWORD                         | Yes      | Password used to create tenant initial users                                              |
| EXPORT_DOCS                              | Yes      | Export API specs JSON (default to false)                                                  |
| ADMIN_API                                | No       | Admin-API address                                                                         |
| SMART_CONTRACT_API                       | No       | Smart-Contract-API address                                                                |
| METADATA_API                             | No       | Assets-API address                                                                        |
| KYC_API                                  | No       | KYC-API address                                                                           |
| WORKFLOW_API                             | No       | Workflow-API address                                                                      |
| COFI_DOCS_API                            | No       | Cofidocs-API address                                                                      |
| MAILING_API_HOST                         | No       | Mailing-API address                                                                       |
| EXTERNAL_IDENTITY_API                    | No       | External-Identity-API address                                                             |
| LEGAL_API                                | No       | Legal-API address                                                                         |
| ENTITY_API                               | No       | Entity-API address                                                                        |
| ENABLE_PLATFORM_ACCESS_FOR_NEW_INVESTORS | Yes      | Require investors to be invited (default to false)                                        |
| ENABLE_PLATFORM_ACCESS_FOR_NEW_ISSUERS   | No       | Require issuers to be invited (default to false)                                          |
| REDIS_HOST                               | No       | Redis Cache host address                                                                  |
| REDIS_PASS                               | Yes      | Redis Cache password (if needed)                                                          |
| AUTH0_URL                                | No       | Entity-API address                                                                        |
| AUTH_ACCEPTED_AUDIENCE                   | No       | Accepted Auth0 Audience for access tokens                                                 |
| AUTH_CUSTOM_NAMESPACE                    | No       | Auth0 custom namespace                                                                    |
| M2M_TOKEN_REDIS_ENABLE                   | Yes      | Enable M2M tokens caching (default to true)                                               |
| M2M_TOKEN_REDIS_HOST                     | Yes      | Redis Host used to cache M2M tokens                                                       |
| M2M_TOKEN_REDIS_PASS                     | Yes      | Redis Pass used to cache M2M tokens                                                       |
| M2M_TOKEN_CLIENT_ID                      | No       | Codefi M2M Client ID used to connect to other Codefi apps                                 |
| M2M_TOKEN_CLIENT_SECRET                  | No       | Codefi M2M Client Secret                                                                  |
| M2M_TOKEN_AUDIENCE                       | No       | Codefi M2M Client Audience                                                                |
| M2M_TOKEN_ADMIN_CLIENT_ID                | No       | Admin-API M2M Client ID                                                                   |
| M2M_TOKEN_ADMIN_CLIENT_SECRET            | No       | Admin-API M2M Client Secret                                                               |
| M2M_TOKEN_ADMIN_AUDIENCE                 | No       | Admin-API M2M Client Audience                                                             |
| MAIL_TEMPLATE_ID                         | No       | Mailjet User mail template                                                                |
| MAIL_ADMIN_TEMPLATE_ID                   | No       | Mailjet Admin mail template                                                               |

## Tests

### Unit Tests

#### Run all unit tests:

```bash
npm test
```

## Functional Tests

#### Run all functional tests:

```bash
npm run test:functional
```

\*For more detailed info about our test structure, see [test/README.md](test/README.md) file.

## API Documentation

- [Postman](https://www.postman.com/codefi/workspace/codefi-assets-s-public-workspace)
- [Swagger](http://localhost:3002/docs) (once started locally)
