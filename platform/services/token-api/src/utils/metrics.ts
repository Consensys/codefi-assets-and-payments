import { Counter } from '@consensys/observability'

export const transactionCounter = new Counter({
  name: 'transaction',
  help: 'Total number of transactions',
  labelNames: ['operationType', 'tokenType', 'status'],
})
