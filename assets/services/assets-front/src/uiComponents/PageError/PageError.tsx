import React from 'react';
import CSS from 'csstype';

import Button from 'uiComponents/Button';
import { pageErrorTexts } from 'texts/components/pageError';

import './pageErrorStyles.scss';
import { colors } from 'constants/styles';
import { mdiLogout, mdiReload } from '@mdi/js';
import { useAuth0 } from 'auth/auth0';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';

interface IProps {
  readonly className?: string;
  readonly errorCode?: number | string;
  readonly errorMessage?: string;
  readonly id?: string;
  readonly style?: CSS.Properties;
}

const PageError: React.FC<IProps> = ({
  className = '',
  id,
  style = {},
  errorCode = 500,
  errorMessage,
}: IProps) => {
  const { logout } = useAuth0();
  const intl = useIntl();
  return (
    <div className={`uiComponent_pageError ${className}`} id={id} style={style}>
      <h1>{`${intl.formatMessage(pageErrorTexts.error)}: ${errorCode}`}</h1>

      <p>{errorMessage || intl.formatMessage(pageErrorTexts.defaultMessage)}</p>

      <Button
        size="small"
        onClick={() => window.location.reload()}
        color={colors.error}
        iconLeft={mdiReload}
        label={intl.formatMessage(pageErrorTexts.reloadPageLabel)}
      />
      <Button
        onClick={() => logout({ returnTo: window.location.origin })}
        className="minified"
        label={intl.formatMessage(CommonTexts.logout)}
        secondary
        size="small"
        style={{ marginTop: '10px' }}
        color={colors.error}
        iconLeft={mdiLogout}
      />
    </div>
  );
};

export default React.memo(PageError);
