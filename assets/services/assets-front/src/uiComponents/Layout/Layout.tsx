import React, { useEffect, useRef, useState } from 'react';
import { RouteComponentProps, useLocation, withRouter } from 'react-router-dom';

import {
  mdiAccount,
  mdiAccountSupervisor,
  mdiBank,
  mdiBellRing,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClose,
  mdiCogOutline,
  mdiHelpCircleOutline,
  mdiLogout,
  mdiMenu,
  mdiSwapHorizontal,
  mdiWallet,
} from '@mdi/js';
import Icon from 'uiComponents/Icon';

import { Link } from 'react-router-dom';
import Logo from 'uiComponents/Logo';
import {
  CLIENT_ROUTE_INVESTMENT_PRODUCTS,
  CLIENT_ROUTE_INVESTOR_PORTFOLIO,
  CLIENT_ROUTE_CLIENT_MANAGEMENT,
  CLIENT_ROUTE_ORDER_MANAGEMENT,
  CLIENT_ROUTE_ASSETS,
  CLIENT_ROUTE_SUPERADMIN_HOME,
  CLIENT_ROUTE_SUPERADMIN_TENANT_CREATION,
  CLIENT_ROUTE_PROFILE,
  CLIENT_ROUTE_ACCOUNT_SETTINGS,
} from 'routesList';
import { useAuth0 } from 'auth/auth0';
import { IUser, LinkStatus, UserType } from 'User';
import { TopBar } from 'uiComponents/TopBar';
import { colors } from 'constants/styles';
import clsx from 'clsx';

import StyledLayout from './StyledLayout';
import { IWorkflowInstance } from 'routes/Issuer/AssetIssuance/templatesTypes';
import rules, { Permissions } from 'common/permissions/rules';
import { hasPermissions } from 'common/permissions/Can';
import { useIntl } from 'react-intl';
import { menuItemsTexts } from 'texts/commun/menu';
import { useSelector, useDispatch } from 'react-redux';
import {
  applicationMenuMinifiedSelector,
  setApplicationMenuMinified,
  userSelector,
  userSpaceSelector,
} from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps extends RouteComponentProps {
  withAside?: boolean;
}
interface IMenuItem {
  label: {
    id: string;
    description: string;
    defaultMessage: string;
  };
  to: string;
  icon?: string;
  action: Permissions;
}

const menuItems = (role: UserType): Array<IMenuItem> => [
  {
    label: menuItemsTexts.tenants,
    to: CLIENT_ROUTE_SUPERADMIN_HOME,
    icon: mdiBank,
    action: Permissions.TENANTS_MANAGE,
  },
  {
    label: menuItemsTexts.tenantCreation,
    to: CLIENT_ROUTE_SUPERADMIN_TENANT_CREATION,
    icon: mdiBank,
    action: Permissions.TENANTS_MANAGE,
  },
  {
    label: menuItemsTexts.assets,
    to: CLIENT_ROUTE_ASSETS,
    icon: mdiBank,
    action: Permissions.ASSETS_MANAGE,
  },
  {
    label: menuItemsTexts.portfolio,
    to: CLIENT_ROUTE_INVESTOR_PORTFOLIO,
    icon: mdiWallet,
    action: Permissions.USER_PORTFOLIO,
  },
  {
    label: menuItemsTexts.investmentProducts,
    to: CLIENT_ROUTE_INVESTMENT_PRODUCTS,
    icon: mdiBank,
    action: Permissions.ASSETS_INVEST,
  },
  {
    label: menuItemsTexts.orderManagement,
    to: CLIENT_ROUTE_ORDER_MANAGEMENT,
    icon: mdiSwapHorizontal,
    action: Permissions.ORDERS_MANAGE,
  },
  {
    label: menuItemsTexts.clientManagement,
    to: CLIENT_ROUTE_CLIENT_MANAGEMENT,
    icon: mdiAccountSupervisor,
    action: Permissions.USERS_MANAGE,
  },
];

const Aside = ({ user }: { user: IUser }) => {
  const space = useSelector(userSpaceSelector) as IWorkflowInstance;
  const role = user?.userType;
  const { pathname } = useLocation();
  const isMenuMinified = useSelector(applicationMenuMinifiedSelector);
  const [showButton, setShowButton] = useState(false);
  const { logout } = useAuth0();
  const [open, setOpen] = useState(false);
  const intl = useIntl();
  const dispatch = useDispatch();

  if (role === UserType.INVESTOR || role === UserType.UNDERWRITER) {
    if (!space) {
      return null;
    }
    if (
      space.state === LinkStatus.INVITED ||
      space.state === LinkStatus.KYCSUBMITTED
    ) {
      return (
        <aside className="minified">
          <header>
            <button onClick={() => setOpen(!open)}>
              <Icon icon={open ? mdiClose : mdiMenu} color="#fff" />
            </button>
            <Logo withLabel className="desktop minified" />

            <Logo className="mobile minified" />
            <button style={{ visibility: 'hidden' }}>
              <Icon icon={mdiBellRing} width={20} color={colors.mainLight} />
              <span>2</span>
            </button>
          </header>
          <menu className={`${open ? 'opened' : ''} minified`}>
            <div className="mobileSpecificFields">
              <Link
                to="#"
                onClick={() => logout({ returnTo: window.location.origin })}
                className="minified"
              >
                <Icon icon={mdiLogout} width={24} color="#fff" />
                <span>{intl.formatMessage(menuItemsTexts.logout)}</span>
              </Link>
            </div>
          </menu>
        </aside>
      );
    }
  }

  return (
    <aside
      onMouseLeave={(e) => setShowButton(false)}
      onMouseEnter={(e) => setShowButton(true)}
      className={isMenuMinified ? 'minified' : ''}
    >
      <header>
        <button onClick={() => setOpen(!open)}>
          <Icon icon={open ? mdiClose : mdiMenu} color="#fff" />
        </button>
        <Logo
          withLabel
          className={`desktop ${isMenuMinified ? 'minified' : ''}`}
        />

        <Logo className={`mobile ${isMenuMinified ? 'minified' : ''}`} />
        <button style={{ visibility: 'hidden' }}>
          <Icon icon={mdiBellRing} width={20} color={colors.mainLight} />
          <span>2</span>
        </button>
      </header>

      <div
        className={clsx('workspace', {
          minified: isMenuMinified,
        })}
      >
        {user && user.userType === UserType.ISSUER && (
          <span>{user.data.company || ''}</span>
        )}
      </div>
      {showButton && (
        <button
          onClick={() => {
            dispatch(setApplicationMenuMinified(!isMenuMinified));
          }}
        >
          <Icon
            icon={isMenuMinified ? mdiChevronRight : mdiChevronLeft}
            width={24}
            color="#333"
          />
        </button>
      )}
      <menu
        className={`${open ? 'opened' : ''} ${
          isMenuMinified ? 'minified' : ''
        }`}
        id="data-test-id"
      >
        {menuItems(role)
          .filter(({ action }) => hasPermissions(rules[role], action))
          .map((link) => {
            const isActive = pathname === link.to;
            return (
              <div key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`${isMenuMinified ? 'minified' : ''}${
                    isActive ? ' active' : ''
                  }`}
                >
                  {link.icon && (
                    <Icon
                      icon={link.icon}
                      width={24}
                      color={colors.sidebarText}
                    />
                  )}
                  <span>{intl.formatMessage(link.label)}</span>
                </Link>
              </div>
            );
          })}

        <div className="spacer" />

        <hr />

        <div className="mobileSpecificFields">
          <div
            className={isMenuMinified ? 'minified' : ''}
            onClick={() => {
              // eslint-disable-next-line
              (window as any).zE && (window as any).zE('webWidget', 'open');
            }}
          >
            <Icon icon={mdiHelpCircleOutline} color={colors.sidebarText} />
            {intl.formatMessage(menuItemsTexts.support)}
          </div>
          {hasPermissions(rules[role], Permissions.SETTINGS_MANAGE) && (
            <Link
              to={CLIENT_ROUTE_ACCOUNT_SETTINGS}
              onClick={() => setOpen(false)}
              className={isMenuMinified ? 'minified' : ''}
            >
              <Icon
                icon={mdiCogOutline}
                width={24}
                color={colors.sidebarText}
              />
              {intl.formatMessage(menuItemsTexts.settings)}
            </Link>
          )}
          <Link
            to={CLIENT_ROUTE_PROFILE}
            onClick={() => setOpen(false)}
            className={isMenuMinified ? 'minified' : ''}
          >
            <Icon icon={mdiAccount} width={24} color={colors.sidebarText} />
            {intl.formatMessage(menuItemsTexts.profile)}
          </Link>
          <Link
            to="#"
            onClick={() => logout({ returnTo: window.location.origin })}
            className={isMenuMinified ? 'minified' : ''}
          >
            <Icon icon={mdiLogout} width={24} color={colors.sidebarText} />
            <span>{intl.formatMessage(menuItemsTexts.logout)}</span>
          </Link>
        </div>
      </menu>
    </aside>
  );
};

const Layout: React.FC<React.PropsWithChildren<IProps>> = ({
  withAside,
  children,
}: React.PropsWithChildren<IProps>) => {
  const user = useSelector(userSelector);
  const mainContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    EventEmitter.subscribe(Events.EVENT_SCROLL_TOP_MAIN_CONTAINER, () => {
      if (mainContainer.current) {
        mainContainer.current.scroll(0, 0);
      }
    });
    return () => {
      EventEmitter.unsubscribe(Events.EVENT_SCROLL_TOP_MAIN_CONTAINER);
    };
  }, [mainContainer]);

  if (!user) return <></>;

  return (
    <StyledLayout>
      {withAside && <Aside user={user} />}

      <main ref={mainContainer}>
        <TopBar user={user} />

        {children}
      </main>
    </StyledLayout>
  );
};

export default withRouter(Layout);
