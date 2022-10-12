import { colors } from 'constants/styles';
import CSS from 'csstype';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from 'uiComponents/Button';
import Icon from 'uiComponents/Icon';
import { Breadcrumbs, IBreadcrumb } from 'uiComponents/Breadcrumbs';
import { capitalizeFirstLetter } from 'utils/commonUtils';
import { formatPathName } from 'utils/layout';

import { mdiArrowLeft } from '@mdi/js';

import StyledPageTitle from './StyledPageTitle';

export interface NavigationAction {
  icon?: string;
  label: string;
  title?: string;
  color?: string;
  href?: string;
  disabled?: boolean;
  style?: CSS.Properties;
  isLoading?: boolean;
  secondary?: boolean;
  action?: () => void;
  size?: 'small' | 'big';
}

export interface TabNavigation {
  label: string;
  href: string;
  isActive?: boolean;
}
interface IProps {
  readonly backLink?:
    | string
    | {
        label: string;
        to: string;
      };
  readonly className?: string;
  readonly id?: string;
  readonly style?: CSS.Properties;
  readonly tabNavigation?: Array<TabNavigation>;
  readonly tabActions?: Array<NavigationAction>;
  readonly customTabActions?: Array<any>;
  readonly title: string;
  readonly subTitle?: string | React.ReactNode;
  readonly children?: React.ReactNode;
  readonly withBreadcrumbs?: boolean;
  readonly customBreadcrumbs?: IBreadcrumb[];
}

const PageTitle: React.FC<IProps> = ({
  backLink,
  className = '',
  id,
  style = {},
  tabNavigation = [],
  tabActions = [],
  customTabActions = [],
  title = 'YOU MUST SET A TITLE',
  subTitle,
  children,
  withBreadcrumbs = false,
  customBreadcrumbs,
}: IProps) => {
  const { pathname } = useLocation();
  const pathnameParts = pathname.split('/');

  return (
    <StyledPageTitle
      className={`${className} ${
        tabNavigation && tabNavigation.length > 0 ? 'hasTabNavigation' : ''
      }`}
      id={id}
      style={style}
    >
      <div>
        {backLink && typeof backLink === 'string' && (
          <Link
            to="#"
            className="backlink"
            onClick={() => window.history.back()}
          >
            <Icon icon={mdiArrowLeft} width={18} color={colors.main} />
            <span style={{ color: colors.main }}>{backLink}</span>
          </Link>
        )}
        {backLink && typeof backLink !== 'string' && (
          <Link to={backLink.to} className="backlink">
            <Icon icon={mdiArrowLeft} width={18} color={colors.main} />
            <span style={{ color: colors.main }}>{backLink.label}</span>
          </Link>
        )}
        {withBreadcrumbs && (
          <Breadcrumbs
            paths={
              customBreadcrumbs
                ? customBreadcrumbs
                : pathnameParts.map((path, index) => ({
                    to: pathnameParts.slice(0, index + 1).join('/'),
                    label: capitalizeFirstLetter(formatPathName(path)),
                  }))
            }
          />
        )}
        <span className="title">{title}</span>
        {subTitle && <span>{subTitle}</span>}
      </div>

      {children && children}

      {tabActions.length > 0 && (
        <div className="tabActions">
          {tabActions.map((tabNavigationAction, idx) => (
            <Button
              key={`tabNavigationAction-${idx}`}
              label={tabNavigationAction.label}
              secondary={tabNavigationAction.secondary}
              iconLeft={tabNavigationAction.icon}
              title={tabNavigationAction.title}
              isLoading={tabNavigationAction.isLoading}
              disabled={tabNavigationAction.disabled}
              size={tabNavigationAction.size || 'small'}
              style={tabNavigationAction.style}
              color={
                tabNavigationAction.secondary
                  ? '#777'
                  : tabNavigationAction.color || colors.main
              }
              href={tabNavigationAction.href || undefined}
              onClick={tabNavigationAction.action || undefined}
            />
          ))}

          {customTabActions.length > 0 &&
            customTabActions.map((customTabAction) => customTabAction)}
        </div>
      )}

      {tabNavigation.length > 0 && (
        <div className="tabNavigation">
          <div>
            {tabNavigation.map((item) => (
              <Link
                to={item.href}
                key={item.href}
                className={item.isActive ? 'active' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </StyledPageTitle>
  );
};

export default PageTitle;
