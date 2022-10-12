import React, { useState, FormEvent } from 'react';

import { useIntl } from 'react-intl';

import { mdiAlertOctagon, mdiCheckCircle, mdiInformation } from '@mdi/js';

import {
  IToken,
  TokenState,
  AssetType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';

import { IUser, IUserTokenData, IERC1400Balances } from 'User';

import { getClientName, getProductFromToken } from 'utils/commonUtils';

import { DataCall } from 'utils/dataLayer';
import { decimalisationValue } from 'utils/currencyFormat';

import { colors } from 'constants/styles';
import { API_FORCE_BURN } from 'constants/apiRoutes';

import Icon from 'uiComponents/Icon';
import Input from 'uiComponents/Input';
import Select from 'uiComponents/Select';
import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';

import {
  fundInvestorsDialogs,
  fundInvestorsMessages,
} from 'texts/routes/issuer/fundInvestor';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps {
  token: IToken;
  investors: Array<IUser>;
  callback: (
    affectedAssets: Array<string>,
    affectedInvestors: Array<string>,
  ) => void;
}

const CancelDialog: React.FC<IProps> = ({
  token,
  investors,
  callback,
}: IProps) => {
  const intl = useIntl();

  const [amount, setAmount] = useState(0);
  const [shares, setShares] = useState(0);
  const [loading, setLoading] = useState(false);
  const [investor, setInvestor] = useState<IUser>();

  const { shareClasses, assetType } = getProductFromToken(token);

  const isFixedRateBond = assetType === AssetType.FIXED_RATE_BOND;
  const isSyndicatedLoan = assetType === AssetType.SYNDICATED_LOAN;

  const minUnit = decimalisationValue(shareClasses[0].decimalisation);

  function handleInvestorChange(userId: string): void {
    const investor = investors.find((user) => user.id === userId);

    setInvestor(investor);

    if (investor) {
      const tokenRelatedData = (investor as IUser)
        .tokenRelatedData as IUserTokenData;

      const balances = tokenRelatedData.balances as IERC1400Balances;

      setShares(balances ? balances.total : 0);
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
            method: API_FORCE_BURN.method,
            path: API_FORCE_BURN.path(token.id),
            body: {
              investorId: investor.id,
              recipientId: investor.id,
              class: shareClasses[0].key,
              quantity: amount,
              sendNotification: true,
              state: TokenState.ISSUED,
            },
          });

          EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
          callback([investor.id, investor.id], [token.id]);

          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                fundInvestorsDialogs.cancelBondUnitsSuccess,
                {
                  quantity: amount,
                },
              ),
              isDark: true,
              icon: mdiCheckCircle,
              color: colors.success,
            }),
          );
        } catch (error) {
          setLoading(false);
          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                fundInvestorsDialogs.cancelBondUnitsError,
              ),
              isDark: true,
              color: colors.error,
              icon: mdiAlertOctagon,
              secondaryMessage: String(error),
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
            placeholder={intl.formatMessage(
              fundInvestorsDialogs.selectInvestor,
            )}
            options={getInvestors()}
            onChange={(userId) => handleInvestorChange(userId)}
          ></Select>
        </div>

        <Input
          min={minUnit ? minUnit : '1'}
          required
          step={minUnit ? minUnit : '1'}
          type="number"
          max={shares}
          className="balanceInput"
          disabled={loading || shares === 0}
          rightTag={
            isFixedRateBond
              ? intl.formatMessage(fundInvestorsDialogs.units)
              : intl.formatMessage(fundInvestorsDialogs.shares)
          }
          onChange={(event, newValue) =>
            setAmount(parseFloat(newValue as string))
          }
          label={
            isSyndicatedLoan
              ? intl.formatMessage(fundInvestorsDialogs.loanUnitsToCancel)
              : isFixedRateBond
              ? intl.formatMessage(fundInvestorsDialogs.bondUnitsToCancel)
              : intl.formatMessage(fundInvestorsDialogs.fundSharesToCancel)
          }
          labelDescription={
            <span>
              {intl.formatMessage(fundInvestorsDialogs.currentBalance, {
                amount: shares,
              })}
            </span>
          }
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
          size="small"
          type="submit"
          isLoading={loading}
          disabled={shares === 0}
          className="footerButton"
          label={
            isSyndicatedLoan
              ? intl.formatMessage(
                  fundInvestorsMessages.investorsListActionsCancelLoanUnitsModal,
                )
              : isFixedRateBond
              ? intl.formatMessage(
                  fundInvestorsMessages.investorsListActionsCancelBondUnitsModal,
                )
              : intl.formatMessage(
                  fundInvestorsMessages.investorsListActionsCancelSharesModal,
                )
          }
        />
      </footer>
    </form>
  );
};

export default CancelDialog;
