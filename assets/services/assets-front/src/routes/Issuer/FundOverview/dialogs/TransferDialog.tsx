import React, { useState, FormEvent } from 'react';
import { useIntl } from 'react-intl';

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
import Input from 'uiComponents/Input';
import Button from 'uiComponents/Button';
import Select from 'uiComponents/Select';
import Checkbox from 'uiComponents/Checkbox';
import { colors } from 'constants/styles';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';

import { getClientName, getProductFromToken } from 'utils/commonUtils';

import { decimalisationValue } from 'utils/currencyFormat';

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

const TransferDialog: React.FC<IProps> = ({
  token,
  investors,
  callback,
}: IProps) => {
  const intl = useIntl();

  const [amount, setAmount] = useState(0);
  const [shares, setShares] = useState(0);

  const [loading, setLoading] = useState(false);

  const [sender, setSender] = useState<IUser>();
  const [recipient, setRecipient] = useState<IUser>();
  const [filteredInvestors, setFilteredInvestors] =
    useState<Array<IUser>>(investors);

  const { shareClasses, assetType } = getProductFromToken(token);

  const minUnit = decimalisationValue(shareClasses[0].decimalisation);

  const isFixedRateBond = assetType === AssetType.FIXED_RATE_BOND;
  const isSyndicatedLoan = assetType === AssetType.SYNDICATED_LOAN;
  const isCommodity = assetType === AssetType.PHYSICAL_ASSET;

  function handleSenderChange(userId: string): void {
    const investor = investors.find((user) => user.id === userId);

    setSender(investor);

    if (investor) {
      const tokenRelatedData = investor.tokenRelatedData as IUserTokenData;

      const balances = tokenRelatedData.balances as IERC1400Balances;

      setShares(balances ? balances?.total : 0);

      setFilteredInvestors(investors.filter((user) => user.id !== investor.id));
    }
  }

  function handleRecipientChange(userId: string): void {
    const investor = investors.find((user) => user.id === userId);

    setRecipient(investor);
  }

  function getInvestors(array: Array<IUser>): Array<any> {
    return array.map((user) => ({
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

          if (!sender || !recipient) {
            return;
          }

          setLoading(true);

          await DataCall({
            method: API_FORCE_TRANSFER.method,
            path: API_FORCE_TRANSFER.path(token.id),
            body: {
              investorId: sender.id,
              recipientId: recipient.id,
              class: shareClasses[0].key,
              quantity: amount,
              sendNotification: true,
              state: TokenState.ISSUED,
            },
          });

          EventEmitter.dispatch(Events.EVENT_CLOSE_MODAL);
          callback([sender.id, recipient.id], [token.id]);

          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                fundInvestorsDialogs.transferSuccess,
                {
                  amount,
                  token: token.name,
                  fromInvestor: getClientName(sender),
                  toInvestor: getClientName(recipient),
                  className: shareClasses[0].name || shareClasses[0].key,
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
                fundInvestorsDialogs.transferBalanceError,
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

        <h3>{intl.formatMessage(fundInvestorsDialogs.sender)}</h3>
        <div>
          <Select
            required
            disabled={loading}
            className="investorSelector"
            placeholder={intl.formatMessage(
              fundInvestorsDialogs.selectInvestor,
            )}
            options={getInvestors(investors)}
            onChange={(userId) => handleSenderChange(userId)}
          ></Select>
        </div>

        <h3>{intl.formatMessage(fundInvestorsDialogs.recipient)}</h3>
        <div>
          <Select
            required
            disabled={loading}
            className="investorSelector"
            options={getInvestors(filteredInvestors)}
            placeholder={intl.formatMessage(
              fundInvestorsDialogs.selectInvestor,
            )}
            onChange={(userId) => handleRecipientChange(userId)}
          ></Select>
        </div>

        <Input
          required
          min={minUnit ? minUnit : '1'}
          step={minUnit ? minUnit : '1'}
          type="number"
          max={shares}
          className="balanceInput"
          disabled={loading || shares === 0 || !sender || !recipient}
          rightTag={
            isFixedRateBond
              ? intl.formatMessage(fundInvestorsDialogs.units)
              : intl.formatMessage(fundInvestorsDialogs.shares)
          }
          label={intl.formatMessage(fundInvestorsDialogs.quantityToTransfer)}
          onChange={(e, newValue) => setAmount(parseFloat(newValue as string))}
          labelDescription={intl.formatMessage(
            fundInvestorsDialogs.availableBalance,
            {
              num: shares,
            },
          )}
        />

        <Checkbox
          required
          disabled={loading}
          className="verifyQuantityCheckbox"
          label={intl.formatMessage(
            isCommodity
              ? fundInvestorsDialogs.verifySharesTransactionCheckbox
              : fundInvestorsDialogs.verifyTokensTransactionCheckbox,
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
                  fundInvestorsMessages.investorsListActionsTransferLoanUnitsModal,
                )
              : isFixedRateBond
              ? intl.formatMessage(
                  fundInvestorsMessages.investorsListActionsTransferBondUnitsModal,
                )
              : intl.formatMessage(
                  fundInvestorsMessages.investorsListActionsTransferSharesModal,
                )
          }
        />
      </footer>
    </form>
  );
};

export default TransferDialog;
