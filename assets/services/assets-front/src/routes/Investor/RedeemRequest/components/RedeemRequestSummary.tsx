import React from 'react';
import { useSelector } from 'react-redux';
import {
  AssetCycleInstance,
  AssetType,
  IWorkflowInstance,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import Button from 'uiComponents/Button';
import InputFile from 'uiComponents/InputFile';
import {
  formatDate,
  formatNumber,
  getUserMetadata,
  getClientName,
  getWorkflowInstanceStatusStyle,
} from 'utils/commonUtils';
import {
  AssetData,
  AssetStatus,
  OrderSubtotal,
  OrderSummary,
  OrderSummaryHeading,
  OrderTotal,
} from 'uiComponents/OrderSummary';
import { getStatus } from '../../SubscriptionSummary/SubscriptionSummary';
import { IUser, UserType } from 'User';
import { hasRole } from 'utils/HasRole';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { RedeemRequestTexts } from 'texts/routes/investor/RedeemRequest';
import Icon from 'uiComponents/Icon';
import { mdiInformation } from '@mdi/js';
import { formatLongDate } from 'utils/formatLongDate';
import Tooltip from 'uiComponents/Tooltip';
import { currencyFormat } from 'utils/currencyFormat';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { userSelector } from 'features/user/user.store';

interface IProps {
  title?: string;
  assetType: AssetType;
  assetName: string;
  shareClass: ClassData;
  order?: IWorkflowInstance;
  assetHref: string;
  amount: number;
  currentSharePrice: number;
  issuer: IUser;
  cycle?: AssetCycleInstance;
}

interface EstimatedAmountProps {
  valuationDate?: number;
}

const EstimatedAmount: React.FC<EstimatedAmountProps> = ({
  valuationDate,
}: EstimatedAmountProps) => {
  const intl = useIntl();
  if (!valuationDate || new Date().getTime() > valuationDate) {
    return null;
  }
  return (
    <span style={{ marginLeft: 5 }}>
      {intl.formatMessage(RedeemRequestTexts.estimatedAmount)}
      <Tooltip
        width={250}
        title={intl.formatMessage(RedeemRequestTexts.estimatedAmountTooltip)}
        placement="right"
      >
        <span>
          <Icon
            style={{ marginLeft: '2px', marginBottom: '-5px' }}
            icon={mdiInformation}
          />
        </span>
      </Tooltip>
    </span>
  );
};

export const RedeemRequestSummary: React.FC<IProps> = ({
  title,
  assetType,
  assetName,
  shareClass,
  order,
  assetHref,
  amount,
  cycle,
  currentSharePrice,
  issuer,
}: IProps) => {
  const user = useSelector(userSelector) as IUser;
  const shareClassName = shareClass.name || shareClass.key;
  const currency = shareClass?.currency;
  const isin = shareClass?.isin;
  const intl = useIntl();
  const assetIdentifier =
    assetType === AssetType.PHYSICAL_ASSET ? 'share' : 'token';

  let cutOffDate: number | undefined;
  let valuationDate: number | undefined;
  let settlementDate: number | undefined;
  if (cycle) {
    cutOffDate = new Date(cycle.endDate as Date).getTime();

    valuationDate = new Date(cycle.valuationDate as Date).getTime();

    settlementDate = new Date(cycle.settlementDate as Date).getTime();
  }

  const totalAmountNoFees: number = amount * currentSharePrice;

  const customFees = shareClass.fees?.redemptionCustomFeesValue || [];

  const formattedCustomFees = customFees.map(({ name, value }) => ({
    name,
    value: totalAmountNoFees * (parseFloat(value) / 100),
  }));

  const totalCustomFees = formattedCustomFees.reduce(
    (acc, curr) => acc + curr.value,
    0,
  );

  const totalWithCustomFees = Number(totalAmountNoFees) - totalCustomFees;

  return (
    <>
      {title && (
        <div>
          <OrderSummaryHeading>{title}</OrderSummaryHeading>
        </div>
      )}

      <OrderSummary>
        <OrderTotal>
          <h3>Total</h3>
          {!order && assetType !== AssetType.CURRENCY && (
            <span>
              <Icon icon={mdiInformation} />{' '}
              {intl.formatMessage(RedeemRequestTexts.calculatedAtValuation)}
            </span>
          )}
          {order && (
            <>
              <p>
                +{currencyFormat(totalWithCustomFees, currency)}
                <EstimatedAmount valuationDate={valuationDate} />
              </p>
            </>
          )}
        </OrderTotal>

        <OrderSubtotal>
          {intl.formatMessage(
            assetIdentifier === 'share'
              ? RedeemRequestTexts.redeemShareAmount
              : RedeemRequestTexts.redeemTokenAmount,
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
                {intl.formatMessage(RedeemRequestTexts.cancellationDetails)}
              </h2>
              <ul>
                <li>
                  <span>
                    {intl.formatMessage(RedeemRequestTexts.cancellationDate)}
                  </span>
                  <span>{formatDate(order.updatedAt as Date)}</span>
                </li>
                <li>
                  <span>
                    {intl.formatMessage(RedeemRequestTexts.cancellationReason)}
                  </span>
                  <span>{order.data.comment}</span>
                </li>
              </ul>
            </OrderSummary>
          )}

          {order.data.wireTransferConfirmation && (
            <OrderSummary>
              <h2>{intl.formatMessage(CommonTexts.documents)}</h2>
              <ul>
                <li>
                  <span>
                    {intl.formatMessage(
                      RedeemRequestTexts.wireTransferConfirmation,
                    )}
                  </span>
                  <span>
                    <InputFile
                      style={{ margin: '-10px' }}
                      value={[
                        order.data.wireTransferConfirmation?.filename as string,
                        order.data.wireTransferConfirmation?.docId as string,
                      ]}
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
        <h2>{intl.formatMessage(CommonTexts.orderDetails)}</h2>
        <ul>
          <li>
            <span>{intl.formatMessage(CommonTexts.type)}</span>
            <span>{intl.formatMessage(CommonTexts.redemption)}</span>
          </li>
          {order && hasRole(user, [UserType.ISSUER]) && (
            <li>
              <span>{intl.formatMessage(CommonTexts.investor)}</span>
              <span>{getUserMetadata(order)?.name}</span>
            </li>
          )}
          <li>
            <span>
              {intl.formatMessage(
                assetIdentifier === 'share'
                  ? RedeemRequestTexts.sharesToRedeem
                  : RedeemRequestTexts.tokensToRedeem,
              )}
            </span>
            <span>-{formatNumber(amount)}</span>
          </li>
          <li>
            <span>{intl.formatMessage(CommonTexts.amount)}</span>
            {!order && (
              <span>
                {intl.formatMessage(RedeemRequestTexts.calculatedAtValuation)}
              </span>
            )}
            {order && (
              <span>
                +{currencyFormat(totalAmountNoFees, currency)}
                <EstimatedAmount valuationDate={valuationDate} />
              </span>
            )}
          </li>
          {formattedCustomFees.map(({ name, value }) => (
            <li key={name}>
              <span>{name}</span>
              {order && (
                <span>
                  -{currencyFormat(value, currency)}
                  <EstimatedAmount valuationDate={valuationDate} />
                </span>
              )}
              {!order && (
                <span>
                  {intl.formatMessage(RedeemRequestTexts.calculatedAtValuation)}
                </span>
              )}
            </li>
          ))}

          <li>
            <span>{intl.formatMessage(CommonTexts.total)}</span>
            {!order && (
              <span>
                {intl.formatMessage(RedeemRequestTexts.calculatedAtValuation)}
              </span>
            )}
            {order && (
              <span>
                +{currencyFormat(totalWithCustomFees, currency)}
                <EstimatedAmount valuationDate={valuationDate} />
              </span>
            )}
          </li>
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

      {assetType !== AssetType.CURRENCY && (
        <OrderSummary>
          <h2>{intl.formatMessage(CommonTexts.dates)}</h2>
          <ul>
            {cutOffDate && (
              <li>
                <span>{intl.formatMessage(CommonTexts.cutOffDateAndHour)}</span>
                <span>{formatLongDate(cutOffDate)}</span>
              </li>
            )}
            {valuationDate && (
              <li>
                <span>
                  {intl.formatMessage(CommonTexts.valuationDateAndHour)}
                </span>
                <span>{formatLongDate(valuationDate)}</span>
              </li>
            )}
            {settlementDate && (
              <li>
                <span>
                  <span>
                    {intl.formatMessage(CommonTexts.settlementDateAndHour)}
                  </span>
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
