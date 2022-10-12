import React from 'react';
import { useSelector } from 'react-redux';
import {
  AssetType,
  IWorkflowInstance,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import Button from 'uiComponents/Button';
import InputFile from 'uiComponents/InputFile';
import {
  formatDate,
  formatNumber,
  getUserMetadata,
  getRecipientMetadata,
  getClientName,
  getWorkflowInstanceStatusStyle,
} from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';
import {
  AssetData,
  AssetStatus,
  OrderSubtotal,
  OrderSummary,
  OrderSummaryHeading,
  OrderTotal,
} from 'uiComponents/OrderSummary';
import { getStatus } from '../SubscriptionSummary/SubscriptionSummary';
import { IUser, UserType } from 'User';
import { hasRole } from 'utils/HasRole';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { SellRequestTexts } from 'texts/routes/investor/SellRequest';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { userSelector } from 'features/user/user.store';

const computeMarkup = (current: number, target: number) => {
  const difference = 1 - target / current;
  return `${difference < 0 ? '+' : '-'}${formatNumber(
    difference * (difference < 0 ? -1 : +1) * 100,
  )}%`;
};

interface IProps {
  title?: string;
  assetType: AssetType;
  assetName: string;
  shareClass: ClassData;
  order?: IWorkflowInstance;
  assetHref: string;
  amount: number;
  price: number;
  recipient: string;
  currentSharePrice: number;
  issuer: IUser;
}

const SellRequestSummary: React.FC<IProps> = ({
  title,
  assetType,
  assetName,
  shareClass,
  order,
  assetHref,
  amount,
  price,
  recipient,
  currentSharePrice,
  issuer,
}: IProps) => {
  const user = useSelector(userSelector) as IUser;
  const shareClassName = shareClass.name || shareClass.key;
  const currency = shareClass?.currency;
  const isin = shareClass?.isin;
  const intl = useIntl();
  const unitPrice = order ? price / amount : price;
  const assetIdentifier =
    assetType === AssetType.PHYSICAL_ASSET ? 'share' : 'token';
  return (
    <>
      {title && (
        <div>
          <OrderSummaryHeading>{title}</OrderSummaryHeading>
        </div>
      )}

      <OrderSummary>
        <OrderTotal>
          <p>+{currencyFormat(amount * unitPrice, currency)}</p>
        </OrderTotal>
        <OrderSubtotal>
          {intl.formatMessage(
            assetIdentifier === 'share'
              ? CommonTexts.sellShareAmount
              : CommonTexts.sellTokenAmount,
            { amount: formatNumber(amount) },
          )}
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
              {`${assetName}${
                shareClassName === 'classic' ? '' : ` - ${shareClassName}`
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

      {order && (
        <>
          {order.state === 'rejected' && (
            <OrderSummary>
              <h2>
                {intl.formatMessage(SellRequestTexts.cancellationDetails)}
              </h2>
              <ul>
                <li>
                  <span>
                    {intl.formatMessage(SellRequestTexts.cancellationDate)}
                  </span>
                  <span>{formatDate(order.updatedAt as Date)}</span>
                </li>
                <li>
                  <span>
                    {intl.formatMessage(SellRequestTexts.cancellationReason)}
                  </span>
                  <span>{order.data.comment}</span>
                </li>
              </ul>
            </OrderSummary>
          )}

          {order.data.dvp?.payment?.proof && (
            <OrderSummary>
              <h2>{intl.formatMessage(CommonTexts.documents)}</h2>
              <ul>
                <li>
                  <span>
                    {intl.formatMessage(
                      SellRequestTexts.wireTransferConfirmation,
                    )}
                  </span>
                  <span>
                    <InputFile
                      style={{ margin: '-10px' }}
                      value={order.data.dvp?.payment?.proof}
                      downloadable
                      preview={false}
                    />
                  </span>
                </li>
              </ul>
            </OrderSummary>
          )}
        </>
      )}

      <OrderSummary>
        <h2>{intl.formatMessage(CommonTexts.details)}</h2>
        <ul>
          <li>
            <span>{intl.formatMessage(CommonTexts.type)}</span>
            <span>{intl.formatMessage(CommonTexts.sell)}</span>
          </li>
          {order ? (
            <>
              <>
                {user.id !== order.userId && (
                  <li>
                    <span>{intl.formatMessage(CommonTexts.seller)}</span>
                    <span>{getUserMetadata(order).name}</span>
                  </li>
                )}
                <li>
                  <span>{intl.formatMessage(CommonTexts.buyer)}</span>
                  <span>
                    {getRecipientMetadata(order).name ||
                      order.data?.dvp?.recipient?.email}
                  </span>
                </li>
              </>
            </>
          ) : (
            <>
              {recipient && (
                <li>
                  <span>{intl.formatMessage(CommonTexts.buyer)}</span>
                  <span>{recipient}</span>
                </li>
              )}
            </>
          )}
          <li>
            <span>
              {intl.formatMessage(
                assetIdentifier === 'share'
                  ? CommonTexts.pricePerShare
                  : CommonTexts.pricePerToken,
              )}
            </span>
            <span>{currencyFormat(unitPrice, currency)}</span>
          </li>
          <li>
            <span>{intl.formatMessage(CommonTexts.markup)}</span>
            <span>{computeMarkup(currentSharePrice, unitPrice)}</span>
          </li>
          <li>
            <span>
              {intl.formatMessage(
                assetIdentifier === 'share'
                  ? CommonTexts.numberOfShares
                  : CommonTexts.numberOfTokens,
              )}
            </span>
            <span>-{formatNumber(amount)}</span>
          </li>
          <li>
            <span>{intl.formatMessage(CommonTexts.total)}</span>
            <span>+{currencyFormat(unitPrice * amount, currency)}</span>
          </li>
          {order && (
            <li>
              <span>{intl.formatMessage(CommonTexts.orderId)}</span>
              <span>{order.id}</span>
            </li>
          )}
          {isin && (
            <li>
              <span>{intl.formatMessage(CommonTexts.ISIN)}</span>
              <span>{isin}</span>
            </li>
          )}
          {hasRole(user, [UserType.INVESTOR]) && (
            <li>
              <span>{intl.formatMessage(CommonTexts.issuer)}</span>
              <span>{getClientName(issuer)}</span>
            </li>
          )}
        </ul>
      </OrderSummary>
    </>
  );
};

export default SellRequestSummary;
