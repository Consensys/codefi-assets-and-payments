import { CLIENT_ROUTE_SPACE_SELECTION } from 'routesList';
import SpaceSelection from 'routes/common/SpaceSelection';

const spaceRoutes = [
  {
    path: CLIENT_ROUTE_SPACE_SELECTION,
    component: SpaceSelection,
    exact: false,
    navigation: false,
  },
];

export default spaceRoutes;
