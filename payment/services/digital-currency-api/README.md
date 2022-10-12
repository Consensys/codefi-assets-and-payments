# Digital Currency API

Part of [Codefi Payments](https://consensys.net/codefi/payments/)

![Codefi Payments](/images/codefi-payments.png)

Integrated with token-api, event-based with multi-stack deployment support

## Operations
- MINT
- BURN
- TRANSFER

## Operation Requests
- AQUISITION
- REDEEM

![Operation Requests](/images/aquire_redeem.png)

### Deploy digital currency

![Deploy Token](/images/payments-deploy-token.png)

## Load testing

Load testing is implemented using `k6` tool.

Follow the [link](https://k6.io/docs/getting-started/installation) to install `k6` tool in the system.

When you have all the stack running locally, you can run load test locally using
> cd k6
> npm run build
> k6 run -e ENVIRONMENT=local ./dist/transfer2.js

you can run cloud tests from the cli and upload it to k6 cloud using this command
> K6_CLOUD_TOKEN=<YOUR_K6_CLOUD_API_TOKEN> k6 run --out cloud -e ENVIRONMENT=local ./dist/transfer2.js

For persistent load use this cli parameter (PERSISTENT_LOAD)
> k6 run -e ENVIRONMENT=local -e PERSISTENT_LOAD=true ./dist/transfer2.js

For additional http logs use this cli parameter (--http-debug)
> k6 run  --http-debug -e ENVIRONMENT=local ./dist/transfer2.js
Load tests are located inside `k6` folder.

Test's default settings are located in `k6/utils/config.ts` but Don't forget to set in your local .env file the env var listed in `k6/env.example`
the secrets values are stored in 1password [here](https://start.1password.com/open/i?a=UK7Z754AFNEPHMSZTG43EODT3A&h=my.1password.com&i=37gxik5fv5eqqoaebjnt7rkaai&v=udqbp5l7qwjgr4tm3xpku7tmwy)

```
export AUTH0_CLIENT_SECRET=BlaBlaBlaBlaBlaBlaBlaBlaBla
```
When the `PERSISTENT_LOAD` env var is defined to `true` (default value is false), a fixed number of iterations are executed in a specified period of time.

When the `SINGLE_RUN` env var is defined to `false` (default value is true),  different load test stages are defined in each test in following manner (can be overridden too).

```
  stages: [
    // simulate ramp-up of traffic
    {
      duration: TestDefaults.RAMP_UP_TIME,
      target: parseInt(TestDefaults.VUS, 10),
    },
    // stable number of users
    {
      duration: TestDefaults.PLATEAU_TIME,
      target: parseInt(TestDefaults.VUS, 10),
    },
    // ramp-down to 0 users
    { duration: TestDefaults.RAMP_DOWN_TIME, target: 0 },
  ],
```


```  
### Tests:
* Transfer: ``` k6 run k6/dist/transfer.js```
* Transfer2: ``` k6 run k6/dist/transfer2.js```
* Create wallet: ```k6 run k6/dist/createWallet.js```
* Mint: ```k6 run k6/dist/mint.js```
* Get Balance: ```k6 run k6/dist/getBalance.js```

Test can be run on different environments (default value is local), adding one parameter on the k6 command line
* local: e.g. ```-e ENVIRONMENT=uat```
* Ephemeral: e.g. ```-e ENVIRONMENT=ephemeral```
* UAT: e.g. ```-e ENVIRONMENT=uat```
* Demo: e.g. ```-e ENVIRONMENT=demo```
* OAT: e.g. ```-e ENVIRONMENT=oat```
```

## E2E / Load testing

E2E / Load testing is implemented also by using `k6` tool.
Available tests:
```  
### Tests:
* TransferComplete: ``` k6 run k6/dist/completeTransfer.js```
```
Tests are operating by the `number of total operations`(transactions)
which have to be performed during test execution.
Test logic will try to persist the given number of TPS by using
[batch k6 requests](https://k6.io/docs/javascript-api/k6-http/batch/)
divided by chunks to emulate TPS logic.

**_TransferComplete:_** is using only 2 entities wallets(Sender + Receiver),
all transactions are going from Sender's wallet to Receiver's wallet
> _Test logic example:_  
> Create a digital currency  
> Mint 100 units of this currency  
> Client is requesting 100 transfers  
> Codefi is responding with 98 successes (ok response) and 2 errors (not ok response)  
> Out of 98 successes, 97 requests end up in a transaction with “confirmed” status and while 1 ends up in a transaction with “failed” status  
> We should apply exactly 97 balances updates  
> A failed transaction shall never result in a balance update  
> A validated transaction shall never result in more than one balances updates OR in an incorrect balance update

```  
### Command line example:
k6 run -e ENVIRONMENT=oat ./dist/completeTransfer.js -e OPERATIONS_AMOUNT=100 -e STATUS_CHECK_TIMEOUT_S=200 -e PERSISTENT_LOAD_TPS=10
// Has an intention to make 100 transactions with a given 200 seconds timeout to being confirmed/or failed all operations
```

```
// At the end of a test execution there will be information something like this:
running (1h35m17.5s), 0/1 VUs, 1 complete and 0 interrupted iterations
// How to interpret these numbers 1h35m17.5s - time is being taken for the whole test being completed, 
// meaning it includes issuing all transactions and waiting till all of them are processed!

group_duration....................................: avg=1m45s    min=10.01s  med=1m45s    max=3m20s    p(90)=3m1s     p(95)=3m11s   
     ✓ { group:::Check transfer statuses confirmed }...: avg=3m20s    min=3m20s   med=3m20s    max=3m20s    p(90)=3m20s    p(95)=3m20s   
     ✓ { group:::Sender: transfer currencies }.........: avg=10.01s   min=10.01s  med=10.01s   max=10.01s   p(90)=10.01s   p(95)=10.01s 
// Groups duration measurements, how much time it takes to accomplish specific logic

http_reqs.........................................: 2072    8.85955/s
     ✓ { group:::Check transfer statuses confirmed }...: 1960    8.380656/s
     ✓ { group:::Sender: transfer currencies }.........: 100     0.427584/s
     ✓ { group:::setup }...............................: 12      0.05131/s
// Groups TPS measurements
```
