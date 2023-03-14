# Codefi Assets & Payments

## Quick Start

The following values are required before starting:

- Mailjet Api key and secret
- Sendgrid Api key
- A public facing redis
- ONFIDO account set up
- Blockchain network setup in Smart contract API (see related doc there)

For externally provided postgresql servers (e.g. AWS RDS), the supported major version is 11.

A video tutorial to help in the bootstrapping of a local Assets stack is available at: https://user-images.githubusercontent.com/14951297/194505802-fd7d2a99-2cb7-4eb7-8ccf-24caa5d43894.mp4

### Step 1 - Create an Auth0 tenant

1. Create new Auth0 tenant with either a new Auth0 account or an existing one.
   - Select name, region and environment tag depending on your needs.
2. Create an application to communicate with the Auth0 tenant from the admin API.
   - Sidebar > Applications > Applications > Create Application
      - Name: Admin API Client
      - Application Type: Machine to Machine Applications
      - API: Auth0 Management API
      - Permissions: Select All

### Step 2 - Setup .env files

Run the following command to generate `.env` files from the `.env.sample` ones.

`npm run setup-env-files`

Following that, populate the following entries from the root `.env` file. Service `.env` files should have appropriate default values for the application to start.

```
# Authentication
AUTH0_URL= # Url of the Auth0 tenant. (e.g. https://monorepo-test1.eu.auth0.com/)

# Auth0 configuration
ADMIN_API_CLIENT_ID= # Client ID for Admin API Client Application
ADMIN_API_CLIENT_SECRET= # Client secret for Admin API Client Application
SENDGRID_API_KEY= # Sendgrid API key

# Auth0 redis details
M2M_TOKEN_REDIS_HOST= # Redis host url
M2M_TOKEN_REDIS_PASS= # Redis password
M2M_TOKEN_EXPIRE_THRESHOLD=50
```
Note:
When using a Macbook with an M1 processor, some containers require alternate images with ARM64 support.
This is automatically done when setting `M1=true` in the .env file under platform/tools.

### Step 3 - Run admin-api to configure Auth0

First set up the repo with the following commands:
```
yarn
npm run build:all
```

Then run the following command to start admin-api service, which will finish the configuration of Auth0:
```
npm run docker:admin-api
```

Once the service has started and healthy, the Auth0 instance should be fully configured. Then it can be taken down with:
```
npm run docker:down:admin-api
```

### Step 4 - Setup the remaining environment variables

Now that the Auth0 instance is created, find the client id and secret for the codefi-api M2M client.
Sidebar > Applications > Applications > codefi-api-m2m-client

```
# Redis M2M token caching
M2M_TOKEN_REDIS_ENABLE=true
M2M_TOKEN_CLIENT_ID= # Client ID for codefi-api-m2m-client
M2M_TOKEN_CLIENT_SECRET= # Client Secret for codefi-api-m2m-client
M2M_TOKEN_AUDIENCE=https://api.codefi.network

# MailJet
MAILJET_API_KEY= # Mailjet API key
MAILJET_API_SECRET= # Mailjet API secret
```

Also find the client id and secret for the codefi-admin-api  M2M client.
Sidebar > Applications > Applications > codefi-admin-api-m2m-client

```
## -- ASSETS

# Admin API M2M token
M2M_TOKEN_ADMIN_CLIENT_ID= # Client ID for codefi-admin-api-m2m-client
M2M_TOKEN_ADMIN_CLIENT_SECRET=# Client Secret for codefi-admin-api-m2m-client
M2M_TOKEN_ADMIN_AUDIENCE=https://admin.codefi.network
```

### Step 5 - Run platform/assets services

Run the following command to start platform services
```
npm run docker:platform
```

Once completed. All platform services should be running locally along with all dependencies.

The following command can be used to stop them
```
npm run docker:down:platform
```

Run the following command to start assets services
```
npm run docker:assets
```

Once completed. All assets services should be running locally along with all dependencies.

The following command can be used to stop them
```
npm run docker:down:assets
```

### Notes on Assets stack

#### Creation of a Default tenant/application at Assets API startup

Prior to the launching of Assets API, populate the following env variable in the global .env file
```
DEFAULT_INITIALIZATION_TENANT_ID=
```
The value can be any random id (for example a random UUID), and it will be used as the Id of a newly created Tenant in the stack. Along with it initial users will be created for that tenant, including an admin. The default password used for them is specified in the following env variable in the .env global file
```
DEFAULT_PASSWORD=

```

#### Launching of a complete Assets stack

To run a complete local Assets stack (platform + assets services without a frontend) execute the following
```
npm run docker:assets-stack
```
for that to work without any problem, all required env variables should be checked and filled up in every stack service .env file.
Very important is the value of the following env variable in the global .env file which specify the default blockchain network that will be used:
```
DEFAULT_NETWORK_KEY=
```
that network key has to be present (together with that network's other params) in the Smart contract API service's network.js file.

##### Docker performance problems

Launching the whole aforementioned stack can demand a lot of docker system resources especially in terms of RAM.
If you run into any of these problems, and some containers fail to start (or they start and will be killed afterwards), try to increase resources allocated to your docker daemon. This can be done differently depending on the platform you are running in the stack.
Also you could disable/not run services: PgAdmin and Cors proxy in the local dev env platfrom tool, as those are not required dependencies.

### Supported Services

- [entity-api](./platform/services/entity-api/README.md)
- [token-api](./platform/services/token-api/README.md)
- [admin-api](./platform/services/admin-api/README.md)
- [mailing-api](./platform/services/mailing-api/README.md)
- [smart-contract-api](./assets/services/smart-contract-api/README.md)

### Production Images

The above commands use the development Docker images which automatically update when the service source directories change.

To run the services using smaller and more optimised production images:

```
npm run docker:prod:[service name]

e.g. npm run docker:prod:entity-api
```

## Build

Install dependencies:

```
yarn
```

Build a single service or package:

```
npm run build [package or service name]

e.g. npm run build entity-api
```

Build all services and packages:

```
npm run build:all
```

## Test

### Unit Tests

Run all unit tests for a single service or package:

```
npm test [package or service name]

e.g. npm test entity-api
```

Run all unit tests for all services and packages:

```
npm run test:all
```

### Integration Tests

Assuming the service has been started via the quick start scripts or the docker-compose files:

```
npm run test:integration:[service-name]

e.g. npm run test:integration:entity-api
```

### Assets Functional Tests

Functional tests for Assets services use `nock` to mock external calls during tests runs.
As nock uses snapshots, you'll have to generate them the first time you configure the monorepo with all external API dependencies configured and running (eg. underlying assets services like kyc-api).

To generate snapshots for an assets service:

1. Edit `test/functional/.test.functional.env` file using correct values for your auth0 configuration.

2. **Only for `assets-api`**, generate an Auth0 token and use it for the `REAL_TOKEN` value in `test/functional/.test.functional.env`.

3. Run `yarn test:functional:record`

After all snapshots are generated, you can run tests again without any service external API dependency using:

```bash
yarn test:functional
```

## NX

NX is a monorepo toolkit that is used internally by the NPM scripts.

It provides a CLI that can be optionally installed globally to more easily run NPM scripts from the services or packages.

```
npm install -g nx
```

Run an NPM script from a service or package:

```
nx [script name] [package or service name]

e.g. nx lint auth
```

Run an NPM script on every service or package:

```
nx run-many --target=[script name] --all

e.g. nx run-many --target=lint --all
```

## Dependencies

To display an interactive browser application showing a diagram of package and service dependencies:

```
npm run deps
```

## Swagger

Each service has a configured swagger instance that will run along with it .
To be able to create an oauth token through Swagger, you should replace `<YOUR_OAUTH_TOKEN_URL>` in the service `src/docs-override.json` file
