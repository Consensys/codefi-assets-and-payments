import { defineMessages } from 'react-intl';

export const fundsTexts = defineMessages({
  title: {
    id: 'assets.fundsMessages.title',
    description: 'Title of Funds page',
    defaultMessage: 'Assets',
  },
  createAssetButton: {
    id: 'assets.fundsMessages.createAssetButton',
    description: 'Create an asset button message',
    defaultMessage: 'Create an asset',
  },
  noAssetsTitle: {
    id: 'assets.fundsMessages.noAssetsTitle',
    description: 'No assets title',
    defaultMessage: 'No assets created yet',
  },
  noAssetsDesc: {
    id: 'assets.fundsMessages.noAssetsDesc',
    description: 'No assets description',
    defaultMessage: 'Get started by creating an asset',
  },
  showingNumberOfAssets: {
    id: 'assets.fundsMessages.showingNumberOfAssets',
    description: 'Message for showing number of displayed assets',
    defaultMessage: 'Showing {visible} of {total} assets',
  },
  selectAssetTypeAll: {
    id: 'assets.fundsMessages.selectAssetTypeAll',
    description: 'Assets Type: All',
    defaultMessage: 'Type: All',
  },
  selectAssetType: {
    id: 'assets.fundsMessages.selectAssetType',
    description: 'Assets Type option',
    defaultMessage: 'Type: {type}',
  },
  allShareClasses: {
    id: 'assets.fundsMessages.allShareClasses',
    description: 'All Share classes',
    defaultMessage: 'All Share classes',
  },
  navPrice: {
    id: 'assets.fundsMessages.navPrice',
    description: 'NAV price',
    defaultMessage: 'NAV price',
  },
  transactions: {
    id: 'assets.fundsMessages.transactions',
    description: 'Transactions',
    defaultMessage: 'Transactions',
  },
  primaryMarket: {
    id: 'assets.fundsMessages.primaryMarket',
    description: 'Primary market',
    defaultMessage: 'Primary market',
  },
  secondaryMarket: {
    id: 'assets.fundsMessages.secondaryMarket',
    description: 'Secondary market',
    defaultMessage: 'Secondary market',
  },
});

export const fundOverviewTexts = defineMessages({
  updateSharePrice: {
    id: 'assets.fundOverviewTexts.updateSharePrice',
    description: 'Update share price',
    defaultMessage: 'Update share price',
  },
  viewAssetInformation: {
    id: 'assets.fundOverviewTexts.viewAssetInformation',
    description: 'View Asset information',
    defaultMessage: 'View Asset information',
  },
  assetsUnderManagement: {
    id: 'assets.fundOverviewTexts.assetsUnderManagement',
    description: 'Assets under management',
    defaultMessage: 'Assets under management',
  },
  shareClassHeadersShareClass: {
    id: 'assets.fundOverviewTexts.shareClassHeaders.',
    description: 'Share Class',
    defaultMessage: 'Share Class',
  },
  shareClassHeadersNAV: {
    id: 'assets.fundOverviewTexts.shareClassHeaders.',
    description: 'NAV',
    defaultMessage: 'NAV',
  },
  shareClassHeadersChangeYTD: {
    id: 'assets.fundOverviewTexts.shareClassHeaders.ChangeYTD',
    description: 'Change YTD',
    defaultMessage: 'Change YTD',
  },
  shareClassHeadersChart: {
    id: 'assets.fundOverviewTexts.shareClassHeaders.chart',
    description: 'Chart',
    defaultMessage: 'Chart',
  },
  shareClassHeadersAssetPercentage: {
    id: 'assets.fundOverviewTexts.shareClassHeaders.assetPercentage',
    description: 'Asset %',
    defaultMessage: 'Asset %',
  },
  recentTransactionsTitle: {
    id: 'assets.fundOverviewTexts.recentTransactions.title',
    description: 'Recent transactions list title',
    defaultMessage: 'Recent transactions',
  },
  recentTransactionsEmpty: {
    id: 'assets.fundOverviewTexts.recentTransactions.empty',
    description: 'Recent transactions list empty',
    defaultMessage: 'No transactions',
  },
  recentTransactionsEmptyDesc: {
    id: 'assets.fundOverviewTexts.recentTransactions.emptyDesc',
    description: 'Recent transactions list empty desc',
    defaultMessage: 'The most transactions will be shown here',
  },
  recentTransactionsInvestor: {
    id: 'assets.fundOverviewTexts.recentTransactions.Investor',
    description: 'Recent transactions list Investor',
    defaultMessage: 'Investor',
  },
  recentTransactionsStatus: {
    id: 'assets.fundOverviewTexts.recentTransactions.Status',
    description: 'Recent transactions list Status',
    defaultMessage: 'Status',
  },
  recentTransactionsType: {
    id: 'assets.fundOverviewTexts.recentTransactions.Type',
    description: 'Recent transactions list Type',
    defaultMessage: 'Type',
  },
  recentTransactionsQuantity: {
    id: 'assets.fundOverviewTexts.recentTransactions.Quantity',
    description: 'Recent transactions list Quantity',
    defaultMessage: 'Quantity',
  },
  recentTransactionsAmount: {
    id: 'assets.fundOverviewTexts.recentTransactions.Amount',
    description: 'Recent transactions list Amount',
    defaultMessage: 'Amount',
  },
  recentTransactionsDate: {
    id: 'assets.fundOverviewTexts.recentTransactions.Date',
    description: 'Recent transactions list Date',
    defaultMessage: 'Date',
  },
  investor: {
    id: 'assets.fundShareTexts.investor',
    description: 'Investor',
    defaultMessage: 'Investor',
  },
  amountQuantity: {
    id: 'assets.fundShareTexts.amountQuantity',
    description: 'Amount/quantity',
    defaultMessage: 'Amount/quantity',
  },
  totalRaised: {
    id: 'assets.fundShareTexts.totalRaised',
    description: 'Total raised',
    defaultMessage: 'Total raised',
  },
  funded: {
    id: 'assets.fundShareTexts.funded',
    description: 'Funded',
    defaultMessage: 'Funded',
  },
  topInvestors: {
    id: 'assets.fundShareTexts.topInvestors',
    description: 'Top investors',
    defaultMessage: 'Top investors',
  },
  shareOfTotal: {
    id: 'assets.fundShareTexts.shareOfTotal',
    description: 'Share of Total',
    defaultMessage: 'Share of Total',
  },
  minNominalAmount: {
    id: 'assets.fundShareTexts.minNominalAmount',
    description: 'Min. nominal amount',
    defaultMessage: 'Min. nominal amount',
  },
  maxNominalAmount: {
    id: 'assets.fundShareTexts.maxNominalAmount',
    description: 'Max. nominal amount',
    defaultMessage: 'Max. nominal amount',
  },
  Borrower: {
    id: 'assets.fundShareTexts.borrower',
    description: 'Borrower',
    defaultMessage: 'Borrower',
  },
  couponRate: {
    id: 'assets.fundShareTexts.couponRate',
    description: 'Coupon rate',
    defaultMessage: 'Coupon rate',
  },
  subscriptionCutOff: {
    id: 'assets.fundShareTexts.subscriptionCutOff',
    description: 'Subscription cut off',
    defaultMessage: 'Subscription cut off',
  },
  issuance: {
    id: 'assets.fundShareTexts.issuance',
    description: 'Issuance',
    defaultMessage: 'Issuance',
  },
  createTrade: {
    id: 'assets.fundShareTexts.createTrade',
    description: 'Create Trade',
    defaultMessage: 'Create Trade',
  },
  acceptTrade: {
    id: 'assets.fundShareTexts.acceptTrade',
    description: 'Accept Trade',
    defaultMessage: 'Accept Trade',
  },
});

/*
  : {
    id: "assets.fundOverviewTexts.",
    description: "",
    defaultMessage: "",
  },

*/
