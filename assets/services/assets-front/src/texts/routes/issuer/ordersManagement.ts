// export default {
//   title: {
//     en: "Order management",
//     fr: "Gestion des ordres",
//   },
// };

import { defineMessages } from 'react-intl';

export const ordersManagementTexts = defineMessages({
  title: {
    id: 'assets.ordersManagementTexts.title',
    description: 'Title of Order management page',
    defaultMessage: 'Order management',
  },
  listHeadersAsset: {
    id: 'assets.ordersManagementTexts.list.headers.Asset',
    description: 'Asset',
    defaultMessage: 'Asset',
  },
  listHeadersInvestor: {
    id: 'assets.ordersManagementTexts.list.headers.Investor',
    description: 'Investor',
    defaultMessage: 'Investor',
  },
  listHeadersStatus: {
    id: 'assets.ordersManagementTexts.list.headers.Status',
    description: 'Status',
    defaultMessage: 'Status',
  },
  listHeadersType: {
    id: 'assets.ordersManagementTexts.list.headers.Type',
    description: 'Type',
    defaultMessage: 'Type',
  },
  listHeadersQuantity: {
    id: 'assets.ordersManagementTexts.list.headers.Quantity',
    description: 'Quantity',
    defaultMessage: 'Quantity',
  },
  listHeadersAmount: {
    id: 'assets.ordersManagementTexts.list.headers.Amount',
    description: 'Amount',
    defaultMessage: 'Amount',
  },
  listHeadersOrderDate: {
    id: 'assets.ordersManagementTexts.list.headers.OrderDate',
    description: 'Order date',
    defaultMessage: 'Order date',
  },
  listEmpty: {
    id: 'assets.ordersManagementTexts.list.empty',
    description: 'No subscription orders',
    defaultMessage: 'No subscription orders',
  },
  listEmptyDesc: {
    id: 'assets.ordersManagementTexts.list.empty.desc',
    description: 'Your subscription orders will appear here.',
    defaultMessage: 'Your subscription orders will appear here.',
  },
});

/*
listEmpty: {
    id: "assets.ordersManagementTexts.list.empty.",
    description: "",
    defaultMessage: "",
  },

*/
