import { colors } from 'constants/styles';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  AssetType,
  IToken,
  IWorkflowInstance,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  CLIENT_ROUTE_INVESTOR_PORTFOLIO,
  CLIENT_ROUTE_ORDER_MANAGEMENT,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
} from 'routesList';
import Button from 'uiComponents/Button';
import Icon from 'uiComponents/Icon';
import {
  Confirmation,
  ConfirmationActions,
  FormHeading,
} from 'uiComponents/OrderForm/';
import { getProductFromToken } from 'utils/commonUtils';
import { formatLongDate } from 'utils/formatLongDate';

import { mdiCheckCircle } from '@mdi/js';
import { useIntl } from 'react-intl';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { CommonTexts } from 'texts/commun/commonTexts';
import {
  ClassData,
  PaymentOption,
} from 'routes/Issuer/AssetIssuance/assetTypes';

interface IProps {
  token: IToken;
  selectedShareClass: ClassData;
  cutOffDate: number;
  order: IWorkflowInstance;
}

export const SubscriptionConfirmation: React.FC<IProps> = ({
  token,
  selectedShareClass,
  cutOffDate,
  order,
}: IProps) => {
  const intl = useIntl();
  const { assetType } = getProductFromToken(token as IToken);

  if (assetType === AssetType.SYNDICATED_LOAN) {
    return (
      <div>
        <FormHeading>
          {intl.formatMessage(
            SubscriptionTexts.conditionsPrecedentConfirmation,
          )}
        </FormHeading>

        <Confirmation>
          <Icon
            icon={mdiCheckCircle}
            color={colors.success}
            style={{ width: '24px', height: '24px' }}
          />
          <span>
            {intl.formatMessage(
              SubscriptionTexts.conditionsPrecedentConfirmationProof,
            )}
          </span>
        </Confirmation>

        <p>
          <b>{intl.formatMessage(CommonTexts.whatHappensNext)}</b>
        </p>

        <p>
          {intl.formatMessage(
            SubscriptionTexts.whatHappensNextConditionsPrecedent,
          )}
        </p>

        <ConfirmationActions>
          <Button
            label={intl.formatMessage(CommonTexts.view)}
            href={CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
              orderId: `${order.id}`,
            })}
          />
        </ConfirmationActions>
      </div>
    );
  }

  const isCommodity = assetType === AssetType.PHYSICAL_ASSET;

  return (
    <div>
      <FormHeading>
        {intl.formatMessage(CommonTexts.orderConfirmation)}
      </FormHeading>

      <Confirmation>
        <Icon
          icon={mdiCheckCircle}
          color={colors.success}
          style={{ width: '24px', height: '24px' }}
        />
        <span>
          {intl.formatMessage(SubscriptionTexts.yourOrderHasBeenPlaced)}
        </span>
      </Confirmation>

      <p>
        <b>{intl.formatMessage(CommonTexts.whatHappensNext)}</b>
      </p>

      {selectedShareClass.paymentOptions?.option ===
        PaymentOption.AT_ORDER_CREATION && (
        <>
          <p>
            {intl.formatMessage(SubscriptionTexts.orderCreated)}{' '}
            <Link
              to={CLIENT_ROUTE_ORDER_MANAGEMENT}
              style={{
                color: colors.main,
              }}
            >
              {intl.formatMessage(CommonTexts.orderConfirmation)}
            </Link>
          </p>

          <p>
            {intl.formatMessage(
              SubscriptionTexts.onceIssuerConfirmReceiptOfPayment,
            )}
          </p>

          {isCommodity && (
            <p>{intl.formatMessage(SubscriptionTexts.feeMessage)}</p>
          )}
        </>
      )}

      {selectedShareClass.paymentOptions?.option ===
        PaymentOption.BETWEEN_CUTOFF_AND_SETTLEMENT && (
        <>
          {cutOffDate && (
            <p>
              {intl.formatMessage(SubscriptionTexts.orderCreatedMessage, {
                cutOffDate: formatLongDate(cutOffDate),
              })}
              {''}
              <Link
                to={CLIENT_ROUTE_ORDER_MANAGEMENT}
                style={{
                  color: colors.main,
                }}
              >
                {intl.formatMessage(CommonTexts.orderConfirmation)}
              </Link>
            </p>
          )}

          <p>
            {intl.formatMessage(
              SubscriptionTexts.onceIssuerConfirmReceiptOfPaymentSettlement,
            )}
          </p>
        </>
      )}

      <ConfirmationActions>
        <Button
          label={intl.formatMessage(CommonTexts.viewOrder)}
          href={CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
            orderId: `${order.id}`,
          })}
        />
        <Button
          label={intl.formatMessage(SubscriptionTexts.viewInPortfolio)}
          href={CLIENT_ROUTE_INVESTOR_PORTFOLIO}
          tertiary
        />
      </ConfirmationActions>
    </div>
  );
};
