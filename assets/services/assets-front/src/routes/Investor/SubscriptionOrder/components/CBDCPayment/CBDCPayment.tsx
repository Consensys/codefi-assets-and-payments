import {
  API_CBDC_DIGITAL_CURRENCIES,
  API_CBDC_DIGITAL_CURRENCY_LEGAL_ENTITIES,
  API_RETRIEVE_ASSET_BY_ID,
  API_RETRIEVE_ORDER,
} from 'constants/apiRoutes';
import {
  AssetType,
  DigitalCurrency,
  DigitalCurrencyLegalEntity,
  IToken,
  IWorkflowInstance,
  OrderSide,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
} from 'routesList';
import { DEFAULT_CBDC_ENTITIES, DEFAULT_CBDC_PARAMS } from 'constants/cbdc';
import {
  Details,
  FormFooter,
  FormHeading,
  FormTopNavigation,
} from 'uiComponents/OrderForm';
import { IUser } from 'User';
import {
  OrderSplitScreenLayout,
  OrderSplitScreenMainContent,
  OrderSplitScreenSideBar,
} from 'uiComponents/OrderSplitScreenLayout/';
import React, { useEffect, useState } from 'react';
import {
  getLoanDataFromToken,
  getTokenMetadata,
  getUserMetadata,
} from 'utils/commonUtils';

import Button from 'uiComponents/Button';
import { CommonTexts } from 'texts/commun/commonTexts';
import { DataCall } from 'utils/dataLayer';
import Icon from 'uiComponents/Icon';
import { Link } from 'react-router-dom';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import { RouteComponentProps } from 'react-router-dom';
import SubscriptionSummary from 'routes/Investor/SubscriptionSummary';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { colors } from 'constants/styles';
import { currencyFormat } from 'utils/currencyFormat';
import { getOrderPaymentBreakdown } from 'constants/order';
import { getRepaymentBreakdown } from 'routes/Investor/SyndicatedLoan/RepaymentRequest/repaymentUtils';
import { mdiArrowLeft } from '@mdi/js';
import { useIntl } from 'react-intl';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';

interface IProps
  extends RouteComponentProps<{
    orderId: string;
  }> {}

export const CBDCPayment: React.FC<IProps> = ({
  history,
  match: {
    params: { orderId },
  },
}: IProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [order, setOrder] = useState<IWorkflowInstance>();
  const [token, setToken] = useState<IToken>();
  const [facility, setFacility] = useState<ClassData>();
  const [currency, setCurrency] = useState<string>();
  const [assetType, setAssetType] = useState<AssetType>();
  const [paymentAddress, setPaymentAddress] = useState();
  const [digitalCurrency, setDigitalCurrency] = useState<DigitalCurrency>();
  const [recipientLegalEntity, setRecipientLegalEntity] =
    useState<DigitalCurrencyLegalEntity>();
  const intl = useIntl();
  const dispatch = useDispatch();

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

          try {
            const retrievedDigitalCurrencies: DigitalCurrency[] =
              await DataCall({
                method: API_CBDC_DIGITAL_CURRENCIES.method,
                path: API_CBDC_DIGITAL_CURRENCIES.path(),
              });

            const selectedDigitalCurrency = retrievedDigitalCurrencies.find(
              ({ address }) => address === order.data.dvp.payment.tokenAddress,
            );
            setDigitalCurrency(selectedDigitalCurrency);
          } catch {
            setDigitalCurrency(DEFAULT_CBDC_PARAMS);
          }

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

          const borrower = order.metadata?.user as IUser;

          const { assetType, currency } = getTokenMetadata(order);
          setCurrency(currency);
          setAssetType(assetType);

          const paymentAddress = order.data?.dvp?.payment?.tokenAddress;
          setPaymentAddress(paymentAddress);

          try {
            const retrievedLegalEntities: DigitalCurrencyLegalEntity[] =
              await DataCall({
                method: API_CBDC_DIGITAL_CURRENCY_LEGAL_ENTITIES.method,
                path: API_CBDC_DIGITAL_CURRENCY_LEGAL_ENTITIES.path(),
              });
            // TODO - make lookup more precise
            setRecipientLegalEntity(
              retrievedLegalEntities.find(
                (legalEntity) =>
                  legalEntity.name ===
                  `${borrower?.firstName} ${borrower?.lastName}`,
              ),
            );
          } catch (error) {
            setRecipientLegalEntity(
              (DEFAULT_CBDC_ENTITIES as DigitalCurrencyLegalEntity[]).find(
                (legalEntity) =>
                  legalEntity.name ===
                  `${borrower?.firstName} ${borrower?.lastName}`,
              ),
            );
          }

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

  if (isLoading) {
    return (
      <OrderSplitScreenLayout>
        <PageLoader />
      </OrderSplitScreenLayout>
    );
  }

  if (hasLoadingError || !token || !order || !facility || !assetType) {
    return <PageError />;
  }

  let totalPaymentAmount = 0;

  if (order.orderSide === OrderSide.BUY) {
    const { totalRepaymentAmount } = getRepaymentBreakdown(
      token,
      facility,
      order,
    );

    totalPaymentAmount = totalRepaymentAmount;
  } else {
    const orderPaymentBreakdown = getOrderPaymentBreakdown(token, order);
    totalPaymentAmount =
      orderPaymentBreakdown.netAmount + orderPaymentBreakdown.tradeOrderFee;
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
          <Details>
            <p>{intl.formatMessage(SubscriptionTexts.paymentInfo)}</p>
            <li>
              <span>{intl.formatMessage(CommonTexts.recipient)}</span>
              <span>{getUserMetadata(order).name}</span>
            </li>
            <li>
              <span>{intl.formatMessage(CommonTexts.paymentAddress)}</span>
              <span>{paymentAddress}</span>
            </li>
            <li>
              <span>{intl.formatMessage(CommonTexts.totalToTransfer)}</span>
              <span>{currencyFormat(totalPaymentAmount, currency)}</span>
            </li>
          </Details>
          <FormFooter>
            <Button
              label={intl.formatMessage(SubscriptionTexts.payInCDBC)}
              onClick={() => {
                dispatch(
                  setAppModal(
                    appModalData({
                      title: intl.formatMessage(
                        CommonTexts.redirectConfirmation,
                      ),
                      confirmAction: () => {
                        let cbdcUrl: string;
                        if (process.env.NODE_ENV === 'development') {
                          cbdcUrl = process.env.REACT_APP_CBDC_URL || '';
                        } else {
                          cbdcUrl = process.env.REACT_APP_CBDC_BASE_URL || '';
                        }
                        window.location.assign(
                          `${cbdcUrl}digital-currency/${
                            digitalCurrency?.digitalCurrencyId
                          }/hold?platform=CodefiAsset&platformOrderId=${
                            order.id
                          }&amount=${totalPaymentAmount}&hashLock=${
                            order.data.dvp?.htlcSecret?.secretHash
                          }${
                            recipientLegalEntity?.legalEntityId
                              ? `&recipient=${recipientLegalEntity.legalEntityId}`
                              : ''
                          }&notaryAddress=${
                            order.data.dvp?.dvpAddress
                          }&returnTo=${
                            window.location.origin
                          }${CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT.pathBuilder(
                            { orderId: String(order.id) },
                          )}`,
                        );
                      },
                      confirmLabel: intl.formatMessage(
                        CommonTexts.confirmation,
                      ),
                      content: (
                        <div style={{ width: 520 }}>
                          <p>
                            {intl.formatMessage(
                              SubscriptionTexts.redirectToCBDCPayment,
                            )}
                          </p>
                        </div>
                      ),
                    }),
                  ),
                );
              }}
            />
          </FormFooter>
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
