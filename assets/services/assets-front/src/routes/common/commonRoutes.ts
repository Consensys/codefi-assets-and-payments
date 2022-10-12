import {
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_INVESTMENT_PRODUCTS,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT_CONFIRMATTION,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_DRAWDOWN,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_NOVATION,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_REPAYMENT,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST_PAYMENT,
  CLIENT_ROUTE_INVESTOR_DIRECT_SUBSCRIPTION_ORDER,
  CLIENT_ROUTE_INVESTOR_PORTFOLIO,
  CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER,
  CLIENT_ROUTE_KYC_REJECTED,
  CLIENT_ROUTE_ORDER_MANAGEMENT,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
  CLIENT_ROUTE_PROFILE,
} from 'routesList';

import { CBDCPayment } from 'routes/Investor/SubscriptionOrder/components/CBDCPayment';
import { CBDCPaymentConfirmation } from 'routes/Investor/SubscriptionOrder/components/CBDCPaymentConfirmation';
import { DrawdownRequest } from 'routes/Investor/SyndicatedLoan/DrawdownRequest';
import { Features } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { InvestmentProduct } from 'routes/Investor/InvestmentProduct';
import { InvestmentProducts } from 'routes/Investor/InvestmentProducts';
import { NovationRequest } from 'routes/Investor/SyndicatedLoan/NovationRequest';
import OrdersManagement from 'routes/Issuer/OrderManagement';
import { Permissions } from 'common/permissions/rules';
import { Portfolio } from 'routes/Investor/Portfolio';
import { RedeemRequest } from 'routes/Investor/RedeemRequest';
import { RepaymentRequest } from 'routes/Investor/SyndicatedLoan/RepaymentRequest';
import { SellRequest } from 'routes/Investor/SellRequest';
import { SellRequestPayment } from 'routes/Investor/SubscriptionOrder/components/SellRequestPayment';
import { SubscriptionOrder } from 'routes/Investor/SubscriptionOrder';
import SubscriptionOrderOverview from 'routes/Investor/SubscriptionOrderOverview';
import RejectedAccount from 'routes/Issuer/RejectedAccount';
import UserProfile from './Profile';

export const rejectedUserRoutes = [
  {
    path: CLIENT_ROUTE_KYC_REJECTED,
    component: RejectedAccount,
    exact: true,
    navigation: false,
  },
];

const commonRoutes = [
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCTS,
    component: InvestmentProducts,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ASSETS_INVEST,
  },
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCT.path,
    component: InvestmentProduct,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ASSETS_INVEST,
  },
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT.path,
    component: CBDCPayment,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ASSETS_INVEST,
  },
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT_CONFIRMATTION.path,
    component: CBDCPaymentConfirmation,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ASSETS_INVEST,
  },
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST,
    component: SellRequest,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ASSETS_INVEST,
  },
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST,
    component: RedeemRequest,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ASSETS_INVEST,
  },
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST_PAYMENT.path,
    component: SellRequestPayment,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ASSETS_INVEST,
  },
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCT_DRAWDOWN.path,
    component: DrawdownRequest,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ASSETS_INVEST,
  },
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCT_NOVATION.path,
    component: NovationRequest,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ASSETS_INVEST,
  },
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCT_REPAYMENT.path,
    component: RepaymentRequest,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ASSETS_INVEST,
  },
  {
    path: CLIENT_ROUTE_INVESTOR_PORTFOLIO,
    component: Portfolio,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.USER_PORTFOLIO,
  },
  {
    path: CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER.path,
    component: SubscriptionOrder,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ORDER_CREATE,
  },
  {
    path: CLIENT_ROUTE_INVESTOR_DIRECT_SUBSCRIPTION_ORDER,
    component: SubscriptionOrder,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ORDER_CREATE,
  },
  {
    path: CLIENT_ROUTE_ORDER_MANAGEMENT,
    component: OrdersManagement,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ORDERS_MANAGE,
  },
  {
    path: CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.path,
    component: SubscriptionOrderOverview,
    exact: true,
    features: [Features.ENABLE_ASSETS],
    action: Permissions.ORDERS_MANAGE,
  },
  {
    path: CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.path,
    component: SubscriptionOrderOverview,
    exact: true,
  },
  {
    path: CLIENT_ROUTE_PROFILE,
    component: UserProfile,
    exact: true,
  },
];

export default commonRoutes;
