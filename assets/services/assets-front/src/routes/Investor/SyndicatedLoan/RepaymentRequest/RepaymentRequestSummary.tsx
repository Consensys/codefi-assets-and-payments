import {
  BaseInterestRate,
  IToken,
  IWorkflowInstance,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  AssetData,
  AssetStatus,
  OrderSubtotal,
  OrderSummary,
  OrderSummaryHeading,
  OrderTotal,
} from 'uiComponents/OrderSummary';
import { IUser } from 'User';
import {
  differenceInCalendarMonths,
  formatDate,
  getLoanDataFromToken,
  getClientName,
  getWorkflowInstanceStatusStyle,
  getUserMetadata,
} from 'utils/commonUtils';

import Button from 'uiComponents/Button';
import React from 'react';
import { currencyFormat } from 'utils/currencyFormat';
import { getRepaymentBreakdown } from './repaymentUtils';
import { getStatus } from '../../SubscriptionSummary/SubscriptionSummary';
import { useIntl } from 'react-intl';
import {
  ClassData,
  combineDateAndTime,
} from 'routes/Issuer/AssetIssuance/assetTypes';

interface IProps {
  token: IToken;
  facility: ClassData;
  order?: IWorkflowInstance;
  assetHref: string;
  isIssuerSide?: boolean;
  isBorrowerSide?: boolean;
  requestRepaymentAmount?: number;
  recipient?: IUser;
}

export const RepaymentRequestSummary: React.FC<IProps> = ({
  token,
  facility,
  order,
  assetHref,
  isIssuerSide,
  requestRepaymentAmount = 0,
  isBorrowerSide,
  recipient,
}: IProps) => {
  const intl = useIntl();
  const { currency, issuer, underwriterId, borrower } =
    getLoanDataFromToken(token);

  const orderTotalSign = isBorrowerSide ? '-' : isIssuerSide ? '' : '+';

  const startDate = combineDateAndTime(
    facility.initialSubscription.startDate,
    facility.initialSubscription.startHour,
  );
  const cutoffDate = combineDateAndTime(
    facility.initialSubscription.cutoffDate,
    facility.initialSubscription.cutoffHour,
  );

  const interestPeriod = differenceInCalendarMonths(
    new Date(cutoffDate || ''),
    new Date(startDate || ''),
  );

  const {
    repaymentAmount,
    totalRepaymentAmount,
    earlyRepaymentFee,
    repaymentInterest,
    utilisationDate,
    totalInterestRate,
  } = getRepaymentBreakdown(token, facility, order, requestRepaymentAmount);

  return (
    <>
      <div>
        <OrderSummaryHeading>Order Summary</OrderSummaryHeading>
      </div>
      <OrderSummary>
        <OrderTotal>
          <p>
            {totalRepaymentAmount ? orderTotalSign : ''}
            {currencyFormat(
              totalRepaymentAmount,
              currency,
              undefined,
              2,
            ).replace(/\.00$/, '')}
          </p>
        </OrderTotal>
        {totalRepaymentAmount > 0 && (
          <OrderSubtotal>
            {earlyRepaymentFee
              ? 'Inclusive of Early Repayment Fee and Interest'
              : 'Inclusive of Interest'}
          </OrderSubtotal>
        )}
        <AssetData>
          {order && (
            <AssetStatus>
              <span>Status</span>
              <div
                style={{
                  padding: '2px 8px',
                  fontSize: 12,
                  borderRadius: 4,
                  marginTop: '10px',
                  ...getWorkflowInstanceStatusStyle(order, false),
                }}
              >
                {getStatus(intl, order, false)}
              </div>
            </AssetStatus>
          )}
          <div>
            <span>Asset</span>
            <div>
              {`${token.name} `}
              <Button
                label="View Loan"
                tertiary
                size="small"
                style={{ padding: '0 0 0 16px', fontWeight: 400 }}
                href={assetHref}
              />
            </div>
          </div>
        </AssetData>
      </OrderSummary>

      <OrderSummary>
        <h2>Details</h2>
        <ul>
          <li>
            <span>Type</span>
            <span>Repayment</span>
          </li>
          <li>
            <span>Facility</span>
            <span>{facility.name}</span>
          </li>
          <li>
            <span>Repayment</span>
            <span>
              {currencyFormat(repaymentAmount, currency, undefined, 2).replace(
                '.00',
                '',
              )}
            </span>
          </li>
          {earlyRepaymentFee > 0 && (
            <li>
              <span>Early Repayment Fee</span>
              <span>
                {currencyFormat(
                  earlyRepaymentFee,
                  currency,
                  undefined,
                  2,
                ).replace(/\.00$/, '')}
              </span>
            </li>
          )}
          <li>
            <span>Interest</span>
            <span>
              {currencyFormat(
                repaymentInterest,
                currency,
                undefined,
                2,
              ).replace(/\.00$/, '')}
            </span>
          </li>
          <li>
            <span>Utilisation Date</span>
            <span>{formatDate(utilisationDate)}</span>
          </li>
          <li>
            <span>Interest Period</span>
            <span>
              {interestPeriod} month{interestPeriod === 1 ? '' : 's'}
            </span>
          </li>
          <li>
            <span>Reference Rate</span>
            <span>
              {facility.interest.baseRate === BaseInterestRate.CASH_RATE
                ? 'Cash'
                : facility.interest.baseRate}
            </span>
          </li>
          <li>
            <span>Margin</span>
            <span>{facility.interest.margin}%</span>
          </li>
          <li>
            <span>Total Interest Rate</span>
            <span>{totalInterestRate}%</span>
          </li>

          {borrower && (
            <li>
              <span>Borrower</span>
              <span>{getClientName(borrower as IUser)}</span>
            </li>
          )}
          {recipient ? (
            <li>
              <span>
                {recipient.id === underwriterId ? 'Lead Arranger' : 'Lender'}
              </span>
              <span>{getClientName(recipient)}</span>
            </li>
          ) : order?.metadata?.user ? (
            <li>
              <span>
                {order?.metadata?.user?.id === underwriterId
                  ? 'Lead Arranger'
                  : 'Lender'}
              </span>
              <span>{getUserMetadata(order)?.name}</span>
            </li>
          ) : null}
          {!isIssuerSide && (
            <li>
              <span>Facility Agent</span>
              <span>{getClientName(issuer as IUser)}</span>
            </li>
          )}
          {order && (
            <li>
              <span>Order ID</span>
              <span>{order.id}</span>
            </li>
          )}
        </ul>
      </OrderSummary>
    </>
  );
};
