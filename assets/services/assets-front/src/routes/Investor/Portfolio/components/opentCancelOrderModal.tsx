import React from 'react';

import { appModalData } from 'uiComponents/AppModal/AppModal';
import { colors } from 'constants/styles';
import Input from 'uiComponents/Input';
import { IntlShape } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import store from 'features/app.store';
import { setAppModal } from 'features/user/user.store';

export const opentCancelOrderModal = (intl: IntlShape) => {
  const { dispatch } = store;
  dispatch(
    setAppModal(
      appModalData({
        title: intl.formatMessage(CommonTexts.cancelOrder),
        confirmAction: () => {
          console.log('cancel the order');
        },
        confirmLabel: intl.formatMessage(CommonTexts.cancelTheOrder),
        confirmColor: colors.errorDark,
        content: (
          <div className="_route_investor_subscriptionOrder_cutoffModal">
            <p style={{ marginBottom: '20px' }}>
              {intl.formatMessage(CommonTexts.cancelTheOrderDesc)}
            </p>

            <Input
              type="textarea"
              label={intl.formatMessage(CommonTexts.reasonForCancelation)}
              required
              placeholder={intl.formatMessage(CommonTexts.startTyping)}
              sublabel={intl.formatMessage(CommonTexts.beDescriptive)}
            />
          </div>
        ),
      }),
    ),
  );
};
