import { isTradeOrder } from 'constants/order';
import isNil from 'lodash/isNil';
import React from 'react';
import { IntlShape, useIntl } from 'react-intl';
import {
  AssetCycleInstance,
  AssetType,
  IToken,
  IWorkflowInstance,
  OrderType,
  PrimaryTradeType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { CommonTexts } from 'texts/commun/commonTexts';
import Button from 'uiComponents/Button';
import InputFile from 'uiComponents/InputFile';
import {
  AssetData,
  AssetStatus,
  OrderSubtotal,
  OrderSummary,
  OrderSummaryHeading,
  OrderTotal,
} from 'uiComponents/OrderSummary';
import Preview from 'uiComponents/Preview';
import Tooltip from 'uiComponents/Tooltip';
import { IUser } from 'User';
import {
  constructCofidocsFileUrl,
  getTokenCurrency,
  getTokenShareClassCurrentNav,
  getWorkflowInstanceStatus,
  getWorkflowInstanceStatusStyle,
} from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';
import { formatLongDate } from 'utils/formatLongDate';
import { RedeemRequestSummary } from 'routes/Investor/RedeemRequest/components/RedeemRequestSummary';

import SellRequestSummary from '../SellRequestSummary';
import { SyndicatedLoanDetails } from '../SyndicatedLoan/LoanDetails';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { assetCardMessages } from 'texts/routes/issuer/assetManagement';
import { RedeemRequestTexts } from 'texts/routes/investor/RedeemRequest';
import { CalculateFees } from '../../common/HelperFees/HelperFees';
import {
  ClassData,
  combineDateAndTime,
} from 'routes/Issuer/AssetIssuance/assetTypes';

export const getStatus = (
  intl: IntlShape,
  order: IWorkflowInstance,
  secondary: boolean,
  assetType?: AssetType,
) => {
  const status = getWorkflowInstanceStatus(intl, order, secondary, assetType);
  switch (status) {
    case 'Settling':
      return (
        <Tooltip title="The shares are currently being issued to the investor, this can take up to 5 minutes. Time for a break ☕️">
          {status}
        </Tooltip>
      );
    case 'Settled':
      return (
        <Tooltip title="The shares have been successfully issued to the investor.">
          {status}
        </Tooltip>
      );
    default:
      return status;
  }
};

const CurrencyDetails = ({
  token,
  shareClass,
  order,
  assetHref,
  wireTransferConfirmation,
  investorFee,
  currentTotal,
  isIssuerSide,
  investorName,
  assetType,
}: ICommonProps) => {
  const intl = useIntl();
  if (order) {
    if (isTradeOrder(order.name)) {
      return (
        <SellRequestSummary
          assetName={token.name}
          issuer={token.issuer as IUser}
          currentSharePrice={getTokenShareClassCurrentNav(token)}
          shareClass={shareClass}
          order={order}
          assetHref={assetHref}
          amount={order.quantity}
          recipient={order.recipientId}
          price={order.price}
          assetType={assetType}
        />
      );
    } else if (order.data.tradeType === PrimaryTradeType.REDEMPTION) {
      const currentCycle = ((token.cycles || []) as AssetCycleInstance[]).find(
        (c) => c.id === order.objectId,
      );
      return (
        <RedeemRequestSummary
          assetName={token.name}
          issuer={token.issuer as IUser}
          currentSharePrice={getTokenShareClassCurrentNav(token)}
          shareClass={shareClass}
          order={order}
          assetHref={assetHref}
          amount={order.quantity}
          assetType={assetType}
          cycle={currentCycle as AssetCycleInstance}
        />
      );
    }
  }

  const currency = getTokenCurrency(token);

  let sharesOrTokensIssued;
  let totalAmountNoFees: number;

  if (order) {
    sharesOrTokensIssued = order.quantity;
    totalAmountNoFees = order.price;
  } else {
    sharesOrTokensIssued = currentTotal;
    totalAmountNoFees = currentTotal;
  }

  const { formattedCustomFees, totalWithCustomFees } = CalculateFees(
    shareClass,
    investorFee,
    totalAmountNoFees,
  );

  const shareClassName = shareClass.name || shareClass.key;

  return (
    <>
      <OrderSummary>
        <OrderTotal>
          <p>{`${currentTotal} ${intl.formatMessage(CommonTexts.shares)}`}</p>
        </OrderTotal>
        <AssetData>
          {order && (
            <AssetStatus>
              <span>{intl.formatMessage(CommonTexts.status)}</span>
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
            <span>{intl.formatMessage(CommonTexts.asset)}</span>
            <div>
              {`${token.name}${
                shareClassName === 'classic' ? '' : ` - ${shareClassName}`
              } `}
              <Button
                label={intl.formatMessage(assetCardMessages.viewAsset)}
                tertiary
                size="small"
                style={{ padding: '0 0 0 16px', fontWeight: 400 }}
                href={assetHref}
              />
            </div>
          </div>
        </AssetData>
      </OrderSummary>

      {wireTransferConfirmation && (
        <OrderSummary>
          <h2>{intl.formatMessage(CommonTexts.document)}</h2>
          <ul>
            <li style={{ marginTop: '-24px' }}>
              <Preview
                url={constructCofidocsFileUrl(wireTransferConfirmation.docId)}
                filename={wireTransferConfirmation.filename}
                label={intl.formatMessage(
                  RedeemRequestTexts.wireTransferConfirmation,
                )}
              />
              <InputFile
                style={{ margin: '-10px' }}
                value={[
                  wireTransferConfirmation.filename,
                  wireTransferConfirmation.docId,
                ]}
                downloadable
                preview={false}
              />
            </li>
          </ul>
        </OrderSummary>
      )}

      <OrderSummary>
        <h2>{intl.formatMessage(CommonTexts.details)}</h2>
        <ul>
          <li>
            <span>{intl.formatMessage(CommonTexts.type)}</span>
            <span>{intl.formatMessage(CommonTexts.subscription)}</span>
          </li>
          {isIssuerSide && (
            <li>
              <span>{intl.formatMessage(CommonTexts.investor)}</span>
              <span>{investorName}</span>
            </li>
          )}
          {sharesOrTokensIssued > 0 && (
            <li>
              <span>{intl.formatMessage(CommonTexts.sharesToBeIssued)}</span>
              <span>{sharesOrTokensIssued}</span>
            </li>
          )}

          <li>
            <span>{intl.formatMessage(CommonTexts.amount)}</span>
            <span>{currencyFormat(totalAmountNoFees, currency)}</span>
          </li>
          {formattedCustomFees.map(({ name, value }) => (
            <li key={name}>
              <span>{name}</span>
              <span>{currencyFormat(value, currency)}</span>
            </li>
          ))}
          <li>
            <span>{intl.formatMessage(CommonTexts.total)}</span>
            <span>{currencyFormat(totalWithCustomFees, currency)}</span>
          </li>
        </ul>
      </OrderSummary>
    </>
  );
};

const PADetails = ({
  token,
  shareClass,
  order,
  assetHref,
  wireTransferConfirmation,
  investorFee,
  currentTotal,
  isIssuerSide,
  investorName,
}: ICommonProps) => {
  const intl = useIntl();
  if (order && isTradeOrder(order.name)) {
    return (
      <SellRequestSummary
        assetName={token.name}
        issuer={token.issuer as IUser}
        currentSharePrice={getTokenShareClassCurrentNav(token)}
        shareClass={shareClass}
        order={order}
        assetHref={assetHref}
        amount={order.quantity}
        recipient={order.recipientId}
        price={order.price}
        assetType={AssetType.CLOSED_END_FUND}
      />
    );
  }
  const orderType = shareClass.rules?.subscriptionType;

  let { acquiredEntryFees: aquiredEntryFees } = shareClass.fees || {};
  if (investorFee) {
    aquiredEntryFees = investorFee;
  }

  const currentNav = getTokenShareClassCurrentNav(token);

  const totalQuantityNoFees: number =
    currentNav > 0
      ? orderType === OrderType.QUANTITY
        ? currentTotal
        : currentTotal / currentNav
      : 0;
  const aureliumFees =
    currentNav > 0
      ? getFeesForAurelium(totalQuantityNoFees, aquiredEntryFees)
      : 0;
  const tokensReceived = Math.max(totalQuantityNoFees - aureliumFees, 0);
  const currency = getTokenCurrency(token);
  const tokenSymbol = token.symbol;
  const sharesOrTokensIssued =
    orderType === OrderType.QUANTITY
      ? currentTotal
      : currentNav > 0
      ? currentTotal / currentNav
      : 0;

  const shareClassName = shareClass.name || shareClass.key;

  return (
    <>
      <OrderSummary>
        <OrderTotal>
          <p>
            {`-${currencyFormat(currentNav * aureliumFees, currency)} (
            ${aureliumFees} ${tokenSymbol})`}
          </p>
        </OrderTotal>
        <OrderSubtotal>
          {`Receive ${tokensReceived} ${tokenSymbol} (${currencyFormat(
            currentNav * tokensReceived,
            currency,
          )})`}
        </OrderSubtotal>
        <AssetData>
          {order && (
            <AssetStatus>
              <span>{intl.formatMessage(CommonTexts.status)}</span>
              <div
                style={{
                  padding: '2px 8px',
                  fontSize: 12,
                  borderRadius: 4,
                  marginTop: '10px',
                  ...getWorkflowInstanceStatusStyle(order, true),
                }}
              >
                {getStatus(intl, order, true)}
              </div>
            </AssetStatus>
          )}
          <div>
            <span>{intl.formatMessage(CommonTexts.asset)}</span>
            <div>
              {`${token.name}${
                shareClassName === 'default' ? '' : ` - ${shareClassName}`
              } `}
              <Button
                label={intl.formatMessage(CommonTexts.viewAsset)}
                tertiary
                size="small"
                style={{ padding: '0 0 0 16px', fontWeight: 400 }}
                href={assetHref}
              />
            </div>
          </div>
        </AssetData>
      </OrderSummary>

      {wireTransferConfirmation && (
        <OrderSummary>
          <h2>{intl.formatMessage(CommonTexts.document)}</h2>
          <ul>
            <li style={{ marginTop: '-24px' }}>
              <Preview
                url={constructCofidocsFileUrl(wireTransferConfirmation.docId)}
                filename={wireTransferConfirmation.filename}
                label="Proof of gold transfer to the Aurelium token holder deposit"
              />
              <InputFile
                style={{ margin: '-10px' }}
                value={[
                  wireTransferConfirmation.filename,
                  wireTransferConfirmation.docId,
                ]}
                downloadable
                preview={false}
              />
            </li>
          </ul>
        </OrderSummary>
      )}
      <OrderSummary>
        <h2>{intl.formatMessage(CommonTexts.orderDetails)}</h2>
        <ul>
          <li>
            <span>{intl.formatMessage(CommonTexts.orderType)}</span>
            <span>{intl.formatMessage(CommonTexts.digitalisation)}</span>
          </li>
          {isIssuerSide && (
            <li>
              <span>{intl.formatMessage(CommonTexts.investor)}</span>
              <span>{investorName}</span>
            </li>
          )}
          <li>
            <span>{intl.formatMessage(CommonTexts.quantity)}</span>
            <span>{`${currentTotal} grams`}</span>
          </li>
          {sharesOrTokensIssued > 0 && (
            <li>
              <span>Tokens to be created</span>
              <span>{`${sharesOrTokensIssued} ${tokenSymbol}`}</span>
            </li>
          )}

          <li>
            <span>Digitisation fee %</span>
            <span>{aquiredEntryFees}%</span>
          </li>
          <li>
            <span>Digitisation fee (euro/token)</span>
            <span>
              {`-${currencyFormat(
                currentNav * aureliumFees,
                currency,
              )} (${aureliumFees} ${tokenSymbol})`}
            </span>
          </li>
          <li>
            <span>{intl.formatMessage(CommonTexts.pricePerToken)}</span>
            <span> {currencyFormat(currentNav, currency)}</span>
          </li>
          <li>
            <span>Tokens to be received</span>
            <span>
              {tokensReceived}
              {` ${tokenSymbol}`}
            </span>
          </li>
        </ul>
      </OrderSummary>
    </>
  );
};

const FRBDetails = ({
  token,
  shareClass,
  order,
  assetHref,
  wireTransferConfirmation,
  investorFee,
  currentTotal,
  isIssuerSide,
  investorName,
  assetType,
}: ICommonProps) => {
  const intl = useIntl();
  const entryAcquired = shareClass.fees?.acquiredEntryFees || 0;

  const currency = getTokenCurrency(token);
  const unitsToBeIssued = currentTotal / shareClass.nav.value;

  const shareClassName = shareClass.name || shareClass.key;

  const unpaidFlagDate = combineDateAndTime(
    shareClass.initialSubscription.unpaidFlagDate,
    shareClass.initialSubscription.unpaidFlagHour,
  );

  const valuationDate = combineDateAndTime(
    shareClass.initialSubscription.valuationDate,
    shareClass.initialSubscription.valuationHour,
  );

  const maturityDate = unpaidFlagDate ? new Date(unpaidFlagDate).getTime() : '';

  const issuanceDate = valuationDate ? new Date(valuationDate).getTime() : '';

  const totalEntryAcquiredFees = currentTotal * (entryAcquired / 100);
  const totalWithEntryAcquiredFees = totalEntryAcquiredFees + currentTotal;

  const isinCode = shareClass.isin;

  return (
    <>
      <OrderSummary>
        <OrderTotal>
          <p>{intl.formatMessage(CommonTexts.total)}</p>
          <p>-{currencyFormat(totalWithEntryAcquiredFees, currency)}</p>
        </OrderTotal>
        <AssetData>
          {order && (
            <AssetStatus>
              <span>{intl.formatMessage(CommonTexts.status)}</span>
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
            <span>{intl.formatMessage(CommonTexts.asset)}</span>
            <div>
              {`${token.name}${
                shareClassName === 'classic' ? '' : ` - ${shareClassName}`
              } `}
              <Button
                label={intl.formatMessage(CommonTexts.viewAsset)}
                tertiary
                size="small"
                style={{ fontWeight: 400 }}
                href={assetHref}
              />
            </div>
          </div>
        </AssetData>
      </OrderSummary>

      {wireTransferConfirmation && (
        <OrderSummary>
          <h2>{intl.formatMessage(CommonTexts.documents)}</h2>
          <ul>
            <li>
              <Preview
                url={constructCofidocsFileUrl(wireTransferConfirmation.docId)}
                filename={wireTransferConfirmation.filename}
                label={intl.formatMessage(
                  SubscriptionTexts.wireTransferConfirmation,
                )}
              />
              <InputFile
                value={[
                  wireTransferConfirmation.filename,
                  wireTransferConfirmation.docId,
                ]}
                downloadable
                preview={false}
              />
            </li>
          </ul>
        </OrderSummary>
      )}
      <OrderSummary>
        <h2>{intl.formatMessage(CommonTexts.orderDetails)}</h2>
        <ul>
          <li>
            <span>{intl.formatMessage(CommonTexts.orderType)}</span>
            <span>{intl.formatMessage(CommonTexts.subscription)}</span>
          </li>
          <li>
            <span>{intl.formatMessage(CommonTexts.unitsToBeIssued)}</span>
            <span>+ {unitsToBeIssued}</span>
          </li>
          <li>
            <span>{intl.formatMessage(CommonTexts.amount)}</span>
            <span>
              - {currencyFormat(currentTotal, currency, undefined, 2)}
            </span>
          </li>

          <li>
            <span>{intl.formatMessage(CommonTexts.fees)}</span>
            <span>
              {`- ${currencyFormat(
                totalEntryAcquiredFees,
                currency,
                undefined,
                2,
              )} (${entryAcquired}%)`}
            </span>
          </li>
          <li>
            <span>{intl.formatMessage(CommonTexts.total)}</span>
            <span>
              - {currencyFormat(totalWithEntryAcquiredFees, currency)}
            </span>
          </li>
          {order && (
            <li>
              <span>{intl.formatMessage(CommonTexts.orderId)}</span>
              <span>{order.id}</span>
            </li>
          )}
          {isinCode && (
            <li>
              <span>{intl.formatMessage(CommonTexts.ISIN)}</span>
              <span>{isinCode}</span>
            </li>
          )}
          <li>
            <span>{intl.formatMessage(CommonTexts.issuer)}</span>
            <span>{token.issuer?.firstName}</span>
          </li>
        </ul>
      </OrderSummary>

      {!isNil(issuanceDate) && !isNil(maturityDate) && (
        <OrderSummary>
          <h2>{intl.formatMessage(CommonTexts.dates)}</h2>
          <ul>
            {issuanceDate && (
              <li>
                <span>{intl.formatMessage(CommonTexts.issuanceDate)}</span>
                <span>{formatLongDate(issuanceDate)}</span>
              </li>
            )}
            {maturityDate && (
              <li>
                <span>{intl.formatMessage(CommonTexts.maturityDate)}</span>
                <span>{formatLongDate(maturityDate)}</span>
              </li>
            )}
          </ul>
        </OrderSummary>
      )}
    </>
  );
};

const CEFDetails = ({
  token,
  shareClass,
  order,
  assetHref,
  wireTransferConfirmation,
  investorFee,
  currentTotal,
  isIssuerSide,
  investorName,
  assetType,
}: ICommonProps) => {
  const intl = useIntl();
  if (order) {
    if (isTradeOrder(order.name)) {
      return (
        <SellRequestSummary
          assetName={token.name}
          issuer={token.issuer as IUser}
          currentSharePrice={getTokenShareClassCurrentNav(token)}
          shareClass={shareClass}
          order={order}
          assetHref={assetHref}
          amount={order.quantity}
          recipient={order.recipientId}
          price={order.price}
          assetType={assetType}
        />
      );
    } else if (order.data.tradeType === PrimaryTradeType.REDEMPTION) {
      const currentCycle = ((token.cycles || []) as AssetCycleInstance[]).find(
        (c) => c.id === order.objectId,
      );
      return (
        <RedeemRequestSummary
          assetName={token.name}
          issuer={token.issuer as IUser}
          currentSharePrice={getTokenShareClassCurrentNav(token)}
          shareClass={shareClass}
          order={order}
          assetHref={assetHref}
          amount={order.quantity}
          assetType={assetType}
          cycle={currentCycle as AssetCycleInstance}
        />
      );
    }
  }
  const orderType = shareClass.rules?.subscriptionType;

  const currentNav = getTokenShareClassCurrentNav(token);
  const currency = getTokenCurrency(token);

  let sharesOrTokensIssued;
  let totalAmountNoFees: number;

  if (order) {
    sharesOrTokensIssued = order.quantity;
    totalAmountNoFees = order.price;
  } else {
    sharesOrTokensIssued =
      orderType === OrderType.QUANTITY
        ? currentTotal
        : currentNav > 0
        ? currentTotal / currentNav
        : 0;
    totalAmountNoFees =
      orderType === OrderType.QUANTITY
        ? currentTotal * currentNav
        : currentTotal;
  }
  const { formattedCustomFees, totalWithCustomFees } = CalculateFees(
    shareClass,
    investorFee,
    totalAmountNoFees,
  );

  const shareClassName = shareClass.name || shareClass.key;

  let cutOffDate;
  let settlementDate;
  if (order) {
    const currentCycle = ((token.cycles || []) as AssetCycleInstance[]).find(
      (c) => c.id === order.objectId,
    );
    cutOffDate = order
      ? new Date(currentCycle?.endDate as Date).getTime()
      : undefined;

    settlementDate = order
      ? new Date(currentCycle?.settlementDate as Date).getTime()
      : undefined;
  } else {
    const currentCycle = ((token.cycles || []) as AssetCycleInstance[]).filter(
      (c) => c.type !== PrimaryTradeType.REDEMPTION,
    )[0];
    cutOffDate = currentCycle
      ? new Date(currentCycle?.endDate as Date).getTime()
      : undefined;

    settlementDate = currentCycle
      ? new Date(currentCycle?.settlementDate as Date).getTime()
      : undefined;
  }

  return (
    <>
      <OrderSummary>
        <OrderTotal>
          {orderType === OrderType.QUANTITY && (
            <p>{`${currentTotal} ${intl.formatMessage(CommonTexts.shares)}`}</p>
          )}
          {orderType === OrderType.AMOUNT && (
            <p>-{currencyFormat(totalWithCustomFees, currency)}</p>
          )}
        </OrderTotal>
        <AssetData>
          {order && (
            <AssetStatus>
              <span>{intl.formatMessage(CommonTexts.status)}</span>
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
            <span>{intl.formatMessage(CommonTexts.asset)}</span>
            <div>
              {`${token.name}${
                shareClassName === 'classic' ? '' : ` - ${shareClassName}`
              } `}
              <Button
                label={intl.formatMessage(assetCardMessages.viewAsset)}
                tertiary
                size="small"
                style={{ padding: '0 0 0 16px', fontWeight: 400 }}
                href={assetHref}
              />
            </div>
          </div>
        </AssetData>
      </OrderSummary>

      {wireTransferConfirmation && (
        <OrderSummary>
          <h2>{intl.formatMessage(CommonTexts.document)}</h2>
          <ul>
            <li style={{ marginTop: '-24px' }}>
              <Preview
                url={constructCofidocsFileUrl(wireTransferConfirmation.docId)}
                filename={wireTransferConfirmation.filename}
                label={intl.formatMessage(
                  RedeemRequestTexts.wireTransferConfirmation,
                )}
              />
              <InputFile
                style={{ margin: '-10px' }}
                value={[
                  wireTransferConfirmation.filename,
                  wireTransferConfirmation.docId,
                ]}
                downloadable
                preview={false}
              />
            </li>
          </ul>
        </OrderSummary>
      )}
      <OrderSummary>
        <h2>{intl.formatMessage(CommonTexts.details)}</h2>
        <ul>
          <li>
            <span>{intl.formatMessage(CommonTexts.type)}</span>
            <span>{intl.formatMessage(CommonTexts.subscription)}</span>
          </li>
          {isIssuerSide && (
            <li>
              <span>{intl.formatMessage(CommonTexts.investor)}</span>
              <span>{investorName}</span>
            </li>
          )}
          {sharesOrTokensIssued > 0 && (
            <li>
              <span>{intl.formatMessage(CommonTexts.sharesToBeIssued)}</span>
              <span>{sharesOrTokensIssued}</span>
            </li>
          )}

          <li>
            <span>{intl.formatMessage(CommonTexts.amount)}</span>
            <span>{currencyFormat(totalAmountNoFees, currency)}</span>
          </li>
          {formattedCustomFees.map(({ name, value }) => (
            <li key={name}>
              <span>{name}</span>
              <span>{currencyFormat(value, currency)}</span>
            </li>
          ))}
          <li>
            <span>{intl.formatMessage(CommonTexts.total)}</span>
            <span>{currencyFormat(totalWithCustomFees, currency)}</span>
          </li>
        </ul>
      </OrderSummary>

      {!isNil(cutOffDate) && !isNil(settlementDate) && (
        <OrderSummary>
          <h2>{intl.formatMessage(CommonTexts.dates)}</h2>
          <ul>
            {cutOffDate && (
              <li>
                <span>{intl.formatMessage(CommonTexts.cutOffDateAndHour)}</span>
                <span>{formatLongDate(cutOffDate)}</span>
              </li>
            )}
            {settlementDate && (
              <li>
                <span>
                  {intl.formatMessage(CommonTexts.settlementDateAndHour)}
                </span>
                <span>{formatLongDate(settlementDate)}</span>
              </li>
            )}
          </ul>
        </OrderSummary>
      )}
    </>
  );
};

interface ICommonProps {
  token: IToken;
  shareClass: ClassData;
  order?: IWorkflowInstance;
  assetHref: string;
  wireTransferConfirmation?: {
    filename: string;
    docId: string;
  };
  investorFee?: number;
  currentTotal: number;
  isIssuerSide?: boolean;
  investorName?: string;
  assetType: AssetType;
}

interface IProps extends ICommonProps {
  title?: string;
}

const getFeesForAurelium = (
  totalQuantity: number,
  percentageFee: number,
): number => {
  return Math.max((totalQuantity * percentageFee) / 100, 1);
};

const SubscriptionSummary: React.FC<IProps> = ({
  title,
  assetType,
  token,
  shareClass,
  order,
  assetHref,
  wireTransferConfirmation,
  investorFee,
  currentTotal,
  isIssuerSide,
  investorName,
}: IProps) => {
  return (
    <>
      {title && (
        <div>
          <OrderSummaryHeading>{title}</OrderSummaryHeading>
        </div>
      )}

      {assetType === AssetType.CURRENCY && (
        <CurrencyDetails
          token={token}
          shareClass={shareClass}
          order={order}
          assetHref={assetHref}
          wireTransferConfirmation={wireTransferConfirmation}
          investorFee={investorFee}
          currentTotal={currentTotal}
          isIssuerSide={isIssuerSide}
          investorName={investorName}
          assetType={assetType}
        />
      )}

      {assetType === AssetType.PHYSICAL_ASSET && (
        <PADetails
          token={token}
          shareClass={shareClass}
          order={order}
          assetHref={assetHref}
          wireTransferConfirmation={wireTransferConfirmation}
          investorFee={investorFee}
          currentTotal={currentTotal}
          isIssuerSide={isIssuerSide}
          investorName={investorName}
          assetType={assetType}
        />
      )}

      {assetType === AssetType.SYNDICATED_LOAN && (
        <SyndicatedLoanDetails
          token={token}
          shareClass={shareClass}
          order={order}
          assetHref={assetHref}
          wireTransferConfirmation={wireTransferConfirmation}
        />
      )}

      {assetType === AssetType.FIXED_RATE_BOND && (
        <FRBDetails
          token={token}
          shareClass={shareClass}
          order={order}
          assetHref={assetHref}
          wireTransferConfirmation={wireTransferConfirmation}
          investorFee={investorFee}
          currentTotal={currentTotal}
          isIssuerSide={isIssuerSide}
          investorName={investorName}
          assetType={assetType}
        />
      )}

      {[AssetType.CLOSED_END_FUND, AssetType.OPEN_END_FUND].indexOf(assetType) >
        -1 && (
        <CEFDetails
          token={token}
          shareClass={shareClass}
          order={order}
          assetHref={assetHref}
          wireTransferConfirmation={wireTransferConfirmation}
          investorFee={investorFee}
          currentTotal={currentTotal}
          isIssuerSide={isIssuerSide}
          investorName={investorName}
          assetType={assetType}
        />
      )}
    </>
  );
};

export default SubscriptionSummary;
