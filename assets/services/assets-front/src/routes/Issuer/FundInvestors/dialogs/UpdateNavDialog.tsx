import React, { useState, FormEvent } from 'react';
import { mdiAlertOctagon, mdiCheckCircle } from '@mdi/js';

import { IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';

import { DataCall } from 'utils/dataLayer';
import { API_CREATE_NAV } from 'constants/apiRoutes';

import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import Input from 'uiComponents/Input';
import { colors } from 'constants/styles';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { getProductFromToken, getTokenCurrency } from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';
import { useIntl } from 'react-intl';
import { fundInvestorsDialogs } from 'texts/routes/issuer/fundInvestor';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps {
  token: IToken;
  callback: () => void;
}

const UpdateNavDialog: React.FC<IProps> = ({ token, callback }: IProps) => {
  const { shareClasses } = getProductFromToken(token);
  const oldBalance = shareClasses[0].nav.value || 0;
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const intl = useIntl();

  return (
    <form
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        try {
          event.preventDefault();
          setLoading(true);

          await DataCall({
            method: API_CREATE_NAV.method,
            path: API_CREATE_NAV.path(token.id),
            body: {
              tokenId: token.id,
              navValue: balance,
              assetClass: shareClasses[0].key,
              navDate: new Date().toISOString(),
            },
          });

          EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
          callback();
          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                fundInvestorsDialogs.updateShareClass,
                {
                  name: token.name,
                  className: shareClasses[0].name || shareClasses[0].key,
                },
              ),
              icon: mdiCheckCircle,
              color: colors.success,
              isDark: true,
            }),
          );
        } catch (error) {
          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                fundInvestorsDialogs.updateShareClassError,
              ),
              secondaryMessage: String(error),
              icon: mdiAlertOctagon,
              color: colors.error,
              isDark: true,
            }),
          );
          setLoading(false);
        }
      }}
    >
      <div
        style={{
          borderBottom: '1px solid #dfe0e5',
          padding: '16px 32px',
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: '#475166',
          }}
        >
          {token.name} - {shareClasses[0].name || shareClasses[0].key}
        </h2>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '16px',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              color: '#475166',
            }}
          >
            <span style={{ fontSize: '12px' }}>
              {intl.formatMessage(fundInvestorsDialogs.updateSharePrice)}
            </span>
            <p>{currencyFormat(oldBalance, getTokenCurrency(token))}</p>
          </div>
          <Input
            onChange={(e, newValue) => {
              setBalance(parseFloat(newValue as string));
            }}
            min="0"
            type="number"
            disabled={loading}
            required
            step=".01"
            label={intl.formatMessage(fundInvestorsDialogs.updatedSharePrice)}
          />
        </div>

        <Checkbox
          style={{
            marginTop: '16px',
          }}
          required
          disabled={loading}
          label={intl.formatMessage(fundInvestorsDialogs.confirmSharePrice)}
        />
      </div>

      <footer
        style={{
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          label={intl.formatMessage(fundInvestorsDialogs.updateBalanceCancel)}
          onClick={() => EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL)}
          tertiary
          size="small"
          color="#333"
        />
        <Button
          style={{ marginLeft: '16px' }}
          type="submit"
          isLoading={loading}
          label={intl.formatMessage(fundInvestorsDialogs.updateBalance)}
          size="small"
          disabled={oldBalance === balance}
        />
      </footer>
    </form>
  );
};

export default UpdateNavDialog;
