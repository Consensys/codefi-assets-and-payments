import { defineMessages } from 'react-intl';
export const fundPrimaryMarketTexts = defineMessages({
  orderType: {
    id: 'assets.fundPrimaryMarket.info.orderType',
    description: 'Order type',
    defaultMessage: 'Order type',
  },
  subscription: {
    id: 'assets.fundPrimaryMarket.info.subscription',
    description: 'Subscription',
    defaultMessage: 'Subscription',
  },
  subscriptionCutOff: {
    id: 'assets.fundPrimaryMarket.info.subscriptionCutOff',
    description: 'Cut off date',
    defaultMessage: 'Cut off date',
  },
  subscriptionIssuance: {
    id: 'assets.fundPrimaryMarket.info.subscriptionIssuance',
    description: 'Issuance date',
    defaultMessage: 'Issuance date',
  },
  orders: {
    id: 'assets.fundPrimaryMarket.info.orders',
    description: 'Orders',
    defaultMessage: 'Orders',
  },
  totalAmount: {
    id: 'assets.fundPrimaryMarket.info.totalAmount',
    description: 'Total amount',
    defaultMessage: 'Total amount',
  },
  totalQuantity: {
    id: 'assets.fundPrimaryMarket.info.totalQuantity',
    description: 'Total quantity',
    defaultMessage: 'Total quantity',
  },
  cancelOrders: {
    id: 'assets.fundPrimaryMarket.dialog.cancelOrders',
    description: 'Cancel orders',
    defaultMessage: 'Cancel orders',
  },
  settleOrders: {
    id: 'assets.fundPrimaryMarket.dialog.settleOrders',
    description: 'Settle orders',
    defaultMessage: 'Settle orders',
  },
  confirmPayment: {
    id: 'assets.fundPrimaryMarket.dialog.confirmPayment',
    description: 'Confirm payment',
    defaultMessage: 'Confirm payment',
  },
  cancelOrdersConfirmation: {
    id: 'assets.fundPrimaryMarket.dialog.cancelOrdersConfirmation',
    description: 'Are you sure that you want to cancel the selected orders? ',
    defaultMessage:
      'Are you sure that you want to cancel the selected orders? ',
  },
  confirmPaymentConfirmation: {
    id: 'assets.fundPrimaryMarket.dialog.cancelOrdersConfirmation',
    description:
      'You are about to confirm payment for {length} subscription order which totals {amount} tokens, this will notify investors their payment has been completed and the status of the order will be updated to paid.',
    defaultMessage:
      'You are about to confirm payment for {length} subscription order which totals {amount} tokens, this will notify investors their payment has been completed and the status of the order will be updated to paid.',
  },
  settleOrdersConfirmation: {
    id: 'assets.fundPrimaryMarket.dialog.settleOrdersConfirmation',
    description:
      'You are about to settle {length} subscriptions orders which total {amount}.',
    defaultMessage:
      'You are about to settle {length} subscriptions orders which total {amount}.',
  },
  settleOrdersMessage: {
    id: 'assets.fundPrimaryMarket.dialog.settleOrdersMessage',
    description:
      'It can take up to 5 minutes for the updated balance to be reflected on the platform and the blockchain.',
    defaultMessage:
      'It can take up to 5 minutes for the updated balance to be reflected on the platform and the blockchain.',
  },
  outstanding: {
    id: 'assets.fundPrimaryMarket.table.outstanding',
    description: 'Outstanding',
    defaultMessage: 'Outstanding',
  },
  paid: {
    id: 'assets.fundPrimaryMarket.table.paid',
    description: 'Paid',
    defaultMessage: 'Paid',
  },
  settled: {
    id: 'assets.fundPrimaryMarket.table.settled',
    description: 'Settled',
    defaultMessage: 'Settled',
  },
  canceled: {
    id: 'assets.fundPrimaryMarket.table.canceled',
    description: 'Canceled',
    defaultMessage: 'Canceled',
  },
});
