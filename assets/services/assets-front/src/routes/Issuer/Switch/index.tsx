import React from 'react';
import styled from 'styled-components';
import { Col } from 'antd';
import Button from 'uiComponents/Button';
import { getConfig } from '../../../utils/configUtils';
import { useHistory } from 'react-router-dom';
import { CLIENT_ROUTE_SPACE_SELECTION, CLIENT_ROUTE_ASSETS } from 'routesList';
import { APP_VIEWS, useSwitchView } from 'providers/switch-view';

const MarketplaceSwitch = () => {
  const config = getConfig();
  const history = useHistory();
  const { changeView } = useSwitchView();
  return (
    <SwitcherPageWrapper>
      <main>
        <Col style={{ textAlign: 'center', marginTop: '80px' }}>
          <img width="100" src={config.LOGO_WITHOUT_LABEL} alt={config.name} />
          <h2>Welcome to {config.name}</h2>
          <h5 style={{}}>Select how you want to use the platform</h5>
        </Col>

        <div style={{ display: 'flex' }}>
          <LeftCol>
            <h3>Explorer</h3>
            <p>Explore, buy and sell digital assets on the platform.</p>
            <Button
              onClick={() => {
                changeView(APP_VIEWS.EXPLORER);
                history.push(CLIENT_ROUTE_SPACE_SELECTION);
              }}
              label={'Use as Explorer'}
            />
          </LeftCol>
          <RightCol>
            <h3>Creator</h3>
            <p>Create, issue and sell digital assets on the platform.</p>
            <Button
              onClick={() => {
                changeView(APP_VIEWS.CREATOR);
                history.push(CLIENT_ROUTE_ASSETS);
              }}
              label={'Use as Creator'}
            />
          </RightCol>
        </div>
      </main>
    </SwitcherPageWrapper>
  );
};

const LeftCol = styled(Col)`
  text-align: center;
  border-right: 1px solid rgba(0, 0, 0, 0.2);
  padding-right: 80px;
`;

const RightCol = styled(Col)`
  text-align: center;
  padding-left: 80px;
`;

const SwitcherPageWrapper = styled.div`
  main {
    margin: 80px 32px;
    @media (min-width: 820px) {
      width: 600px;
      margin: 40px auto;
    }
    h2 {
      font-size: var(--typography-size-f5);
      font-weight: var(--typography-weight-medium);
      margintop: 24px;
    }
    h3 {
      fontsize: 1.2rem;
    }
    h5 {
      fontsize: var(--typography-size-f2);
      margin: 48px 0 128px;
    }
    p {
      margin: 48px 0;
    }
    .two-columns-wrapper {
      display: flex;
      gap: 24px;
    }
    .two-columns-item {
      width: calc(50% - 12px);
    }
    .single-column-item {
      max-width: 400px;
    }
    button {
      left: 50%;
      transform: translateX(-50%);
    }
  }
`;

export default MarketplaceSwitch;
