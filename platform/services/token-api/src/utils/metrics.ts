import { Counter } from '@codefi-assets-and-payments/observability'

export const transactionCounter = new Counter({
  name: 'transaction',
  help: 'Total number of transactions',
  labelNames: ['operationType', 'tokenType', 'status'],
})
