import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import Button from 'uiComponents/Button';

import {
  OrderSplitScreenSideBar,
  OrderSplitScreenLayout,
  OrderSplitScreenMainContent,
} from 'uiComponents/OrderSplitScreenLayout/';
import {
  IToken,
  IWorkflowInstance,
  AssetType,
  IDocument,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { DataCall } from 'utils/dataLayer';
import {
  API_RETRIEVE_ASSET_BY_ID,
  API_RETRIEVE_ORDER,
  API_SECONDARY_TRADE_SEND_PAYMENT,
} from 'constants/apiRoutes';
import { getProductFromToken, getTokenMetadata } from 'utils/commonUtils';
import {
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
} from 'routesList';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { currencyFormat } from 'utils/currencyFormat';
import {
  Details,
  FormHeading,
  FormTopNavigation,
  FormFooter,
  Form,
} from 'uiComponents/OrderForm';
import Icon from 'uiComponents/Icon';
import { mdiAlertOctagon, mdiArrowLeft } from '@mdi/js';
import { colors, spacing, typography } from 'constants/styles';
import { IUser } from 'User';
import { Link } from 'react-router-dom';
import SellRequestSummary from 'routes/Investor/SellRequestSummary';
import InputFile from 'uiComponents/InputFile';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps
  extends RouteComponentProps<{
    assetId: string;
    classKey: string;
    orderId: string;
  }> {}

export const SellRequestPayment: React.FC<IProps> = ({
  history,
  match: {
    params: { assetId, classKey, orderId },
  },
}: IProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [order, setOrder] = useState<IWorkflowInstance>();
  const [token, setToken] = useState<IToken>();
  const [shareClass, setShareClass] = useState<ClassData>();
  const [currency, setCurrency] = useState<string>();
  const [assetType, setAssetType] = useState<AssetType>();
  const [wireTransferConfirmation, setWireTransferConfirmation] =
    useState<IDocument>();
  const [currentNav, setCurrentNav] = useState(0);
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

          const { token } = await DataCall({
            method: API_RETRIEVE_ASSET_BY_ID.method,
            path: API_RETRIEVE_ASSET_BY_ID.path(assetId),
            urlParams: {
              withBalances: false,
            },
          });
          setToken(token);

          const { shareClasses, nav } = getProductFromToken(token);
          const selectedShareClass = shareClasses.find(
            (fac) => fac.key === classKey,
          );
          setShareClass(selectedShareClass);

          const { assetType, currency } = getTokenMetadata(order);
          setCurrency(currency);
          setAssetType(assetType);
          setCurrentNav(nav);
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

  const sendPayment = async (
    order: IWorkflowInstance,
    paymentProof: string[],
  ) => {
    try {
      setIsLoading(true);
      const { order: newOrder } = await DataCall({
        method: API_SECONDARY_TRADE_SEND_PAYMENT.method,
        path: API_SECONDARY_TRADE_SEND_PAYMENT.path(),
        body: {
          orderId: order.id,
          paymentProof,
          paymentAmount: order.quantity * order.price,
          sendNotification: true,
        },
      });
      history.push(
        CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
          orderId: newOrder.id,
        }),
      );
    } catch (error) {
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
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <OrderSplitScreenLayout>
        <PageLoader />
      </OrderSplitScreenLayout>
    );
  }

  if (hasLoadingError || !token || !order || !shareClass || !assetType) {
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

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            dispatch(
              setAppModal(
                appModalData({
                  title: intl.formatMessage(CommonTexts.paymentCompleted),
                  confirmAction: () =>
                    wireTransferConfirmation &&
                    sendPayment(order, [
                      wireTransferConfirmation.filename,
                      wireTransferConfirmation.docId,
                    ]),
                  confirmLabel: intl.formatMessage(
                    CommonTexts.paymentCompleted,
                  ),
                  content: (
                    <div style={{ width: 520 }}>
                      <p>
                        {intl.formatMessage(
                          SubscriptionTexts.paymentConfirmationMessage,
                        )}
                      </p>
                    </div>
                  ),
                }),
              ),
            );
          }}
        >
          <FormHeading>{intl.formatMessage(CommonTexts.payment)}</FormHeading>
          <Details>
            <h2>{intl.formatMessage(CommonTexts.transferDetails)}</h2>
            <li>
              <span>{intl.formatMessage(CommonTexts.bankName)}</span>
              <span>HSBC</span>
            </li>
            <li>
              <span>{intl.formatMessage(CommonTexts.IBAN)}</span>
              <span>DE89 3704 0044 0532 0130 00</span>
            </li>
            <li>
              <span>{intl.formatMessage(CommonTexts.BIC)}</span>
              <span>HLFXGB22</span>
            </li>
            <li>
              <span>
                {intl.formatMessage(CommonTexts.transferReferenceNumber)}
              </span>
              <span>{order.paymentId}</span>
            </li>
            <li>
              <span>{intl.formatMessage(CommonTexts.totalToTransfer)}</span>
              <span>
                {currencyFormat(order.price * order.quantity, currency)}
              </span>
            </li>
          </Details>

          <InputFile
            name="wire-transfer"
            label={intl.formatMessage(
              SubscriptionTexts.uploadWireTransferConfirmation,
            )}
            sublabel={
              <Link
                style={{
                  color: colors.main,
                }}
                to="#"
                onClick={() => {
                  dispatch(
                    setAppModal(
                      appModalData({
                        title: intl.formatMessage(
                          CommonTexts.acceptedDocumentsTypes,
                        ),
                        isSimpleAcknowledgement: true,
                        confirmColor: colors.successDark,
                        content: (
                          <div>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: typography.sizeF2,
                                lineHeight: '24px',
                                color: '#000A28',
                              }}
                            >
                              {intl.formatMessage(
                                SubscriptionTexts.wireTransferConfirmationDocuments,
                              )}
                            </span>
                            <ul
                              style={{
                                listStyleType: 'decimal',
                                width: 516,
                                paddingLeft: 14,
                                marginTop: spacing.tight,
                              }}
                            >
                              <li>
                                {intl.formatMessage(
                                  SubscriptionTexts.screenCaptureWireTransferConfirmation,
                                )}
                              </li>
                              <li>
                                {intl.formatMessage(
                                  SubscriptionTexts.emailWireTransferConfirmation,
                                )}
                              </li>
                            </ul>
                          </div>
                        ),
                      }),
                    ),
                  );
                }}
              >
                {intl.formatMessage(SubscriptionTexts.seeAcceptedDocumentTypes)}
              </Link>
            }
            value={
              wireTransferConfirmation
                ? [
                    wireTransferConfirmation.filename,
                    wireTransferConfirmation.docId,
                  ]
                : undefined
            }
            onChange={async (newValue) => {
              setWireTransferConfirmation(
                newValue.length === 2
                  ? {
                      filename: newValue[0],
                      docId: newValue[1],
                    }
                  : undefined,
              );
            }}
            required
          />

          <FormFooter>
            <Button
              label={intl.formatMessage(CommonTexts.paymentCompleted)}
              type="submit"
            />
          </FormFooter>
        </Form>
      </OrderSplitScreenMainContent>

      <OrderSplitScreenSideBar>
        <SellRequestSummary
          order={order}
          assetName={token.name}
          issuer={token.issuer as IUser}
          shareClass={shareClass}
          currentSharePrice={currentNav}
          amount={order.quantity}
          price={order.price}
          recipient={order.recipientId}
          assetHref={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
            assetId: token.id,
          })}
          assetType={assetType}
        />
      </OrderSplitScreenSideBar>
    </OrderSplitScreenLayout>
  );
};
