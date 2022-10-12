import { IntlShape } from 'react-intl';
import { CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT } from 'routesList';
import { superAdminAccountSettings } from 'texts/routes/superAdmin/superAdminAccountSettings';
import { ISettingsMenuItem } from './types';

const menuItems = (intl: IntlShape): ISettingsMenuItem[] => {
  return [
    {
      title: intl.formatMessage(
        superAdminAccountSettings.useCaseManagementTitle,
      ),
      description: intl.formatMessage(
        superAdminAccountSettings.useCaseManagementDescription,
      ),
      linkTo: CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT,
    },
  ];
};

export default menuItems;
