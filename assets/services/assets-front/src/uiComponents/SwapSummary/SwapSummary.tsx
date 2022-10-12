import React, { ReactNode } from 'react';
import './SwapSummary.scss';
import { Card } from 'uiComponents/Card';
import { IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { numberWithCommas, shortifyAddress } from 'utils/commonUtils';
import { parseValueExtended } from 'uiComponents/DurationTimeField/utils';
import { ClockCircleOutlined } from '@ant-design/icons';
import { mdiSwapHorizontal } from '@mdi/js';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import Icon from 'uiComponents/Icon';
import { CommonTexts } from 'texts/commun/commonTexts';

interface IProps {
  expiration?: number; // seconds
  deliveryAsset?: IToken | { name: string } | string;
  deliveryAssetHasClasses?: boolean;
  deliveryAssetClass?: string;
  paymentAsset?: IToken | string;
  paymentAssetHasClasses?: boolean;
  paymentAssetClass?: string;
  deliveryQuantity?: number;
  paymentQuantity?: number;
  status?: ReactNode;
  isSettled?: boolean;
}

export const SwapSummary: React.FC<IProps> = (props: IProps) => {
  const intl = useIntl();
  const {
    expiration,
    deliveryAsset,
    deliveryAssetHasClasses,
    deliveryAssetClass,
    paymentAsset,
    paymentAssetHasClasses,
    paymentAssetClass,
    deliveryQuantity,
    paymentQuantity,
    status,
    isSettled = false,
  } = props;

  return (
    <Card className={'swap-summary'}>
      <div className={'swap-summary__swap-info'}>
        <div>
          <div
            className={`swap-summary__asset-name ${
              !deliveryAsset && 'inactive'
            }`}
          >
            {typeof deliveryAsset !== 'string'
              ? deliveryAsset?.name ||
                intl.formatMessage(tradesTexts.deliveryAsset)
              : shortifyAddress(deliveryAsset, 4, 4)}
            {deliveryAssetHasClasses &&
              deliveryAssetClass &&
              ` / ${deliveryAssetClass}`}
          </div>
          <div
            className={`swap-summary__quantity ${
              !deliveryQuantity && 'inactive'
            }`}
          >
            {deliveryQuantity ? numberWithCommas(deliveryQuantity) : '-'}
          </div>
        </div>
        <div>
          <Icon width={36} color={'#C2C4CC'} icon={mdiSwapHorizontal} />
        </div>
        <div>
          <div
            className={`swap-summary__asset-name ${
              !paymentAsset && 'inactive'
            }`}
          >
            {typeof paymentAsset !== 'string'
              ? paymentAsset?.name
                ? paymentAsset?.name ||
                  intl.formatMessage(tradesTexts.paymentAsset)
                : intl.formatMessage(tradesTexts.paymentAsset)
              : shortifyAddress(paymentAsset, 4, 4)}
            {paymentAssetHasClasses &&
              paymentAssetClass &&
              ` / ${paymentAssetClass}`}
          </div>
          <div
            className={`swap-summary__quantity ${
              !paymentQuantity && 'inactive'
            }`}
          >
            {paymentQuantity ? numberWithCommas(paymentQuantity) : '-'}
          </div>
        </div>
      </div>
      <div
        className={`swap-summary__swap-expiration ${status && 'with-status'} ${
          isSettled && 'settled'
        }`}
      >
        {status && (
          <div className="swap-summary__swap-status">
            <span>{intl.formatMessage(CommonTexts.status)}</span>
            {status}
          </div>
        )}
        <p>
          <ClockCircleOutlined />{' '}
          {intl.formatMessage(
            isSettled ? tradesTexts.tradeCompletedOn : tradesTexts.expiresIn,
          )}{' '}
          <strong>
            {isSettled
              ? new Intl.DateTimeFormat('default', {
                  month: 'long',
                  day: '2-digit',
                  year: 'numeric',
                }).format(new Date(expiration || 0))
              : parseValueExtended(expiration || 0, 'dd:hh:mm')}{' '}
          </strong>
        </p>
      </div>
    </Card>
  );
};
