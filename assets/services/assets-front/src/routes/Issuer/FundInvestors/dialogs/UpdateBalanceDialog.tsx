import React, { useState, FormEvent } from 'react';
import '../FundInvestors.scss';
import { mdiAlertOctagon, mdiCheckCircle, mdiInformation } from '@mdi/js';

import {
  IToken,
  TokenState,
  AssetType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { IUser, IUserTokenData, IERC1400Balances } from 'User';
import { DataCall } from 'utils/dataLayer';
import { API_MINT, API_FORCE_BURN } from 'constants/apiRoutes';

import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import Input from 'uiComponents/Input';
import { colors, spacing } from 'constants/styles';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import {
  getProductFromToken,
  getClientName,
  formatNumber,
} from 'utils/commonUtils';
import {
  fundInvestorsDialogs,
  fundInvestorAssetsTexts,
} from 'texts/routes/issuer/fundInvestor';
import { useIntl } from 'react-intl';
import Icon from 'uiComponents/Icon';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps {
  token: IToken;
  investor: IUser;
  callback: (
    affectedInvestors: Array<string>,
    affectedAssets: Array<string>,
  ) => void;
}

const UpdateBalanceDialog: React.FC<IProps> = ({
  token,
  investor,
  callback,
}: IProps) => {
  const tokenRelatedData = investor.tokenRelatedData as IUserTokenData;

  const balances = tokenRelatedData.balances as IERC1400Balances;

  const oldBalance = `${balances ? balances.total : 0}`;
  const [balance, setBalance] = useState(oldBalance);
  const [loading, setLoading] = useState(false);
  const { shareClasses, assetType } = getProductFromToken(token);
  const isCommodity = assetType === AssetType.PHYSICAL_ASSET;
  const intl = useIntl();
  return (
    <form
      className="_route_issuer_fundInvestors_dialog"
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        try {
          event.preventDefault();
          setLoading(true);
          if (parseInt(balance) > parseInt(oldBalance)) {
            await DataCall({
              method: API_MINT.method,
              path: API_MINT.path(token.id),
              body: {
                recipientId: investor.id,
                quantity: parseInt(balance) - parseInt(oldBalance),
                class: shareClasses[0].key,
                state: TokenState.ISSUED,
                sendNotification: true,
              },
            });
          } else {
            await DataCall({
              method: API_FORCE_BURN.method,
              path: API_FORCE_BURN.path(token.id),
              body: {
                investorId: investor.id,
                quantity: parseInt(oldBalance) - parseInt(balance),
                class: shareClasses[0].key,
                state: TokenState.ISSUED,
                sendNotification: true,
              },
            });
          }
          EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
          callback([investor.id], [token.id]);
          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(fundInvestorsDialogs.updateBalance, {
                name: token.name,
                className: shareClasses[0].name || shareClasses[0].key,
              }),
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
                fundInvestorsDialogs.updateBalanceError,
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
      <div className="dialogMessage">
        <Icon icon={mdiInformation} color="#4D79FF" />
        <span>
          {intl.formatMessage(fundInvestorsDialogs.sharesUpdatesMessage)}
        </span>
      </div>
      <div
        style={{
          borderBottom: '1px solid #dfe0e5',
          padding: '16px 32px',
        }}
      >
        <h3>{intl.formatMessage(fundInvestorsDialogs.asset)}</h3>
        <div className="dialogLabel">
          <h2>
            {token.name} - {shareClasses[0].name || shareClasses[0].key}
          </h2>
        </div>
        <h3>{intl.formatMessage(fundInvestorsDialogs.investor)}</h3>
        <div className="dialogLabel">
          <h2>{getClientName(investor)}</h2>
        </div>

        <Input
          onChange={(e, newValue) => setBalance(newValue as string)}
          min="0"
          type="number"
          disabled={loading}
          required
          label={intl.formatMessage(fundInvestorsDialogs.updatedBalance)}
          style={{ marginBottom: spacing.small, marginTop: spacing.small }}
          rightTag={intl.formatMessage(fundInvestorsDialogs.shares)}
        />
        <span
          style={{
            fontSize: 14,
            color: '#475166',
          }}
        >
          {intl.formatMessage(fundInvestorsDialogs.currentBalance, {
            amount: formatNumber(parseInt(oldBalance)),
          })}
        </span>

        <Checkbox
          style={{
            marginTop: '16px',
          }}
          required
          disabled={loading}
          label={intl.formatMessage(
            isCommodity
              ? fundInvestorsDialogs.verifySharesTransactionCheckbox
              : fundInvestorsDialogs.verifyTokensTransactionCheckbox,
          )}
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
          disabled={parseInt(balance) === parseInt(oldBalance)}
          style={{ marginLeft: '16px' }}
          type="submit"
          isLoading={loading}
          label={intl.formatMessage(
            fundInvestorAssetsTexts.updateBalanceConfirm,
          )}
          size="small"
        />
      </footer>
    </form>
  );
};

export default UpdateBalanceDialog;
