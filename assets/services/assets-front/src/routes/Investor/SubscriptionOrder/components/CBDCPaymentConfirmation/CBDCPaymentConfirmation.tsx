import {
  API_RETRIEVE_ASSET_BY_ID,
  API_RETRIEVE_ORDER,
  API_SECONDARY_TRADE_PROVIDE_PAYMENT_HOLD_ID,
} from 'constants/apiRoutes';
import {
  AssetType,
  IToken,
  IWorkflowInstance,
  OrderSide,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
} from 'routesList';
import {
  Confirmation,
  ConfirmationActions,
  FormFooter,
  FormHeading,
  FormTopNavigation,
} from 'uiComponents/OrderForm/';
import {
  OrderSplitScreenLayout,
  OrderSplitScreenMainContent,
  OrderSplitScreenSideBar,
} from 'uiComponents/OrderSplitScreenLayout/';
import React, { useEffect, useState } from 'react';
import { colors, spacing } from 'constants/styles';
import { getLoanDataFromToken, getTokenMetadata } from 'utils/commonUtils';
import { mdiAlertOctagon, mdiArrowLeft, mdiCheckCircle } from '@mdi/js';

import Button from 'uiComponents/Button';
import { CommonTexts } from 'texts/commun/commonTexts';
import { DataCall } from 'utils/dataLayer';
import Icon from 'uiComponents/Icon';
import Input from 'uiComponents/Input';
import { Link } from 'react-router-dom';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import { RouteComponentProps } from 'react-router-dom';
import SubscriptionSummary from 'routes/Investor/SubscriptionSummary';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { useIntl } from 'react-intl';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps
  extends RouteComponentProps<{
    orderId: string;
    paymentId: string;
  }> {}

type Steps = 'paying' | 'paid';

export const CBDCPaymentConfirmation: React.FC<IProps> = ({
  match: {
    params: { orderId, paymentId },
  },
}: IProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [order, setOrder] = useState<IWorkflowInstance>();
  const [token, setToken] = useState<IToken>();
  const [facility, setFacility] = useState<ClassData>();
  const [assetType, setAssetType] = useState<AssetType>();
  const [currentStep, setCurrentStep] = useState<Steps>('paying');
  const intl = useIntl();

  useEffect(
    () => {
      const loadData = async () => {
        try {
          setIsLoading(true);
          const { order } = await DataCall({
            method: API_RETRIEVE_ORDER.method,
            path: API_RETRIEVE_ORDER.path(orderId),
            urlParams: {
              withBalances: false,
            },
          });
          setOrder(order);

          const { token } = await DataCall({
            method: API_RETRIEVE_ASSET_BY_ID.method,
            path: API_RETRIEVE_ASSET_BY_ID.path(order.entityId),
            urlParams: {
              withBalances: false,
            },
          });
          setToken(token);

          const { facilities } = getLoanDataFromToken(token);
          const facility = facilities.find(
            (fac) => fac.key === order.assetClassKey,
          ) as ClassData;
          setFacility(facility);

          const { assetType } = getTokenMetadata(order);
          setAssetType(assetType);

          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
          setHasLoadingError(true);
        }
      };
      loadData();
    },
    // eslint-disable-next-line
    [],
  );

  const confirmPayment = async (
    order: IWorkflowInstance,
    paymentHoldId: string,
  ) => {
    try {
      setIsLoading(true);

      const { order: newOrder } = await DataCall({
        method: API_SECONDARY_TRADE_PROVIDE_PAYMENT_HOLD_ID.method,
        path: API_SECONDARY_TRADE_PROVIDE_PAYMENT_HOLD_ID.path(),
        body: {
          orderId: order.id,
          paymentHoldId,
          sendNotification: true,
        },
      });

      setOrder(newOrder);
      setCurrentStep('paid');
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(CommonTexts.error),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
  };

  if (hasLoadingError || !token || !order || !facility || !assetType) {
    if (isLoading) {
      return (
        <OrderSplitScreenLayout>
          <PageLoader />
        </OrderSplitScreenLayout>
      );
    }
    return <PageError />;
  }

  return (
    <OrderSplitScreenLayout>
      <OrderSplitScreenMainContent>
        <FormTopNavigation>
          <div>
            <Link
              to={CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
                orderId: `${order.id}`,
              })}
              style={{
                color: colors.main,
              }}
            >
              <Icon icon={mdiArrowLeft} width={18} color={colors.main} />
              <span
                style={{
                  color: colors.main,
                }}
              >
                {intl.formatMessage(CommonTexts.back)}
              </span>
            </Link>
          </div>
        </FormTopNavigation>

        <div>
          <FormHeading>{intl.formatMessage(CommonTexts.payment)}</FormHeading>
          {isLoading && <PageLoader />}
          {!isLoading && (
            <>
              {currentStep === 'paying' && (
                <>
                  <div>
                    <h2>{intl.formatMessage(CommonTexts.confirmPayment)}</h2>
                    {intl.formatMessage(
                      order.orderSide === OrderSide.BUY
                        ? SubscriptionTexts.confirmCBDCPaymentInfoBorrower
                        : SubscriptionTexts.confirmCBDCPaymentInfoLeadArranger,
                    )}
                  </div>
                  <Input
                    style={{ marginBottom: spacing.small }}
                    label={intl.formatMessage(CommonTexts.paymentId)}
                    required
                    defaultValue={paymentId}
                    disabled
                  />
                  <FormFooter>
                    <Button
                      label={intl.formatMessage(CommonTexts.confirmPayment)}
                      onClick={() => confirmPayment(order, paymentId)}
                    />
                  </FormFooter>
                </>
              )}
              {currentStep === 'paid' && (
                <>
                  <Confirmation>
                    <Icon
                      icon={mdiCheckCircle}
                      color={colors.success}
                      style={{ width: '24px', height: '24px' }}
                    />
                    <span>
                      {intl.formatMessage(CommonTexts.paymentConfirmed)}
                    </span>
                  </Confirmation>

                  <p>
                    <b>{intl.formatMessage(CommonTexts.whatHappensNext)}</b>
                  </p>

                  <p>
                    {intl.formatMessage(
                      order.orderSide === OrderSide.BUY
                        ? SubscriptionTexts.whatHappensNextDVPRepayment
                        : SubscriptionTexts.whatHappensNextDVP,
                    )}
                  </p>

                  <ConfirmationActions>
                    <Button
                      label={intl.formatMessage(CommonTexts.view)}
                      href={CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
                        orderId: `${(order as IWorkflowInstance).id}`,
                      })}
                    />
                  </ConfirmationActions>
                </>
              )}
            </>
          )}
        </div>
      </OrderSplitScreenMainContent>

      <OrderSplitScreenSideBar>
        <SubscriptionSummary
          order={order}
          token={token}
          shareClass={facility}
          currentTotal={0} // not used
          assetHref={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
            assetId: token.id,
          })}
          assetType={assetType}
        />
      </OrderSplitScreenSideBar>
    </OrderSplitScreenLayout>
  );
};
