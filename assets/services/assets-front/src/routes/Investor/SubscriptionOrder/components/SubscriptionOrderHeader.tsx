import React from 'react';
import { mdiChevronRight, mdiArrowLeft } from '@mdi/js';
import { useIntl } from 'react-intl';

import { AssetType } from 'routes/Issuer/AssetIssuance/templatesTypes';
import Icon from 'uiComponents/Icon';
import { FormTopNavigation } from 'uiComponents/OrderForm';
import { Steps } from '../SubscriptionOrder';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { CommonTexts } from 'texts/commun/commonTexts';
import Button from 'uiComponents/Button';
import {
  ClassData,
  Docusign,
  PaymentOption,
} from 'routes/Issuer/AssetIssuance/assetTypes';

interface ISupscriptionOrderHeaderProps {
  currentStep: Steps;
  selectedShareClass: ClassData;
  assetType: AssetType;
  legalAgreement?: Docusign;
  setCurrentStep: (currentStep: Steps) => void;
}

const SubscriptionOrderHeader = ({
  currentStep,
  selectedShareClass,
  assetType,
  legalAgreement,
  setCurrentStep,
}: ISupscriptionOrderHeaderProps) => {
  const intl = useIntl();
  if (assetType === AssetType.SYNDICATED_LOAN) {
    return (
      <FormTopNavigation>
        <div>
          <span className={currentStep === 'details' ? 'active' : undefined}>
            {intl.formatMessage(SubscriptionTexts.conditionsPrecedent)}
          </span>
          <Icon icon={mdiChevronRight} width={18} />
          <span
            className={currentStep === 'confirmation' ? 'active' : undefined}
          >
            {intl.formatMessage(CommonTexts.confirmation)}
          </span>
        </div>
      </FormTopNavigation>
    );
  } else if (assetType === AssetType.PHYSICAL_ASSET) {
    return (
      <FormTopNavigation>
        <div>
          <span className={currentStep === 'details' ? 'active' : undefined}>
            {intl.formatMessage(CommonTexts.orderDetails)}
          </span>
          <Icon icon={mdiChevronRight} width={18} />
          <span
            className={currentStep === 'confirmation' ? 'active' : undefined}
          >
            {intl.formatMessage(CommonTexts.confirmation)}
          </span>
        </div>
      </FormTopNavigation>
    );
  } else if (assetType === AssetType.FIXED_RATE_BOND) {
    return (
      <FormTopNavigation>
        <div>
          {currentStep === 'payment' ? (
            <Button
              size="small"
              label={intl.formatMessage(CommonTexts.viewOrder)}
              iconLeft={mdiArrowLeft}
              tertiary
              onClick={() => setCurrentStep('details')}
            />
          ) : (
            <>
              <span
                className={currentStep === 'details' ? 'active' : undefined}
              >
                {intl.formatMessage(CommonTexts.orderDetails)}
              </span>
              <Icon icon={mdiChevronRight} width={18} />
              <span
                className={
                  currentStep === 'confirmation' ? 'active' : undefined
                }
              >
                {intl.formatMessage(CommonTexts.confirmation)}
              </span>
            </>
          )}
        </div>
      </FormTopNavigation>
    );
  }
  return (
    <FormTopNavigation>
      <div>
        <span className={currentStep === 'details' ? 'active' : undefined}>
          {intl.formatMessage(CommonTexts.orderDetails)}
        </span>
        <Icon icon={mdiChevronRight} width={18} />
        {selectedShareClass.paymentOptions?.option ===
          PaymentOption.AT_ORDER_CREATION && (
          <>
            {legalAgreement && (
              <>
                <span
                  className={currentStep === 'docusign' ? 'active' : undefined}
                >
                  {intl.formatMessage(SubscriptionTexts.subscriptionAgreement)}
                </span>
                <Icon icon={mdiChevronRight} width={18} />
              </>
            )}
            <span className={currentStep === 'payment' ? 'active' : undefined}>
              {intl.formatMessage(CommonTexts.payment)}
            </span>
            <Icon icon={mdiChevronRight} width={18} />
          </>
        )}
        <span className={currentStep === 'confirmation' ? 'active' : undefined}>
          {intl.formatMessage(CommonTexts.confirmation)}
        </span>
      </div>
    </FormTopNavigation>
  );
};

export default SubscriptionOrderHeader;
