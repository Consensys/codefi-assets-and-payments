# @codefi-assets-and-payments/nestjs-contracts


## Env vars

Microservices using this package can/should configure these environment variables.
Values configured by env vars have priority over arguments passed via `TransactionConfig`

* `ORCHESTRATE_URL`: Orchestrate api url - default `localhost:8081`
* `ORCHESTRATE_KAFKA_URL`: Kafka url - default `localhost:9092`
* `ORCHESTRATE_CHAIN_NAME`: Orchestrate chain name (in case the MS will only use only 1 chain registered in Orchestrate)
* `TRANSACTION_GAS`: Gas that will be sent in transactions
* `TRANSACTION_GAS_PRICE`: Gas price that will be set in the transactions
* `ORCHESTRATE_FILTER_FLAG`: This flag forces the kafka consumer to only listen to events submitted with this flag as a label
* `AUTH_CUSTOM_ORCHESTRATE_NAMESPACE`: Defines the namespace in which orchestrate tenant_id header is placed. Used for multitenancy.
