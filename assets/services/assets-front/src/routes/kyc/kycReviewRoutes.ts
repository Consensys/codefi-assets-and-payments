import {
  CLIENT_ROUTE_INVESTOR_PROFILE,
  CLIENT_ROUTE_CLIENT_MANAGEMENT,
  CLIENT_ROUTE_KYC_REVIEW,
  CLIENT_ROUTE_ACCOUNT_SETTINGS_CREATE_CLIENT,
} from 'routesList';
import InvestorsManagement from 'routes/Issuer/ClientManagement';
import KYCReview from 'routes/kyc/KYCReview';
import ClientCreation from 'routes/Issuer/ClientCreation';
import { FundInvestorDetails } from 'routes/Issuer/FundInvestorDetails';

import { Features } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { Permissions } from 'common/permissions/rules';

const kycReviewRoutes = [
  {
    path: CLIENT_ROUTE_CLIENT_MANAGEMENT,
    component: InvestorsManagement,
    exact: true,
    features: [Features.ENABLE_ASSETS, Features.ENABLE_CLIENT_MANAGEMENT],
    action: Permissions.USERS_MANAGE,
  },
  {
    path: CLIENT_ROUTE_INVESTOR_PROFILE.path,
    component: FundInvestorDetails,
    exact: true,
    features: [Features.ENABLE_ASSETS, Features.ENABLE_CLIENT_MANAGEMENT],
    action: Permissions.USERS_MANAGE,
  },
  {
    path: CLIENT_ROUTE_KYC_REVIEW.path,
    component: KYCReview,
    exact: false,
    features: [Features.ENABLE_ASSETS, Features.ENABLE_CLIENT_MANAGEMENT],
    action: Permissions.USERS_MANAGE,
  },
  {
    path: CLIENT_ROUTE_ACCOUNT_SETTINGS_CREATE_CLIENT,
    component: ClientCreation,
    exact: true,
    action: Permissions.USERS_MANAGE,
  },
];

export default kycReviewRoutes;
