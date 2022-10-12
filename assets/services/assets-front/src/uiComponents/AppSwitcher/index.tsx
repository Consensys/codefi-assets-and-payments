import React from 'react';
import { mdiToggleSwitchOffOutline } from '@mdi/js';
import Icon from 'uiComponents/Icon';
import { CLIENT_ROUTE_ASSETS, CLIENT_ROUTE_SPACE_SELECTION } from 'routesList';
import { appModalData } from '../AppModal/AppModal';
import { colors, spacing } from '../../constants/styles';
import { APP_VIEWS, useSwitchView } from 'providers/switch-view';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';

export const AppSwitcher = () => {
  const { isExplorer, view, changeView } = useSwitchView();
  const dispatch = useDispatch();

  const opentSwitchModal = () => {
    const switchedApp = isExplorer ? APP_VIEWS.CREATOR : APP_VIEWS.EXPLORER;
    const switchedPath = isExplorer
      ? CLIENT_ROUTE_ASSETS
      : CLIENT_ROUTE_SPACE_SELECTION;

    dispatch(
      setAppModal(
        appModalData({
          title: 'Switch views',
          confirmAction: () => {
            changeView(switchedApp);
            window.location.href = switchedPath;
          },
          confirmLabel: `Continue to ${switchedApp} platform`,
          confirmColor: colors.success,
          content: (
            <div>
              <p>
                You are about to switch from the {view} platform to the{' '}
                {switchedApp} platform.
              </p>
              <p style={{ marginBottom: spacing.tightLooser }}>
                Are you sure you want to continue?
              </p>
            </div>
          ),
        }),
      ),
    );
  };

  return (
    <div onClick={() => opentSwitchModal()}>
      <Icon icon={mdiToggleSwitchOffOutline} />
    </div>
  );
};
