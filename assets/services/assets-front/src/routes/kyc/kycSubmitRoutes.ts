import { Features } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE } from 'routesList';
import KYCSubmit from 'routes/kyc/KYCSubmit';

import { UserType } from 'User';

const kycSubmitRoutes = (userType: UserType) => [
  {
    path: CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE.path,
    component: KYCSubmit,
    exact: false,
    features: [Features.ENABLE_ASSETS, Features.ENABLE_CLIENT_MANAGEMENT],
  },
];

export default kycSubmitRoutes;
