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

| Name                                     | Optional | Description                                                                                     |
| ---------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| APP_URL                                  | No       | Assets-API own address                                                                          |
| API_SECRET                               | No       | Secret used to connect to internal Assets services                                              |
| FORCE_CALLBACK_URL                       | No       | Address Smart-Contract-API will send callback to when a transaction is validated or fails       |
| SUPERADMIN_EMAIL                         | No       | Assets superadmin email address. This is used to create a superadmin account at Tenant creation |
| FUNDER_ADDRESS                           | No       | Transaction signer wallet public address                                                        |
| CERTIFICATE_SIGNER_PRIVATE_KEY           | No       | Wallet private key used to sign any kind of action for ERC1400CertificateNonce tokens           |
| HOLD_NOTARY_PRIVATE_KEY                  | No       | Wallet private key used as Hold Notary for HTLC transactions                                    |
| HTLC_SECRET_ENCRYPTION_KEY               | No       | AES encryption key used to encrypt HTLC secret                                                  |
| DEFAULT_CONFIG                           | No       | Default tenant config (eg. "codefi")                                                            |
| DEFAULT_INITIALIZATION_TENANT_ID         | Yes      | Assets-API own address                                                                          |
| DEFAULT_KYC_TEMPLATE_NAME                | No       | Default KYC template name (should exists in KYC-API)                                            |
| DEFAULT_DOCUSIGN_ID                      | No       | Default user DocuSign id used to sign documents                                                 |
| DEFAULT_PASSWORD                         | Yes      | Password used to create tenant initial users                                                    |
| EXPORT_DOCS                              | Yes      | Export API specs JSON (default to false)                                                        |
| ADMIN_API                                | No       | Admin-API address                                                                               |
| SMART_CONTRACT_API                       | No       | Smart-Contract-API address                                                                      |
| METADATA_API                             | No       | Assets-API address                                                                              |
| KYC_API                                  | No       | KYC-API address                                                                                 |
| WORKFLOW_API                             | No       | Workflow-API address                                                                            |
| COFI_DOCS_API                            | No       | Cofidocs-API address                                                                            |
| MAILING_API_HOST                         | No       | Mailing-API address                                                                             |
| EXTERNAL_IDENTITY_API                    | No       | External-Identity-API address                                                                   |
| LEGAL_API                                | No       | Legal-API address                                                                               |
| ENTITY_API                               | No       | Entity-API address                                                                              |
| ENABLE_PLATFORM_ACCESS_FOR_NEW_INVESTORS | Yes      | Require investors to be invited (default to false)                                              |
| ENABLE_PLATFORM_ACCESS_FOR_NEW_ISSUERS   | No       | Require issuers to be invited (default to false)                                                |
| REDIS_HOST                               | No       | Redis Cache host address                                                                        |
| REDIS_PASS                               | Yes      | Redis Cache password (if needed)                                                                |
| AUTH0_URL                                | No       | Entity-API address                                                                              |
| AUTH_ACCEPTED_AUDIENCE                   | No       | Accepted Auth0 Audience for access tokens                                                       |
| AUTH_CUSTOM_NAMESPACE                    | No       | Auth0 custom namespace                                                                          |
| M2M_TOKEN_REDIS_ENABLE                   | Yes      | Enable M2M tokens caching (default to true)                                                     |
| M2M_TOKEN_REDIS_HOST                     | Yes      | Redis Host used to cache M2M tokens                                                             |
| M2M_TOKEN_REDIS_PASS                     | Yes      | Redis Pass used to cache M2M tokens                                                             |
| M2M_TOKEN_CLIENT_ID                      | No       | Codefi M2M Client ID used to connect to other Codefi apps                                       |
| M2M_TOKEN_CLIENT_SECRET                  | No       | Codefi M2M Client Secret                                                                        |
| M2M_TOKEN_AUDIENCE                       | No       | Codefi M2M Client Audience                                                                      |
| M2M_TOKEN_ADMIN_CLIENT_ID                | No       | Admin-API M2M Client ID                                                                         |
| M2M_TOKEN_ADMIN_CLIENT_SECRET            | No       | Admin-API M2M Client Secret                                                                     |
| M2M_TOKEN_ADMIN_AUDIENCE                 | No       | Admin-API M2M Client Audience                                                                   |
| MAIL_TEMPLATE_ID                         | No       | Mailjet User mail template                                                                      |
| MAIL_ADMIN_TEMPLATE_ID                   | No       | Mailjet Admin mail template                                                                     |

#### Notes on some Env variables

##### FUNDER_ADDRESS

Every time Smart-Contract-Api is called, either to make a call (read operation) or send a transaction (write operation), a “signerAddress” needs to be provided to Smart-Contract-Api. The reason why the “signerAddress” is also required for calls, is because it impacts the value of “msg.sender”, which can potentially be used in some view functions. Example of view function where msg.sender has an impact on the result: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol#L51
Even for view functions where “msg.sender” has no impact on the result, we have to pass a value for signerAddress when calling Smart-Contrat-Api. We use FUNDER_ADDRESS env variable for it. FUNDER_ADDRESS’s value historically corresponds to Smart-Contract-Api’s faucetMnemonic address even though we could in theory use any Ethereum address and it would still work.

##### CERTIFICATE_SIGNER_PRIVATE_KEY

All hybrid tokens have a certificate extension that can be activated (by setting “certificateType” to “NONCE” or “SALT” when creating a hybrid token). Once the certificate extension is activated, no write operation (mint/transfer/burn) can be done without a certificate signed by CERTIFICATE_SIGNER_PRIVATE_KEY injected in function’s last parameter (parameter is either called “data” or “operatorData” depending on the function - mint/transfer/burn - that is called). Example of transfer function where certificate can passed in the “data” parameter: https://github.com/ConsenSys/UniversalToken/blob/master/contracts/ERC1400.sol#L378
The certificate signer private key is owned by Assets-Api, which means no token operation - mint/transfer/burn can be done without Assets-Api. This provides the asset issuer with strong control over issued assets, which is important for centralised use cases (CeFi).
If the hybrid token is required for more decentralised use cases (DeFi), the certificate extension shall be disabled. This provides token holders with the possibility to transfer their assets with but potentially also without having to use Assets-Api.

##### HOLD_NOTARY_PRIVATE_KEY

The hold feature allows to “freeze” an amount of tokens on a user’s account, by specifying the recipient they are destined to. This is particularly helpful in DVP use cases, where we don’t want the user’s balance to be updated before the DVP get executed, but at the same time, we don’t want the user to spend his tokens for something else, because it would lead to DVP failure.
When a hold is created, there are 2 ways to execute it and “unfreeze” the tokens: either by providing the HTLC secret of the hold, or by being the notary of the hold.
Assets-Api only uses HTLC secret to execute holds. Since the notary address is not used, it could in theory be the zero address, but the smart contract implementation doesn’t allow it.
Consequently, we pass a notary address (derived from HOLD_NOTARY_PRIVATE_KEY) even though it is never used to execute the holds.

###### HTLC_SECRET_ENCRYPTION_KEY

The hold feature allows to “freeze” an amount of tokens on a user’s account, by specifying the recipient they are destined to. This is particularly helpful in DVP use cases, where we don’t want the user’s balance to be updated before the DVP get executed, but at the same time, we don’t want the user to spend his tokens for something else, because it would lead to DVP failure.
When a hold is created, there are 2 ways to execute it and “unfreeze” the tokens: either by providing the HTLC secret of the hold, or by being the notary of the hold.
A new HTLC secret is randomly generated every time a hold is created. As we don’t want to store the raw HTLC secret in the DB, It is encrypted with HTLC_SECRET_ENCRYPTION_KEY before being stored in the DB.

##### DEFAULT_DOCUSIGN_ID

Value is not needed anymore as the DocuSign integration’s been deprecated.
When value is specified, it currently gets stored in “user.data.docuSignId” when a new user is being created, even though the value is not used anymore.

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
