import { Card } from 'antd';
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { IWorkflowInstance } from 'routes/Issuer/AssetIssuance/templatesTypes';
import styled from 'styled-components';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { parseValueExtended } from 'uiComponents/DurationTimeField/utils';
import { shortifyAddress } from 'utils/commonUtils';
import DetailsRow from './DetailsRow';
import DetailsRowTitle from './DetailsRowTItle';

const StyledCard = styled(Card)`
  border: 1px solid #dfe0e6;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin-top: 32px;
  & .ant-card-head-title {
    font-weight: 600;
    font-size: 16px;
    color: #475166;
  }
`;

interface IDetailsCard {
  order: IWorkflowInstance;
}

const DetailsCard = ({ order }: IDetailsCard) => {
  const intl = useIntl();
  const assetValueField = useMemo(() => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span>{`${order?.metadata?.token?.name} / ${order.assetClassKey}`}</span>
        <small>
          <span>
            {`${shortifyAddress(
              order?.data.dvp?.delivery?.tokenAddress || '',
              4,
              4,
            )} / ${order.assetClassKey}`}
          </span>
        </small>
      </div>
    );
  }, [order]);

  return (
    <StyledCard title={intl.formatMessage(tradesTexts.details)}>
      <DetailsRowTitle>
        {intl.formatMessage(tradesTexts.overview)}
      </DetailsRowTitle>
      <DetailsRow
        label={intl.formatMessage(tradesTexts.tradeType)}
        value="Hold"
      />
      <DetailsRow
        label={intl.formatMessage(tradesTexts.expirationTime)}
        value={parseValueExtended(
          new Date(order?.data.dvp?.tradeExpiresOn as string).getTime() / 1000 -
            new Date().getTime() / 1000 || 0,
          'dd:hh:mm',
        )}
      />
      <DetailsRow
        label={intl.formatMessage(tradesTexts.deliveryHoldId)}
        value={shortifyAddress(order.data.dvp?.delivery?.holdId || '', 4, 4)}
      />
      <DetailsRow
        label={intl.formatMessage(tradesTexts.paymentHoldId)}
        value={shortifyAddress(order.data.dvp?.payment?.holdId || '', 4, 4)}
        gutterBottom
      />
      {/* delivery details */}
      <DetailsRowTitle>
        {intl.formatMessage(tradesTexts.delivery)}
      </DetailsRowTitle>
      <DetailsRow
        label={intl.formatMessage(tradesTexts.asset)}
        value={assetValueField}
      />
      <DetailsRow
        label={intl.formatMessage(tradesTexts.deliveryHolder)}
        value={order.metadata?.user?.entityName}
      />
      <DetailsRow
        label={intl.formatMessage(tradesTexts.sender)}
        value={shortifyAddress(order.metadata?.user?.defaultWallet || '', 4, 4)}
      />
      <DetailsRow
        label={intl.formatMessage(tradesTexts.recipient)}
        value={shortifyAddress(
          order.metadata?.recipient?.defaultWallet || '',
          4,
          4,
        )}
      />

      <DetailsRow
        label={intl.formatMessage(tradesTexts.quantity)}
        value={order.quantity}
        gutterBottom
      />
      {/* payment details */}
      <DetailsRowTitle>
        {intl.formatMessage(tradesTexts.payment)}
      </DetailsRowTitle>
      <DetailsRow
        label={intl.formatMessage(tradesTexts.asset)}
        value={shortifyAddress(
          order.data.dvp?.payment?.tokenAddress || '',
          4,
          4,
        )}
      />
      <DetailsRow
        label={intl.formatMessage(tradesTexts.paymentHolder)}
        value={order.metadata?.recipient?.entityName}
      />

      <DetailsRow
        label={intl.formatMessage(tradesTexts.sender)}
        value={shortifyAddress(
          order.metadata?.recipient?.defaultWallet || '',
          4,
          4,
        )}
      />
      <DetailsRow
        label={intl.formatMessage(tradesTexts.recipient)}
        value={shortifyAddress(order.data?.paymentAccountAddress || '', 4, 4)}
      />

      <DetailsRow
        label={intl.formatMessage(tradesTexts.quantity)}
        value={order.price}
        gutterBottom
      />
    </StyledCard>
  );
};

export default DetailsCard;
