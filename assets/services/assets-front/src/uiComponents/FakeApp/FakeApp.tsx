import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { useAuth0 } from 'auth/auth0';
import {
  mdiAccountSupervisor,
  mdiBank,
  mdiBellRing,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClose,
  mdiCogs,
  mdiLogout,
  mdiMenu,
  mdiArrowLeft,
  mdiSwapHorizontal,
} from '@mdi/js';

import { CLIENT_ROUTE_ACCOUNT_SETTINGS_COMPANY_INFORMATION } from 'routesList';
import StyledLayout from './StyledLayout';
import Icon from 'uiComponents/Icon';
import Logo from 'uiComponents/Logo';
import { colors } from 'constants/styles';
import clsx from 'clsx';
import { Permissions } from 'common/permissions/rules';
import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import Radio from 'uiComponents/Radio';
import { Column } from 'uiComponents/InputGroup/InputGroup';

interface IMenuItem {
  label: string;
  to: string;
  icon?: string;
  action: Permissions;
}

const menuItems = (): Array<IMenuItem> => [
  {
    label: 'Funds',
    to: '1',
    icon: mdiBank,
    action: Permissions.ASSETS_MANAGE,
  },
  {
    label: 'Orders management',
    to: '2',
    icon: mdiSwapHorizontal,
    action: Permissions.ORDERS_MANAGE,
  },
  {
    label: 'Client management',
    to: '3',
    icon: mdiAccountSupervisor,
    action: Permissions.USERS_MANAGE,
  },
];

const Aside: React.FC<any> = (props: any) => {
  const { pathname } = useLocation();
  const [isMenuMinified, setMinify] = useState(false);
  const { logout } = useAuth0();
  const [open, setOpen] = useState(false);

  return (
    <aside className={isMenuMinified ? 'minified' : ''}>
      <header
        style={{ marginTop: '30px', marginLeft: '25px', marginBottom: '30px' }}
      >
        <button onClick={() => setOpen(!open)}>
          <Icon icon={open ? mdiClose : mdiMenu} color="#fff" />
        </button>
        <div>
          <Logo
            withLabel
            style={{ width: isMenuMinified ? '30px' : '150px' }}
            className={`desktop ${isMenuMinified ? 'minified' : ''}`}
            src={isMenuMinified ? props.smallLogoBase64 : props.largeLogoBase64}
          />
        </div>
        <button style={{ visibility: 'hidden' }}>
          <Icon icon={mdiBellRing} width={10} color={props.colorMain} />
          <span>2</span>
        </button>
      </header>

      <div
        className={clsx('workspace', {
          minified: isMenuMinified,
        })}
      />

      <menu
        className={`${open ? 'opened' : ''} ${
          isMenuMinified ? 'minified' : ''
        }`}
        id="data-test-id"
      >
        <button
          onClick={() => {
            setMinify(!isMenuMinified);
            props.callback(!isMenuMinified);
          }}
        >
          <Icon
            icon={isMenuMinified ? mdiChevronRight : mdiChevronLeft}
            width={12}
            color="#333"
          />
        </button>

        {menuItems().map((link) => {
          const isActive = pathname === link.to;
          // eslint-disable-next-line
          return (
            <div key={link.to}>
              <a // eslint-disable-line
                className={`${isMenuMinified ? 'minified' : ''}${
                  isActive ? ' active' : ''
                }`}
              >
                {link.icon && (
                  <Icon
                    icon={link.icon}
                    width={24}
                    color={props.colorSidebarText}
                  />
                )}
                <span style={{ fontSize: '12px' }}>{link.label}</span>
              </a>
            </div>
          );
        })}

        <div className="spacer" />

        <hr />

        <div className="mobileSpecificFields">
          <Link
            to={CLIENT_ROUTE_ACCOUNT_SETTINGS_COMPANY_INFORMATION}
            onClick={() => setOpen(false)}
            className={isMenuMinified ? 'minified' : ''}
          >
            <Icon icon={mdiCogs} width={12} color={colors.sidebarText} />
            <span>Settings</span>
          </Link>
          <Link
            to="#"
            onClick={() => logout({ returnTo: window.location.origin })}
            className={isMenuMinified ? 'minified' : ''}
          >
            <Icon icon={mdiLogout} width={12} color={colors.sidebarText} />
            <span>Logout</span>
          </Link>
        </div>
      </menu>
    </aside>
  );
};

const FakeForm: React.FC<any> = (props) => {
  return (
    <div style={{ background: 'white', width: '100%' }}>
      <div
        style={{
          marginLeft: '25px',
          marginTop: '25px',
        }}
      >
        <Link to="#" style={{ display: 'flex', alignItems: 'center' }}>
          <Icon icon={mdiArrowLeft} width={18} color={props.colorMain} />
          <span style={{ color: props.colorMain }}>Back</span>
        </Link>
      </div>
      <div
        style={{
          marginTop: '10px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: 600,
            display: 'block',
            marginLeft: '25px',
            marginRight: props.isMenuMinified ? '460px' : '320px',
          }}
        >
          Page title
        </div>
        <Button label={'Primary button'} size="small" color={props.colorMain} />
      </div>
      <hr
        style={{
          marginTop: '16px',
          marginBottom: '30px',
        }}
      />
      <div
        style={{
          marginLeft: '30px',
          marginRight: '250px',
        }}
      >
        <div
          style={{
            fontSize: '20px',
            fontWeight: 600,
            display: 'block',
          }}
        >
          Example form
        </div>
        <hr
          style={{
            marginTop: '16px',
            marginBottom: '30px',
          }}
        />
        <div
          style={{
            fontSize: '16px',
            fontWeight: 600,
            display: 'block',
          }}
        >
          Orders
        </div>
        <div
          style={{
            marginTop: '24px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'block',
          }}
        >
          Type of order subscriptions
        </div>
        <Checkbox
          style={{
            marginTop: '16px',
          }}
          label="Amount"
          color={props.colorMain}
          checked
        />
        <Checkbox
          style={{
            marginTop: '16px',
          }}
          color={props.colorMain}
          label="Quantiy"
        />
        <div
          style={{
            marginTop: '30px',
            fontSize: '16px',
            fontWeight: 600,
            display: 'block',
          }}
        >
          Payment options
        </div>
        <div
          style={{
            marginTop: '24px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'block',
          }}
        >
          Initial subscription
        </div>
        <Column>
          <Radio
            label={'Paid at the time of order'}
            name="paymentType"
            color={props.colorMain}
            checked
          />
          <Radio
            label={'Paid between initial subscription cut off and settlement'}
            name="paymentType"
            color={props.colorMain}
          />
        </Column>
        <hr
          style={{
            marginTop: '20px',
            marginBottom: '20px',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <Button
            label="Submit"
            size="small"
            style={{ marginRight: '20px' }}
            color={props.colorMain}
          />
          <Button
            label="Cancel"
            size="small"
            secondary
            color={props.colorMain}
          />
        </div>
      </div>
    </div>
  );
};

interface IProps {
  largeLogoBase64: string;
  smallLogoBase64: string;
  faviconBase64: string;
  colorMain: string;
  colorSidebarText: string;
  colorSidebarTextHover: string;
  colorSidebarBackground: string;
  colorSidebarBackgroundHover: string;
}

interface IState {
  isMenuMinified: boolean;
}

const FakeApp: React.FC<IProps> = (props) => {
  const [state, setState] = useState<IState>({
    isMenuMinified: false,
  });

  return (
    <StyledLayout
      colorMain={props.colorMain}
      colorSidebarText={props.colorSidebarText}
      colorSidebarTextHover={props.colorSidebarTextHover}
      colorSidebarBackground={props.colorSidebarBackground}
      colorSidebarBackgroundHover={props.colorSidebarBackgroundHover}
    >
      <Aside
        colorMain={props.colorMain}
        colorSidebarText={props.colorSidebarText}
        smallLogoBase64={props.smallLogoBase64}
        largeLogoBase64={props.largeLogoBase64}
        callback={(result: boolean) => {
          setState((s) => ({ ...s, isMenuMinified: result }));
        }}
      />
      <FakeForm
        colorMain={props.colorMain}
        isMenuMinified={state.isMenuMinified}
      />
    </StyledLayout>
  );
};

export default FakeApp;
