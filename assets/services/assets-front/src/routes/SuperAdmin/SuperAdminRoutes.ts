import {
  CLIENT_ROUTE_ACCOUNT_SETTINGS,
  CLIENT_ROUTE_ACCOUNT_SETTINGS_BLOCKCHAIN_NETWORKS,
  CLIENT_ROUTE_SUPERADMIN_HOME,
  CLIENT_ROUTE_SUPERADMIN_TENANT_CREATION,
  CLIENT_ROUTE_SUPERADMIN_TENANT_PROFILE,
  CLIENT_ROUTE_SUPERADMIN_CREATE_USE_CASE,
  CLIENT_ROUTE_SUPERADMIN_UPDATE_USE_CASE,
  CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT,
} from 'routesList';
import Clients from 'routes/SuperAdmin/Clients';
import { TenantCreation } from 'routes/SuperAdmin/TenantCreation';
import { TenantProfile } from 'routes/SuperAdmin/TenantProfile';
import SuperAdminSettings from 'routes/SuperAdmin/SuperAdminSettings/SuperAdminSettings';
import UseCaseManagement from 'routes/SuperAdmin/UseCaseManagement/UseCaseManagement';
import UseCaseCreation from 'routes/SuperAdmin/UseCaseCreation/UseCaseCreation';
import UpdateUseCase from 'routes/SuperAdmin/UpdateUseCase/UpdateUseCase';
import BlockchainNetworks from 'routes/SuperAdmin/BlockchainNetworks/BlockchainNetworks';
import AccountSettings from 'routes/Issuer/AccountSettings';

const superadminRoutes = [
  {
    path: CLIENT_ROUTE_SUPERADMIN_HOME,
    component: Clients,
    exact: true,
    withAside: false,
  },
  {
    path: CLIENT_ROUTE_SUPERADMIN_TENANT_CREATION,
    component: TenantCreation,
    exact: true,
    withAside: false,
  },
  {
    path: CLIENT_ROUTE_ACCOUNT_SETTINGS,
    component: SuperAdminSettings,
    exact: true,
    withAside: false,
  },
  {
    path: CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT,
    component: UseCaseManagement,
    exact: true,
    withAside: false,
  },
  {
    path: CLIENT_ROUTE_SUPERADMIN_CREATE_USE_CASE,
    component: UseCaseCreation,
    exact: true,
    withAside: false,
  },
  {
    path: CLIENT_ROUTE_SUPERADMIN_UPDATE_USE_CASE.path,
    component: UpdateUseCase,
    exact: true,
    withAside: false,
  },
  {
    path: CLIENT_ROUTE_SUPERADMIN_TENANT_PROFILE.path,
    component: TenantProfile,
    exact: true,
    withAside: false,
  },
  {
    path: CLIENT_ROUTE_ACCOUNT_SETTINGS,
    component: AccountSettings,
    exact: true,
    withAside: false,
  },
  {
    path: CLIENT_ROUTE_ACCOUNT_SETTINGS_BLOCKCHAIN_NETWORKS,
    component: BlockchainNetworks,
    exact: true,
    withAside: false,
  },
];

export default superadminRoutes;
