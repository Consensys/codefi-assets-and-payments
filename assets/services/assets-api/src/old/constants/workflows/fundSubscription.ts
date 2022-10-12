export enum FundSubscriptionWorkflow {
  NOT_STARTED = '__notStarted__',
  SUBSCRIBED = 'subscribed',
  PAID = 'paid',
  PAID_SETTLED = 'paidSettled',
  UNPAID_SETTLED = 'unpaidSettled',
  PAID_CANCELLED = 'paidCancelled',
  UNPAID_CANCELLED = 'unpaidCancelled',
  PAID_REJECTED = 'paidRejected',
  UNPAID_REJECTED = 'unpaidRejected',
}
