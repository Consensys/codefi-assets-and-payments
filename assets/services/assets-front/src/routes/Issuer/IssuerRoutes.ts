import {
  CLIENT_ROUTE_ACCOUNT_SETTINGS,
  CLIENT_ROUTE_ISSUER_ASSET_CREATION,
  CLIENT_ROUTE_ASSET_INVESTORS,
  CLIENT_ROUTE_ISSUER_ASSET_ISSUANCE,
  CLIENT_ROUTE_ASSET_OVERVIEW,
  CLIENT_ROUTE_ASSET_OVERVIEW_INFOS,
  CLIENT_ROUTE_ASSET_SHARECLASS,
  CLIENT_ROUTE_ASSET_SHARECLASS_INFOS,
  CLIENT_ROUTE_ASSET_SHARECLASSES,
  CLIENT_ROUTE_ASSETS,
  CLIENT_ROUTE_WORKSPACE,
  CLIENT_ROUTE_ASSET_INVESTOR_ASSETS_FEES,
  CLIENT_ROUTE_INVESTOR_ADDRESS,
  CLIENT_ROUTE_INVESTOR_ASSETS,
  CLIENT_ROUTE_ACCOUNT_SETTINGS_CLIENT_MANAGEMENT,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST_PAYMENT,
  CLIENT_ROUTE_ASSET_CORPORATE_ACTIONS,
  CLIENT_ROUTE_ASSET_CORPORATE_ACTION_DETAILS,
  CLIENT_ROUTE_ASSET_PRIMARY_MARKET,
  CLIENT_ROUTE_ASSET_MANAGE_INVESTORS,
  CLIENT_ROUTE_TRADES_CREATE,
  CLIENT_ROUTE_ASSET_SECONDARY_MARKET,
  CLIENT_ROUTE_TRADES_DETAILS,
  CLIENT_ROUTE_TRADES_ACCEPT,
  CLIENT_ROUTE_TRADES_SETTLE,
} from 'routesList';
import { FundInvestorAssets } from '../Issuer/FundInvestorAssets';
import { FundInvestorAddress } from '../Issuer/FundInvestorAddress';
import Workspace from 'routes/Issuer/Workspace';
import AssetIssuance from 'routes/Issuer/AssetIssuance';
import Funds from 'routes/Issuer/Funds';
import { FundOverview } from 'routes/Issuer/FundOverview';
import { FundInfos } from 'routes/Issuer/FundInfos';
import { FundShareClasses } from 'routes/Issuer/FundShareClasses';
import { FundShareClass } from 'routes/Issuer/FundShareClass';
import { FundShareClassInfos } from 'routes/Issuer/FundShareClassInfos';
import { FundInvestors } from 'routes/Issuer/FundInvestors';
import { FundInvestorAssetsFees } from 'routes/Issuer/FundInvestorAssetsFees';
import AccountSettings from 'routes/Issuer/AccountSettings';
import AssetCreation from 'routes/Issuer/AssetIssuance/components/AssetCreation';
import { Features } from 'routes/Issuer/AssetIssuance/templatesTypes';
import ClientManagement from './ClientManagement';
import { RedeemRequestPayment } from 'routes/Investor/RedeemRequest/components/RedeemRequestPayment';
import CorporateActions from './CorporateActions';
import CorporateActionDetails from './CorporateActionDetails';
import { FundPrimaryMarket } from './FundPrimaryMarket';
import FundManageInvestors from './FundManageInvestors';
import { CreateTrade } from './SecondaryMarketTrade';
import { FundSecondaryMarket } from './FundSecondaryMarket';
import { SecondaryMarketTradeDetails } from './SecondaryMarketTradeDetails';
import { AcceptTrade } from './SecondaryMarketTrade/AcceptTrade';
import { SettleTrade } from './SecondaryMarketTrade/SettleTrade';

const issuerRoutes = [
  {
    path: CLIENT_ROUTE_ASSETS,
    component: Funds,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_OVERVIEW.path,
    component: FundOverview,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_OVERVIEW_INFOS.path,
    component: FundInfos,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_SHARECLASSES.path,
    component: FundShareClasses,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_SHARECLASS.path,
    component: FundShareClass,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_SHARECLASS_INFOS.path,
    component: FundShareClassInfos,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_INVESTORS.path,
    component: FundInvestors,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_MANAGE_INVESTORS.path,
    component: FundManageInvestors,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_CORPORATE_ACTIONS.path,
    component: CorporateActions,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_CORPORATE_ACTION_DETAILS.path,
    component: CorporateActionDetails,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_PRIMARY_MARKET.path,
    component: FundPrimaryMarket,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_SECONDARY_MARKET.path,
    component: FundSecondaryMarket,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ASSET_INVESTOR_ASSETS_FEES.path,
    component: FundInvestorAssetsFees,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ISSUER_ASSET_ISSUANCE,
    component: AssetIssuance,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ISSUER_ASSET_CREATION.path,
    component: AssetCreation,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_ACCOUNT_SETTINGS,
    component: AccountSettings,
    exact: false,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_INVESTOR_ASSETS.path,
    component: FundInvestorAssets,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_INVESTOR_ADDRESS.path,
    component: FundInvestorAddress,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_WORKSPACE,
    component: Workspace,
    exact: true,
    navigation: false,
  },
  {
    path: CLIENT_ROUTE_ACCOUNT_SETTINGS_CLIENT_MANAGEMENT,
    component: ClientManagement,
    exact: true,
  },
  {
    path: CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST_PAYMENT.path,
    component: RedeemRequestPayment,
    exact: true,
    features: [Features.ENABLE_ASSETS],
  },
  {
    path: CLIENT_ROUTE_TRADES_CREATE,
    component: CreateTrade,
    exact: true,
  },
  {
    path: CLIENT_ROUTE_TRADES_ACCEPT,
    component: AcceptTrade,
    exact: true,
  },
  {
    path: CLIENT_ROUTE_TRADES_SETTLE.path,
    component: SettleTrade,
    exact: false,
  },
  {
    path: CLIENT_ROUTE_TRADES_DETAILS.path,
    component: SecondaryMarketTradeDetails,
  },
];

export default issuerRoutes;
