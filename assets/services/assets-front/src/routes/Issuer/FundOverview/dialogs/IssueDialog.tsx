import React, { useState, FormEvent } from 'react';

import '../../FundInvestors/FundInvestors.scss';

import { mdiAlertOctagon, mdiCheckCircle, mdiInformation } from '@mdi/js';

import { IUser, IUserTokenData, IERC1400Balances } from 'User';

import {
  IToken,
  TokenState,
  AssetType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';

import {
  formatNumber,
  getClientName,
  getProductFromToken,
} from 'utils/commonUtils';

import { DataCall } from 'utils/dataLayer';

import { decimalisationValue } from 'utils/currencyFormat';

import { colors } from 'constants/styles';

import { API_MINT } from 'constants/apiRoutes';

import Icon from 'uiComponents/Icon';
import Input from 'uiComponents/Input';
import Button from 'uiComponents/Button';
import Select from 'uiComponents/Select';
import Checkbox from 'uiComponents/Checkbox';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';

import {
  fundInvestorsDialogs,
  fundInvestorsMessages,
} from 'texts/routes/issuer/fundInvestor';

import { useIntl } from 'react-intl';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps {
  token: IToken;
  investors: Array<IUser>;
  callback: (
    affectedAssets: Array<string>,
    affectedInvestors: Array<string>,
  ) => void;
}

const IssueDialog: React.FC<IProps> = ({
  token,
  investors,
  callback,
}: IProps) => {
  const intl = useIntl();

  const [loading, setLoading] = useState(false);

  const [oldBalance, setOldBalance] = useState('0');
  const [balance, setBalance] = useState(oldBalance);

  const [investor, setInvestor] = useState<IUser>();

  const { shareClasses, assetType } = getProductFromToken(token);

  const minUnit = decimalisationValue(shareClasses[0].decimalisation);

  const isFixedRateBond = assetType === AssetType.FIXED_RATE_BOND;
  const isSyndicatedLoan = assetType === AssetType.SYNDICATED_LOAN;

  function handleInvestorChange(userId: string): void {
    const investor = investors.find((user) => user.id === userId);
    setInvestor(investor);

    if (investor) {
      const tokenRelatedData = investor.tokenRelatedData as IUserTokenData;

      const balances = tokenRelatedData.balances as IERC1400Balances;

      setOldBalance(`${balances ? balances.total : 0}`);
      setBalance(oldBalance);
    }
  }

  function getInvestors(): Array<any> {
    return investors.map((user) => ({
      label: getClientName(user),
      value: user.id,
    }));
  }

  return (
    <form
      className="_route_issuer_fundInvestors_dialog"
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        try {
          event.preventDefault();

          if (!investor) {
            return;
          }

          setLoading(true);

          await DataCall({
            method: API_MINT.method,
            path: API_MINT.path(token.id),
            body: {
              recipientId: investor.id,
              class: shareClasses[0].key,
              quantity: parseFloat(balance),
              sendNotification: true,
              state: TokenState.ISSUED,
            },
          });

          EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);

          callback([investor.id], [token.id]);

          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                fundInvestorsDialogs.issueBondUnitsSuccess,
                {
                  quantity: balance,
                },
              ),
              isDark: true,
              icon: mdiCheckCircle,
              color: colors.success,
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
              isDark: true,
              color: colors.error,
              icon: mdiAlertOctagon,
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

      <div className="assetInput">
        <h3>{intl.formatMessage(fundInvestorsDialogs.asset)}</h3>
        <div className="dialogLabel">
          <h2>
            {token.name} - {shareClasses[0].name || shareClasses[0].key}
          </h2>
        </div>

        <h3>{intl.formatMessage(fundInvestorsDialogs.investor)}</h3>
        <div>
          <Select
            required
            disabled={loading}
            className="investorSelector"
            options={getInvestors()}
            onChange={(userId) => {
              handleInvestorChange(userId);
            }}
            placeholder={intl.formatMessage(
              fundInvestorsDialogs.selectInvestor,
            )}
          ></Select>
        </div>

        <Input
          min={minUnit ? minUnit : '0'}
          step={minUnit ? minUnit : '1'}
          required
          type="number"
          disabled={loading}
          className="balanceInput"
          labelDescription={intl.formatMessage(
            fundInvestorsDialogs.currentBalance,
            {
              amount: formatNumber(parseFloat(oldBalance)),
            },
          )}
          onChange={(e, newValue) => setBalance(newValue as string)}
          rightTag={
            isFixedRateBond
              ? intl.formatMessage(fundInvestorsDialogs.units)
              : intl.formatMessage(fundInvestorsDialogs.shares)
          }
          label={intl.formatMessage(fundInvestorsDialogs.updatedBalance)}
        />

        <Checkbox
          required
          disabled={loading}
          className="verifyQuantityCheckbox"
          label={intl.formatMessage(
            fundInvestorsDialogs.verifyQuantityCheckbox,
          )}
        />
      </div>

      <footer className="footer">
        <Button
          size="small"
          label="Cancel"
          onClick={() => EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL)}
        />
        <Button
          type="submit"
          isLoading={loading}
          className="footerButton"
          disabled={parseFloat(balance) === parseFloat(oldBalance)}
          label={
            isSyndicatedLoan
              ? intl.formatMessage(
                  fundInvestorsMessages.investorsListActionsIssueLoanUnitsModal,
                )
              : isFixedRateBond
              ? intl.formatMessage(
                  fundInvestorsMessages.investorsListActionsIssueBondUnitsModal,
                )
              : intl.formatMessage(
                  fundInvestorsMessages.investorsListActionsIssueSharesModal,
                )
          }
          size="small"
        />
      </footer>
    </form>
  );
};

export default IssueDialog;
