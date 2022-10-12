import {
  AssetData,
  AssetStatus,
  OrderSubtotal,
  OrderSummary,
  OrderSummaryHeading,
  OrderTotal,
} from 'uiComponents/OrderSummary';
import {
  AssetType,
  BaseInterestRate,
  IToken,
  IWorkflowInstance,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { IUser } from 'User';
import React, { useEffect, useState } from 'react';
import {
  formatDate,
  getLoanDataFromToken,
  getOrderType,
  getClientName,
  getWorkflowInstanceStatusStyle,
} from 'utils/commonUtils';

import { useSelector } from 'react-redux';
import { API_FETCH_USERS } from 'constants/apiRoutes';
import Button from 'uiComponents/Button';
import { DataCall } from 'utils/dataLayer';
import { currencyFormat } from 'utils/currencyFormat';
import { getOrderPaymentBreakdown } from 'constants/order';
import { getStatus } from '../../SubscriptionSummary/SubscriptionSummary';
import { useIntl } from 'react-intl';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { userSelector } from 'features/user/user.store';

interface IProps {
  token: IToken;
  facility: ClassData;
  order?: IWorkflowInstance;
  assetHref: string;
  isIssuerSide?: boolean;
  requestInterestPeriod?: string;
  requestUtilizationDate?: Date;
  requestAmount?: number;
  requestType?: string;
  requestFees?: number;
  requestBorrower?: IUser;
  requestUnderwriter?: IUser;
}

export const SyndicatedLoanOrderOverview: React.FC<IProps> = ({
  token,
  facility,
  order,
  assetHref,
  isIssuerSide,
  requestInterestPeriod = '',
  requestUtilizationDate = new Date(),
  requestAmount = 0,
  requestType,
  requestFees,
  requestBorrower,
  requestUnderwriter,
}: IProps) => {
  const intl = useIntl();
  const [underwriter, setUnderwriter] = useState<IUser>();
  const [borrower, setBorrower] = useState<IUser>();

  const user = useSelector(userSelector) as IUser;

  useEffect(
    () => {
      const loadData = async () => {
        if (order) {
          try {
            const { users }: { users: IUser[] } = await DataCall({
              method: API_FETCH_USERS.method,
              path: API_FETCH_USERS.path(),
              urlParams: {
                offset: 0,
                withBalances: false,
              },
            });

            let recipient = order.metadata?.recipient as IUser | undefined;

            if (!recipient) {
              recipient = users.find(
                (user) =>
                  user.id ===
                  (order.recipientId || order.data?.dvp?.recipient?.id),
              );
            }

            if (recipient) {
              setUnderwriter(recipient);
            }

            let borrower = order.metadata?.user as IUser | undefined;

            if (!borrower) {
              borrower = users.find((user) => user.id === order.userId);
            }
            if (borrower) {
              setBorrower(borrower);
            }
          } catch (error) {}
        }
      };
      loadData();
    },
    // eslint-disable-next-line
    [user],
  );

  const { currency, issuer } = getLoanDataFromToken(token);

  const orderTotalSign = isIssuerSide && order?.state === 'accepted' ? '-' : '';

  const orderType =
    requestType || getOrderType(AssetType.SYNDICATED_LOAN, order);
  const isNovationOrder = orderType === 'Novation';

  const orderPaymentBreakdown = getOrderPaymentBreakdown(
    token,
    order,
    orderType,
    requestFees,
    requestAmount,
  );

  return (
    <>
      <div>
        <OrderSummaryHeading>Order Summary</OrderSummaryHeading>
      </div>
      <OrderSummary>
        <OrderTotal>
          <p>
            {orderTotalSign}
            {currencyFormat(orderPaymentBreakdown.netAmount, currency)}
          </p>
        </OrderTotal>
        <OrderSubtotal>
          {isNovationOrder &&
          issuer &&
          user.id !== issuer.id &&
          user.id !== token.assetData?.asset?.participants?.borrowerId
            ? `+${currencyFormat(
                orderPaymentBreakdown.tradeOrderFee,
                currency,
              )} Novation Fee`
            : isNovationOrder
            ? ''
            : 'Loan Amount net of the Establishment Fee'}
        </OrderSubtotal>
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
            <span>{orderType}</span>
          </li>
          <li>
            <span>Facility</span>
            <span>{facility.name}</span>
          </li>
          {isNovationOrder ? (
            <>
              <li>
                <span>Novation Amount</span>
                <span>
                  {currencyFormat(orderPaymentBreakdown.netAmount, currency)}
                </span>
              </li>
              {issuer &&
                user.id !== issuer.id &&
                user.id !==
                  token.assetData?.asset?.participants?.borrowerId && (
                  <li>
                    <span>Novation Fees</span>
                    <span>
                      {currencyFormat(
                        orderPaymentBreakdown.tradeOrderFee,
                        currency,
                      )}
                    </span>
                  </li>
                )}
            </>
          ) : (
            <>
              <li>
                <span>Facility Amount</span>
                <span>{currencyFormat(facility.facilityAmount, currency)}</span>
              </li>

              <li>
                <span>Establishment Fee</span>
                <span>
                  {currencyFormat(
                    orderPaymentBreakdown.establishmentFee,
                    currency,
                  )}
                </span>
              </li>
              <li>
                <span>Net Loan Amount</span>
                <span>
                  {currencyFormat(orderPaymentBreakdown.netAmount, currency)}
                </span>
              </li>
              <li>
                <span>Utilisation Date</span>
                <span>
                  {formatDate(
                    new Date(
                      order?.data?.utilizationDate ||
                        requestUtilizationDate.getTime(),
                    ),
                  )}
                </span>
              </li>
            </>
          )}

          <li>
            <span>Interest Period</span>
            <span>{order?.data?.interestPeriod || requestInterestPeriod}</span>
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
            <span>
              {Math.round(
                ((Number(facility.interest.margin) + 0.9) * 10000) / 10000,
              )}
              %
            </span>
          </li>

          {(requestBorrower || borrower) && (
            <li>
              <span>Borrower</span>
              <span>
                {getClientName(requestBorrower || (borrower as IUser))}
              </span>
            </li>
          )}

          {(requestUnderwriter || underwriter) && (
            <li>
              <span>
                {isNovationOrder ? 'Incoming Lender' : 'Lead Arranger'}
              </span>
              <span>
                {getClientName((requestUnderwriter || underwriter) as IUser)}
              </span>
            </li>
          )}
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
