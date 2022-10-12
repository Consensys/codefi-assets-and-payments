import ClientCreation from 'routes/Issuer/ClientCreation';
import { CLIENT_ROUTE_ACCOUNT_SETTINGS_CREATE_CLIENT } from 'routesList';

const clientCreationRoutes = [
  {
    path: CLIENT_ROUTE_ACCOUNT_SETTINGS_CREATE_CLIENT,
    component: ClientCreation,
    exact: true,
  },
];

export default clientCreationRoutes;
