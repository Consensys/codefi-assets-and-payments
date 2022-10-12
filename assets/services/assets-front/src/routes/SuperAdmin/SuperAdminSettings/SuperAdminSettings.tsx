import React from 'react';
import { Switch, Route } from 'react-router-dom';
import styled from 'styled-components';

import SettingsMenuItems from '../SettingsMenuItems/SettingsMenuItems';
import UseCaseManagement from '../UseCaseManagement/UseCaseManagement';

import {
  CLIENT_ROUTE_SUPERADMIN_CREATE_USE_CASE,
  CLIENT_ROUTE_SUPERADMIN_UPDATE_USE_CASE,
  CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT,
} from 'routesList';

import UseCaseCreation from '../UseCaseCreation/UseCaseCreation';
import UpdateUseCase from '../UpdateUseCase/UpdateUseCase';

const StyledMain = styled.main`
  height: calc(100vh - 64px);
  padding: 32px 40px;
`;

const SuperAdminSettings = () => {
  return (
    <div>
      <StyledMain>
        <Switch>
          <Route path={'/'} component={SettingsMenuItems} />
          <Route
            exact
            path={CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT}
            component={UseCaseManagement}
          />
          <Route
            exact
            path={CLIENT_ROUTE_SUPERADMIN_CREATE_USE_CASE}
            component={UseCaseCreation}
          />
          <Route
            exact
            path={CLIENT_ROUTE_SUPERADMIN_UPDATE_USE_CASE.path}
            component={UpdateUseCase}
          />
        </Switch>
      </StyledMain>
    </div>
  );
};

export default SuperAdminSettings;
