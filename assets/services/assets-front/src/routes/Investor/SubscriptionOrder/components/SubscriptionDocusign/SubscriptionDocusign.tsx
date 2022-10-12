import React from 'react';
import { mdiArrowLeft } from '@mdi/js';
import { CLIENT_ROUTE_INVESTMENT_PRODUCT } from 'routesList';
import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import { Form, FormFooter, FormHeading } from 'uiComponents/OrderForm/';
import { Steps } from '../../SubscriptionOrder';
import { useIntl } from 'react-intl';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { CommonTexts } from 'texts/commun/commonTexts';

interface IProps {
  assetId: string;
  setCurrentStep: (currentStep: Steps) => void;
}

export const SubscriptionDocusign: React.FC<IProps> = ({
  assetId,
  setCurrentStep,
}: IProps) => {
  const intl = useIntl();
  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        setCurrentStep('payment');
      }}
    >
      <FormHeading>
        {intl.formatMessage(SubscriptionTexts.subscriptionOrder)}
      </FormHeading>

      <Checkbox
        style={{ marginTop: '80px' }}
        required
        label={intl.formatMessage(
          SubscriptionTexts.iConfirmToSubscriptionAgreement,
        )}
      />

      <FormFooter>
        <Button
          size="small"
          label={intl.formatMessage(CommonTexts.back)}
          iconLeft={mdiArrowLeft}
          tertiary
          href={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
            assetId,
          })}
        />

        <Button
          size="small"
          label={intl.formatMessage(SubscriptionTexts.continueToPayment)}
          type="submit"
        />
      </FormFooter>
    </Form>
  );
};
