import React from 'react';

import Button from 'uiComponents/Button';
import { mdiChevronDown, mdiEye, mdiCurrencyUsd, mdiTrashCan } from '@mdi/js';
import Icon from 'uiComponents/Icon';
import { colors } from 'constants/styles';
import { Card } from 'uiComponents/Card';
import { opentCancelOrderModal } from './opentCancelOrderModal';

import './ActionsDropdown.scss';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';

interface IProps {
  orderId: number;
  openOrder: () => void;
}

export const ActionsDropdown: React.FC<IProps> = ({
  openOrder,
  orderId,
}: IProps) => {
  const intl = useIntl();
  return (
    <div className="_route_investor_portfolio_actionDropdown hidden">
      <Button
        label={intl.formatMessage(CommonTexts.actions)}
        iconRight={mdiChevronDown}
        size="small"
      />

      <div className="spacer" />

      <Card className="menu">
        <button onClick={openOrder}>
          <Icon width={24} icon={mdiEye} />
          {intl.formatMessage(CommonTexts.viewOrder)}
        </button>
        <button onClick={() => console.log(orderId)}>
          <Icon width={24} icon={mdiCurrencyUsd} />
          {intl.formatMessage(CommonTexts.completePayment)}
        </button>
        <button
          style={{ color: colors.errorDark }}
          onClick={() => opentCancelOrderModal(intl)}
        >
          <Icon width={24} icon={mdiTrashCan} color={colors.errorDark} />
          {intl.formatMessage(CommonTexts.cancelOrder)}
        </button>
      </Card>
    </div>
  );
};
