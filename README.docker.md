# Docker local instructions

## Local development dependencies group
Run all local development dependencies
```bash
npx nx up local-dev-env local-dev-env
```
or
```bash
npm run docker:up:local-dev-env
```

## Platform group

Run all platform services
```bash
npx nx docker:detached admin-api && npx nx docker:detached entity-api && npx nx docker:detached token-api && npx nx docker:detached mailing-api
```
or
```bash
npm run docker:up:platform
```

Run only entity api service
```bash
npx nx docker entity-api
```

Run only token api service
```bash
npx nx docker token-api
```

Run only admin api service
```bash
npx nx docker admin-api
```

Run only mailing api service
```bash
npx nx docker mailing-api
```

## Asset group
Run all asset services without frontend
```bash
npx nx docker:detached kyc-api && npx nx docker:detached metadata-api && npx nx docker:detached smart-contract-api && npx nx docker:detached workflow-api && npx nx docker:detached assets-api
```
or
```bash
npm run docker:up:assets
```

Run all asset services with frontend
```bash
npx nx docker:detached assets-front && npx nx docker:detached cofidocs-api && npx nx docker:detached external-identity-api && npx nx docker:detached external-storage-api && npx nx docker:detached i18n-api && npx nx docker:detached kyc-api && npx nx docker:detached metadata-api && npx nx docker:detached smart-contract-api && npx nx docker:detached workflow-api && npx nx docker:detached assets-api
```

Run only external storage api service
```bash
npx nx docker external-storage-api
``` 

Run only asset frontend
```bash
npx nx docker assets-front
```

Run only kyc api service
```bash
npx nx docker kyc-api
```

Run only workflow api service
```bash
npx nx docker workflow-api
```

Run only external identity api service
```bash
npx nx docker external-identity-api
```

Run only cofidocs api service
```bash
npx nx docker cofidocs-api
```

Run only metadata api service
```bash
npx nx docker metadata-api
```

Run only i18n api service
```bash
npx nx docker i18n-api
```

Run only smart contract api service
```bash
npx nx docker smart-contract-api
```

Run only assets api service
```bash
npx nx docker assets-api
```

## Payment group

Run only digital currency api service
```bash
npx nx docker:detached digital-currency-api
```
or
```bash
npm run docker:up:payments
```

## Changing base Dockerfile
When building a service you can change the dockerfile used.
Example if you want to build entity api service using Dockerfile instead of the Dockerfile.dev 
```bash
DOCKERFILE=Dockerfile npx nx docker entity-api
```

## Stop a docker service 
When you launched one service or a suite of services you may want to stop it.
Example if you launched entity api service, you may stop it using this command.
```bash
npx nx docker:down entity-api 
```

# Stop a collection of docker services
When you launched multiple services, you may want to stop them alltogether.
Example if you launched all the services included in the platform group.
```bash
npx nx docker:down admin-api && npx nx docker:down entity-api && npx nx docker:down token-api && npx nx docker:down mailing-api
```
or 
```bash
npm run docker:down:platform
```

# Run Integration tests in a docker container
You may want to run integrations tests agains a running docker container.
Example if you want to run entity api service integration tests against a container named (entity-api_ms_1)
```bash
CONTAINER=entity-api_ms_1 PACKAGE=entity-api npm run test:integration:base
```