import React, { useState, FormEvent } from 'react';
import { mdiAlertOctagon, mdiCheckCircle, mdiInformation } from '@mdi/js';

import {
  IToken,
  TokenState,
  AssetType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { IUser, IUserTokenData, IERC1400Balances } from 'User';
import { DataCall } from 'utils/dataLayer';
import { API_FORCE_TRANSFER } from 'constants/apiRoutes';

import Icon from 'uiComponents/Icon';
import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import Input from 'uiComponents/Input';
import Select from 'uiComponents/Select';
import { colors, spacing } from 'constants/styles';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import {
  getClientName,
  getTokenCurrency,
  getProductFromToken,
} from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';
import { useIntl } from 'react-intl';
import { fundInvestorsDialogs } from 'texts/routes/issuer/fundInvestor';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps {
  token: IToken;
  investor: IUser;
  investors: Array<IUser>;
  callback: (
    affectedInvestors: Array<string>,
    affectedAssets: Array<string>,
  ) => void;
}

const TransferBalanceDialog: React.FC<IProps> = ({
  token,
  investor,
  investors,
  callback,
}: IProps) => {
  const [selectedInvestor, setSelectedInvestor] = useState<IUser>();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const { shareClasses, assetType } = getProductFromToken(token);
  const filteredInvestors = investors.filter((user) => user.id !== investor.id);
  const tokenRelatedData = investor.tokenRelatedData as IUserTokenData;

  const balances = tokenRelatedData.balances as IERC1400Balances;

  const intl = useIntl();

  const shares = balances ? balances.total : 0;
  const currentNav = shareClasses[0].nav.value || 0;
  const isCommodity = assetType === AssetType.PHYSICAL_ASSET;
  return (
    <form
      className="_route_issuer_fundInvestors_dialog"
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        try {
          event.preventDefault();
          if (!selectedInvestor) {
            return;
          }
          setLoading(true);
          await DataCall({
            method: API_FORCE_TRANSFER.method,
            path: API_FORCE_TRANSFER.path(token.id),
            body: {
              investorId: investor.id,
              recipientId: selectedInvestor.id,
              quantity: amount,
              class: shareClasses[0].key,
              state: TokenState.ISSUED,
              sendNotification: true,
            },
          });
          EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
          callback([investor.id, selectedInvestor.id], [token.id]);
          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                fundInvestorsDialogs.transferSuccess,
                {
                  amount,
                  token: token.name,
                  className: shareClasses[0].name || shareClasses[0].key,
                  fromInvestor: getClientName(investor),
                  toInvestor: getClientName(selectedInvestor),
                },
              ),
              icon: mdiCheckCircle,
              color: colors.success,
              isDark: true,
            }),
          );
        } catch (error) {
          setLoading(false);
          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                fundInvestorsDialogs.transferBalanceError,
              ),
              secondaryMessage: String(error),
              icon: mdiAlertOctagon,
              color: colors.error,
              isDark: true,
            }),
          );
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
        <h3>{intl.formatMessage(fundInvestorsDialogs.sender)}</h3>
        <div className="dialogLabel">
          <h2>{getClientName(investor)}</h2>
        </div>

        <h3>{intl.formatMessage(fundInvestorsDialogs.recipient)}</h3>
        <div>
          <Select
            placeholder={intl.formatMessage(
              fundInvestorsDialogs.selectInvestor,
            )}
            disabled={loading}
            options={filteredInvestors.map((user) => ({
              label: getClientName(user),
              value: user.id,
            }))}
            required
            onChange={(userId) =>
              setSelectedInvestor(
                filteredInvestors.find((user) => user.id === userId),
              )
            }
            style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            {getClientName(investor)}
          </Select>
        </div>

        <Input
          style={{
            maxWidth: '300px',
            marginBottom: spacing.small,
          }}
          onChange={(e, newValue) => setAmount(parseInt(newValue as string))}
          min="1"
          disabled={loading || shares === 0}
          max={shares}
          type="number"
          required
          label={intl.formatMessage(fundInvestorsDialogs.quantityToTransfer)}
          rightTag={intl.formatMessage(fundInvestorsDialogs.shares)}
        />
        <span
          style={{
            marginLeft: 5,
          }}
        >
          {intl.formatMessage(fundInvestorsDialogs.balance, {
            num: currencyFormat(shares * currentNav, getTokenCurrency(token)),
          })}
        </span>
        <Checkbox
          style={{
            marginTop: '16px',
          }}
          disabled={loading}
          required
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
          style={{ marginLeft: '16px' }}
          type="submit"
          label={intl.formatMessage(fundInvestorsDialogs.completeTransfer)}
          isLoading={loading}
          disabled={shares === 0}
          size="small"
        />
      </footer>
    </form>
  );
};

export default TransferBalanceDialog;
