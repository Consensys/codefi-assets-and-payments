import './SubscriptionOrderOverview.scss';

import {
  API_ACCEPT_SECONDARY_TRADE_ORDER,
  API_ALLOWLIST_TOKEN_RELATED_KYC,
  API_APPROVE_SECONDARY_TRADE_ORDER,
  API_CANCEL_PRIMARY_TRADE_ORDER,
  API_CREATE_SECONDARY_TRADE_DELIVERY_TOKEN_HOLD,
  API_EXECUTE_PRIMARY_TRADE_ORDER,
  API_REJECT_PRIMARY_TRADE_ORDER,
  API_REJECT_SECONDARY_TRADE_ORDER,
  API_RETRIEVE_ASSET_BY_ID,
  API_RETRIEVE_FEE,
  API_RETRIEVE_ORDER,
  API_SECONDARY_TRADE_RECEIVE_PAYMENT,
  API_SETTLE_PRIMARY_ORDER,
  API_SETTLE_SECONDARY_ATOMIC_TRADE_ORDER,
  API_SETTLE_SECONDARY_NON_ATOMIC_TRADE_ORDER,
} from 'constants/apiRoutes';
import {
  AssetType,
  DvpType,
  IToken,
  IWorkflowInstance,
  OrderSide,
  OrderType,
  PrimaryTradeType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  CLIENT_ROUTE_ASSET_OVERVIEW,
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST_PAYMENT,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST_PAYMENT,
  CLIENT_ROUTE_ORDER_MANAGEMENT,
} from 'routesList';
import { IUser, UserType } from 'User';
import { WrappedComponentProps, injectIntl } from 'react-intl';
import {
  getLoanDataFromToken,
  getNextTransactionStatus,
  getProductFromToken,
  getTokenShareClassCurrentNav,
  getUserMetadata,
} from 'utils/commonUtils';
import { mdiAlertOctagon, mdiCancel } from '@mdi/js';

import { useSelector, useDispatch } from 'react-redux';
import ApproveTradeOrderModal from './components/ApproveTradeOrderModal';
import Button from 'uiComponents/Button';
import { CommonTexts } from 'texts/commun/commonTexts';
import { DataCall } from 'utils/dataLayer';
import Input from 'uiComponents/Input';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import PageTitle from 'uiComponents/PageTitle';
import React, { useCallback, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Select from 'uiComponents/Select';
import SubscriptionSummary from '../SubscriptionSummary';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { colors } from 'constants/styles';
import { hasRole } from 'utils/HasRole';
import { isTradeOrder } from 'constants/order';
import { orderManagementRules } from 'utils/tokenUtility';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { setAppModal, userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps
  extends WrappedComponentProps,
    RouteComponentProps<{ orderId: string }> {}

interface IState {
  order?: IWorkflowInstance;
  token?: IToken;
  selectedShareClass?: ClassData;
  isLoading: boolean;
  hasLoadingError: boolean;
  investorFee?: number;
  user: IUser;
}

let timeout: any;

const SubscriptionOrderOverview: React.FC<IProps> = ({ intl, match }) => {
  const user = useSelector(userSelector) as IUser;
  const dispatch = useDispatch();

  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    user,
  });

  const checkPendingStatus = async (order: IWorkflowInstance) => {
    const orderNextStatus = getNextTransactionStatus(order.data);
    if (orderNextStatus === 'pending') {
      timeout = setTimeout(() => {
        loadData(false);
      }, 3000);
      return;
    }
  };

  const loadData = useCallback(
    async (isLoading = true) => {
      const checkPendingStatus = async (order: IWorkflowInstance) => {
        const orderNextStatus = getNextTransactionStatus(order.data);
        if (orderNextStatus === 'pending') {
          timeout = setTimeout(() => {
            loadData(false);
          }, 3000);
          return;
        }
      };

      try {
        const { user } = state;
        setState((s) => ({
          ...s,
          isLoading,
        }));
        const { order } = await DataCall({
          method: API_RETRIEVE_ORDER.method,
          path: API_RETRIEVE_ORDER.path(match.params.orderId),
          urlParams: {
            withBalances: false,
          },
        });

        const { token } = await DataCall({
          method: API_RETRIEVE_ASSET_BY_ID.method,
          path: API_RETRIEVE_ASSET_BY_ID.path(order.entityId),
          urlParams: {
            withBalances: false,
            withCycles: true,
          },
        });

        const { shareClasses } = getProductFromToken(token);
        const selectedShareClass = shareClasses.find(
          (shareClass) => shareClass.key === order.assetClassKey,
        ) as ClassData;

        let investorFee: any;

        if (hasRole(user, [UserType.INVESTOR])) {
          const { fees } = await DataCall({
            method: API_RETRIEVE_FEE.method,
            path: API_RETRIEVE_FEE.path(token.id),
            urlParams: {
              assetClass: selectedShareClass.key,
              investorId: order.userId,
            },
          });
          investorFee = fees?.acquiredEntryFees;
        }

        checkPendingStatus(order);

        setState((s) => ({
          ...s,
          order,
          token,
          selectedShareClass,
          isLoading: false,
          investorFee,
        }));
      } catch (error) {
        setState((s) => ({
          ...s,
          isLoading: false,
          hasLoadingError: true,
        }));
      }
    },
    [match.params.orderId, state],
  );

  useEffect(() => {
    loadData();

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [loadData]);

  const issueTokens = async (order: IWorkflowInstance) => {
    try {
      setState((s) => ({ ...s, isLoading: true }));
      const { order: finalOrder } = await DataCall({
        method: API_SETTLE_PRIMARY_ORDER.method,
        path: API_SETTLE_PRIMARY_ORDER.path(),
        body: {
          orderId: order.id,
          sendNotification: true,
        },
      });
      const { token } = state;
      const assetType = token?.assetData?.type;

      if (assetType === AssetType.SYNDICATED_LOAN) {
        const { borrowerId } = getLoanDataFromToken(token as IToken);
        try {
          await DataCall({
            method: API_ALLOWLIST_TOKEN_RELATED_KYC.method,
            path: API_ALLOWLIST_TOKEN_RELATED_KYC.path(),
            body: {
              submitterId: borrowerId,
              tokenId: order.entityId,
              sendNotification: false,
              clientCategory: 'PROFESSIONAL_CLIENTS',
              riskProfile: 'MODERATE',
              comment: 'Borrower invited to view all token transaction',
            },
          });
        } catch (err) {
          //
        }
      }

      checkPendingStatus(finalOrder);
      setState((s) => ({
        ...s,
        isLoading: false,
        order: finalOrder,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        hasLoadingError: true,
      }));
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

  const executeOrder = async (order: IWorkflowInstance) => {
    try {
      setState((s) => ({ ...s, isLoading: true }));
      const { order: newOrder } = await DataCall({
        method: API_EXECUTE_PRIMARY_TRADE_ORDER.method,
        path: API_EXECUTE_PRIMARY_TRADE_ORDER.path(),
        body: {
          orderId: order.id,
          sendNotification: true,
        },
      });
      setState((s) => ({
        ...s,
        isLoading: false,
        order: newOrder,
      }));
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
      setState((s) => ({
        ...s,
        isLoading: false,
      }));
    }
  };

  const approveTradeOrder = async (order: IWorkflowInstance) => {
    try {
      setState((s) => ({ ...s, isLoading: true }));
      if (order.data.tradeOrderType === 'Novation') {
        await DataCall({
          method: API_ALLOWLIST_TOKEN_RELATED_KYC.method,
          path: API_ALLOWLIST_TOKEN_RELATED_KYC.path(),
          body: {
            // assetClass: order.assetClassKey,
            submitterId: order.data?.dvp?.recipient?.id,
            tokenId: order.entityId,
            sendNotification: true,
            clientCategory: 'PROFESSIONAL_CLIENTS',
            riskProfile: 'MODERATE',
            comment: 'Underwriter invited to view the token',
          },
        });
      }
      const { order: newOrder } = await DataCall({
        method: API_APPROVE_SECONDARY_TRADE_ORDER.method,
        path: API_APPROVE_SECONDARY_TRADE_ORDER.path(),
        body: {
          orderId: order.id,
          sendNotification: true,
          sendInviteNotification: true,
        },
      });
      setState((s) => ({
        ...s,
        isLoading: false,
        order: newOrder,
      }));
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
      setState((s) => ({
        ...s,
        isLoading: false,
      }));
    }
  };

  const rejectTradeOrder = async (
    order: IWorkflowInstance,
    comment: string,
  ) => {
    try {
      setState((s) => ({ ...s, isLoading: true }));
      const { order: newOrder } = await DataCall({
        method: API_REJECT_SECONDARY_TRADE_ORDER.method,
        path: API_REJECT_SECONDARY_TRADE_ORDER.path(),
        body: {
          orderId: order.id,
          comment: comment,
          sendNotification: true,
        },
      });
      setState((s) => ({
        ...s,
        isLoading: false,
        order: newOrder,
      }));
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(SubscriptionTexts.rejectOrderError),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
      setState((s) => ({
        ...s,
        isLoading: false,
        hasLoadingError: true,
      }));
    }
  };

  const acceptTradeOrder = async (order: IWorkflowInstance) => {
    try {
      setState((s) => ({ ...s, isLoading: true }));
      const { order: newOrder } = await DataCall({
        method: API_ACCEPT_SECONDARY_TRADE_ORDER.method,
        path: API_ACCEPT_SECONDARY_TRADE_ORDER.path(),
        body: {
          orderId: order.id,
          sendNotification: true,
        },
      });
      setState((s) => ({
        ...s,
        isLoading: false,
        order: newOrder,
      }));
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
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

  const requestTradeOrderPayment = async (
    order: IWorkflowInstance,
    timeToExpiration?: string,
  ) => {
    try {
      let body: any = {
        orderId: order.id,
        sendNotification: true,
      };
      if (timeToExpiration) {
        body = {
          ...body,
          timeToExpiration: parseInt(timeToExpiration),
        };
      }
      setState((s) => ({ ...s, isLoading: true }));
      const { order: newOrder } = await DataCall({
        method: API_CREATE_SECONDARY_TRADE_DELIVERY_TOKEN_HOLD.method,
        path: API_CREATE_SECONDARY_TRADE_DELIVERY_TOKEN_HOLD.path(),
        body,
      });
      checkPendingStatus(newOrder);

      setState((s) => ({
        ...s,
        isLoading: false,
        order: newOrder,
      }));
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
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

  const confirmTradeOrderPayment = async (order: IWorkflowInstance) => {
    try {
      setState((s) => ({ ...s, isLoading: true }));
      const { order: newOrder } = await DataCall({
        method: API_SECONDARY_TRADE_RECEIVE_PAYMENT.method,
        path: API_SECONDARY_TRADE_RECEIVE_PAYMENT.path(),
        body: {
          orderId: order.id,
          paymentAmount: order.quantity * order.price,
          sendNotification: true,
        },
      });

      setState((s) => ({
        ...s,
        isLoading: false,
        order: newOrder,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
      }));
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

  const settleTradeOrder = async (order: IWorkflowInstance) => {
    try {
      setState((s) => ({ ...s, isLoading: true }));
      const dbpType = order.data.dvp?.type;
      let newOrder: IWorkflowInstance;
      if (dbpType === DvpType.ATOMIC) {
        ({ order: newOrder } = await DataCall({
          method: API_SETTLE_SECONDARY_ATOMIC_TRADE_ORDER.method,
          path: API_SETTLE_SECONDARY_ATOMIC_TRADE_ORDER.path(),
          body: {
            orderId: order.id,
            sendNotification: true,
          },
        }));
      } else {
        ({ order: newOrder } = await DataCall({
          method: API_SETTLE_SECONDARY_NON_ATOMIC_TRADE_ORDER.method,
          path: API_SETTLE_SECONDARY_NON_ATOMIC_TRADE_ORDER.path(),
          body: {
            orderId: order.id,
            sendNotification: true,
          },
        }));
      }

      checkPendingStatus(newOrder);

      setState((s) => ({
        ...s,
        isLoading: false,
        order: newOrder,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
      }));
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

  if (state.isLoading) {
    return (
      <div id="_route_subscriptionOrderOverview">
        <PageLoader />
      </div>
    );
  }

  if (
    state.hasLoadingError ||
    !state.order ||
    !state.token ||
    !state.selectedShareClass
  ) {
    return (
      <div id="_route_subscriptionOrderOverview">
        <PageError />
      </div>
    );
  }

  const assetType = state.token.assetData?.type as AssetType;
  const isSecondary =
    assetType === AssetType.PHYSICAL_ASSET ||
    assetType === AssetType.SYNDICATED_LOAN;

  const orderType = state.selectedShareClass.rules?.subscriptionType;

  const currentNav = getTokenShareClassCurrentNav(state.token);
  let currentTotal: number =
    assetType === AssetType.FIXED_RATE_BOND
      ? state.order.quantity * currentNav
      : orderType === OrderType.QUANTITY
      ? state.order.price / currentNav
      : state.order.price;

  if (assetType === AssetType.CURRENCY) currentTotal = state.order.quantity;

  const { canCreateOrder, canCancelOrder, canSettleOrder } =
    orderManagementRules(state.token, state.order.objectId);

  // Syndicated Loan - bypass Issuer's approval of orders type Novation
  const bypassSecondaryTradeIssuerApproval =
    state.token.data?.bypassSecondaryTradeIssuerApproval &&
    ['Novation'].includes(state.order.data.tradeOrderType || '');

  return (
    <div id="_route_subscriptionOrderOverview">
      <PageTitle
        className="title"
        title={intl.formatMessage(CommonTexts.order)}
        backLink={{
          label: intl.formatMessage(CommonTexts.orderManagement),
          to: CLIENT_ROUTE_ORDER_MANAGEMENT,
        }}
      >
        <div className="actions" style={{ display: 'flex' }}>
          {/* NOT TRADE ORDER ACTIONS */}
          {!isTradeOrder(state.order.name) && (
            <>
              {hasRole(user, [UserType.INVESTOR]) &&
                state.order.state === 'subscribed' &&
                !state.order.data.wireTransferConfirmation &&
                state.order.data.tradeType !== PrimaryTradeType.REDEMPTION && (
                  <Button
                    size="small"
                    label={intl.formatMessage(CommonTexts.completePayment)}
                  />
                )}

              {hasRole(user, [UserType.ISSUER]) &&
                state.order.state === 'subscribed' && (
                  <>
                    {assetType === AssetType.PHYSICAL_ASSET && (
                      <Button
                        size="small"
                        label={intl.formatMessage(CommonTexts.issueTokens)}
                        onClick={() => {
                          dispatch(
                            setAppModal(
                              appModalData({
                                title: intl.formatMessage(
                                  CommonTexts.issueTokens,
                                ),
                                confirmAction: () =>
                                  issueTokens(state.order as IWorkflowInstance),
                                confirmLabel: intl.formatMessage(
                                  CommonTexts.issueTokens,
                                ),
                                confirmColor: colors.main,
                                content: (
                                  <div style={{ width: 520 }}>
                                    <p>
                                      {intl.formatMessage(
                                        SubscriptionTexts.areYouSureIssueTokens,
                                      )}
                                    </p>
                                  </div>
                                ),
                              }),
                            ),
                          );
                        }}
                      />
                    )}
                    {assetType === AssetType.CURRENCY && (
                      <Button
                        size="small"
                        label={intl.formatMessage(CommonTexts.issueShares)}
                        onClick={() => {
                          dispatch(
                            setAppModal(
                              appModalData({
                                title: intl.formatMessage(
                                  CommonTexts.issueShares,
                                ),
                                confirmAction: () =>
                                  issueTokens(state.order as IWorkflowInstance),
                                confirmLabel: intl.formatMessage(
                                  CommonTexts.issueShares,
                                ),
                                confirmColor: colors.main,
                                content: (
                                  <div style={{ width: 520 }}>
                                    <p>
                                      {intl.formatMessage(
                                        SubscriptionTexts.areYouSureIssueShares,
                                      )}
                                    </p>
                                  </div>
                                ),
                              }),
                            ),
                          );
                        }}
                      />
                    )}
                    {[
                      AssetType.CLOSED_END_FUND,
                      AssetType.OPEN_END_FUND,
                      AssetType.FIXED_RATE_BOND,
                    ].indexOf(assetType) > -1 && (
                      <>
                        {state.order.data.tradeType !==
                        PrimaryTradeType.REDEMPTION ? (
                          <Button
                            size="small"
                            label={intl.formatMessage(
                              SubscriptionTexts.confirmReceiptOfPayment,
                            )}
                            onClick={() => {
                              dispatch(
                                setAppModal(
                                  appModalData({
                                    title: intl.formatMessage(
                                      SubscriptionTexts.confirmReceiptOfPayment,
                                    ),
                                    confirmAction: () =>
                                      executeOrder(
                                        state.order as IWorkflowInstance,
                                      ),
                                    confirmLabel: intl.formatMessage(
                                      SubscriptionTexts.confirmReceiptOfPayment,
                                    ),
                                    confirmColor: colors.main,
                                    content: (
                                      <div style={{ width: 520 }}>
                                        <p>
                                          {intl.formatMessage(
                                            SubscriptionTexts.confirmPaymentOrder,
                                          )}
                                        </p>
                                      </div>
                                    ),
                                  }),
                                ),
                              );
                            }}
                          />
                        ) : (
                          <Button
                            size="big"
                            label={intl.formatMessage(
                              CommonTexts.completePayment,
                            )}
                            href={CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST_PAYMENT.pathBuilder(
                              {
                                orderId: `${state.order.id}`,
                              },
                            )}
                          />
                        )}
                      </>
                    )}
                    {assetType === AssetType.SYNDICATED_LOAN && (
                      <Button
                        size="small"
                        label={intl.formatMessage(
                          SubscriptionTexts.confirmConditionsPrecedent,
                        )}
                        onClick={() => {
                          dispatch(
                            setAppModal(
                              appModalData({
                                title: intl.formatMessage(
                                  SubscriptionTexts.confirmConditionsPrecedent,
                                ),
                                confirmAction: () =>
                                  issueTokens(state.order as IWorkflowInstance),
                                confirmLabel: intl.formatMessage(
                                  SubscriptionTexts.confirmConditionsPrecedent,
                                ),
                                confirmColor: colors.main,
                                content: (
                                  <div style={{ width: 520 }}>
                                    <p>
                                      {intl.formatMessage(
                                        SubscriptionTexts.confirmConditionsPrecedentMet,
                                      )}
                                      <br />
                                      {intl.formatMessage(
                                        SubscriptionTexts.canTakeUpTo5Minutes,
                                      )}
                                    </p>
                                  </div>
                                ),
                              }),
                            ),
                          );
                        }}
                      />
                    )}
                    {canCreateOrder && (
                      <Button
                        size="small"
                        label={intl.formatMessage(CommonTexts.reject)}
                        color={colors.errorDark}
                        tertiary
                        iconLeft={mdiCancel}
                        style={{ marginLeft: '10px' }}
                        onClick={() => {
                          dispatch(
                            setAppModal(
                              appModalData({
                                title: intl.formatMessage(CommonTexts.reject),
                                confirmAction: async ({ comment }) => {
                                  try {
                                    setState((s) => ({
                                      ...s,
                                      isLoading: true,
                                    }));
                                    const { order: newOrder } = await DataCall({
                                      method:
                                        API_REJECT_PRIMARY_TRADE_ORDER.method,
                                      path: API_REJECT_PRIMARY_TRADE_ORDER.path(),
                                      body: {
                                        orderId: state.order?.id,
                                        comment: comment.value,
                                        sendNotification: true,
                                      },
                                    });
                                    setState((s) => ({
                                      ...s,
                                      isLoading: false,
                                      order: newOrder,
                                    }));
                                  } catch (error) {
                                    setState((s) => ({
                                      ...s,
                                      isLoading: false,
                                      hasLoadingError: true,
                                    }));

                                    EventEmitter.dispatch(
                                      Events.EVENT_APP_MESSAGE,
                                      appMessageData({
                                        message: intl.formatMessage(
                                          SubscriptionTexts.rejectOrderError,
                                        ),
                                        secondaryMessage: String(error),
                                        icon: mdiAlertOctagon,
                                        color: colors.error,
                                        isDark: true,
                                      }),
                                    );
                                  }
                                },
                                confirmLabel: intl.formatMessage(
                                  CommonTexts.reject,
                                ),
                                confirmColor: colors.errorDark,
                                content: (
                                  <div style={{ maxHeight: 200, width: 500 }}>
                                    <p style={{ marginBottom: '20px' }}>
                                      {assetType === AssetType.SYNDICATED_LOAN
                                        ? intl.formatMessage(
                                            SubscriptionTexts.areSureRejectConditionsPrecedent,
                                          )
                                        : intl.formatMessage(
                                            SubscriptionTexts.areSureRejectOrder,
                                          )}
                                    </p>

                                    <Input
                                      type="textarea"
                                      label={intl.formatMessage(
                                        SubscriptionTexts.reasonForRejecting,
                                      )}
                                      name="comment"
                                      required
                                      placeholder={intl.formatMessage(
                                        CommonTexts.startTyping,
                                      )}
                                      sublabel={intl.formatMessage(
                                        CommonTexts.beDescriptive,
                                      )}
                                    />
                                  </div>
                                ),
                              }),
                            ),
                          );
                        }}
                      />
                    )}
                  </>
                )}
              {hasRole(user, [UserType.ISSUER]) &&
                state.order.state === 'paid' &&
                getNextTransactionStatus(state.order.data) !== 'pending' &&
                !isSecondary && (
                  <Button
                    size="small"
                    label={
                      state.order.data.tradeType === PrimaryTradeType.REDEMPTION
                        ? intl.formatMessage(CommonTexts.settleOrder)
                        : intl.formatMessage(CommonTexts.issueShares)
                    }
                    disabled={!canSettleOrder}
                    onClick={() => {
                      dispatch(
                        setAppModal(
                          appModalData({
                            title:
                              state.order?.data.tradeType ===
                              PrimaryTradeType.REDEMPTION
                                ? intl.formatMessage(CommonTexts.settleOrder)
                                : intl.formatMessage(CommonTexts.issueShares),
                            confirmAction: async () => {
                              try {
                                setState((s) => ({ ...s, isLoading: true }));
                                const { order: newOrder } = await DataCall({
                                  method: API_SETTLE_PRIMARY_ORDER.method,
                                  path: API_SETTLE_PRIMARY_ORDER.path(),
                                  body: {
                                    orderId: state.order?.id,
                                    sendNotification: true,
                                  },
                                });
                                checkPendingStatus(newOrder);
                                setState((s) => ({
                                  ...s,
                                  isLoading: false,
                                  order: newOrder,
                                }));
                              } catch (error) {
                                setState((s) => ({
                                  ...s,
                                  isLoading: false,
                                  hasLoadingError: false,
                                }));
                                EventEmitter.dispatch(
                                  Events.EVENT_APP_MESSAGE,
                                  appMessageData({
                                    message: intl.formatMessage(
                                      SubscriptionTexts.rejectOrderError,
                                    ),
                                    secondaryMessage: String(error),
                                    icon: mdiAlertOctagon,
                                    color: colors.error,
                                    isDark: true,
                                  }),
                                );
                              }
                            },
                            confirmLabel:
                              state.order?.data.tradeType ===
                              PrimaryTradeType.REDEMPTION
                                ? intl.formatMessage(CommonTexts.settleOrder)
                                : intl.formatMessage(CommonTexts.issueShares),
                            confirmColor: colors.errorDark,
                            content: (
                              <div style={{ width: 500 }}>
                                <p>
                                  {state.order?.data.tradeType ===
                                  PrimaryTradeType.REDEMPTION
                                    ? intl.formatMessage(
                                        SubscriptionTexts.areYouSureSettleOrder,
                                      )
                                    : intl.formatMessage(
                                        SubscriptionTexts.areYouSureIssueShares,
                                      )}
                                </p>
                              </div>
                            ),
                          }),
                        ),
                      );
                    }}
                  />
                )}
            </>
          )}
          {/* TRADE ORDER ACTIONS */}
          {isTradeOrder(state.order.name) && (
            <>
              {/* APPROVAL/CANCELLING */}
              {state.order.state === 'submitted' && (
                <>
                  {/* ISSUER'S approval is required */}
                  {hasRole(user, [UserType.ISSUER]) &&
                    !bypassSecondaryTradeIssuerApproval && (
                      <>
                        <Button
                          size="small"
                          label={
                            assetType === AssetType.SYNDICATED_LOAN
                              ? intl.formatMessage(
                                  state.order.data.tradeOrderType === 'Novation'
                                    ? SubscriptionTexts.approveNovation
                                    : state.order.data.tradeOrderType ===
                                      'Repayment'
                                    ? SubscriptionTexts.approveRepayment
                                    : SubscriptionTexts.approveDrawdown,
                                )
                              : intl.formatMessage(
                                  SubscriptionTexts.approveOrder,
                                )
                          }
                          onClick={() => {
                            if (assetType === AssetType.SYNDICATED_LOAN) {
                              dispatch(
                                setAppModal(
                                  appModalData({
                                    title: intl.formatMessage(
                                      state.order?.data.tradeOrderType ===
                                        'Novation'
                                        ? SubscriptionTexts.approveNovation
                                        : state.order?.data.tradeOrderType ===
                                          'Repayment'
                                        ? SubscriptionTexts.approveRepayment
                                        : SubscriptionTexts.approveDrawdown,
                                    ),
                                    confirmAction: () =>
                                      approveTradeOrder(
                                        state.order as IWorkflowInstance,
                                      ),
                                    confirmLabel: intl.formatMessage(
                                      state.order?.data.tradeOrderType ===
                                        'Novation'
                                        ? SubscriptionTexts.approveNovation
                                        : state.order?.data.tradeOrderType ===
                                          'Repayment'
                                        ? SubscriptionTexts.approveRepayment
                                        : SubscriptionTexts.approveDrawdown,
                                    ),
                                    confirmColor: colors.main,
                                    content: (
                                      <div style={{ width: 520 }}>
                                        <p>
                                          {intl.formatMessage(
                                            state.order?.data.tradeOrderType ===
                                              'Novation'
                                              ? SubscriptionTexts.sureApproveNovation
                                              : state.order?.data
                                                  .tradeOrderType ===
                                                'Repayment'
                                              ? SubscriptionTexts.sureApproveRepayment
                                              : SubscriptionTexts.sureApproveDrawdown,
                                          )}
                                        </p>
                                      </div>
                                    ),
                                  }),
                                ),
                              );
                            } else {
                              dispatch(
                                setAppModal(
                                  appModalData({
                                    title: intl.formatMessage(
                                      SubscriptionTexts.approveOrder,
                                    ),
                                    confirmColor: colors.main,
                                    noPadding: true,
                                    content: (
                                      <ApproveTradeOrderModal
                                        order={state.order as IWorkflowInstance}
                                        token={state.token as IToken}
                                        user={user}
                                        callback={loadData}
                                      />
                                    ),
                                  }),
                                ),
                              );
                            }
                          }}
                        />

                        <Button
                          size="small"
                          label={intl.formatMessage(CommonTexts.reject)}
                          color={colors.errorDark}
                          tertiary
                          iconLeft={mdiCancel}
                          style={{ marginLeft: '10px' }}
                          onClick={() => {
                            dispatch(
                              setAppModal(
                                appModalData({
                                  title: intl.formatMessage(CommonTexts.reject),
                                  confirmAction: ({ comment }) =>
                                    rejectTradeOrder(
                                      state.order as IWorkflowInstance,
                                      comment.value,
                                    ),
                                  confirmLabel: intl.formatMessage(
                                    CommonTexts.reject,
                                  ),
                                  confirmColor: colors.errorDark,
                                  content: (
                                    <div style={{ maxHeight: 200, width: 500 }}>
                                      <p style={{ marginBottom: '20px' }}>
                                        {intl.formatMessage(
                                          assetType ===
                                            AssetType.SYNDICATED_LOAN
                                            ? state.order?.data
                                                .tradeOrderType === 'Novation'
                                              ? SubscriptionTexts.sureRejectNovation
                                              : state.order?.data
                                                  .tradeOrderType ===
                                                'Repayment'
                                              ? SubscriptionTexts.sureRejectRepayment
                                              : SubscriptionTexts.sureRejectDrawdown
                                            : SubscriptionTexts.areSureRejectOrder,
                                        )}
                                      </p>

                                      <Input
                                        type="textarea"
                                        label={intl.formatMessage(
                                          CommonTexts.reason,
                                        )}
                                        style={{ color: '#CC5252' }}
                                        name="comment"
                                        required
                                      />
                                    </div>
                                  ),
                                }),
                              ),
                            );
                          }}
                        />
                      </>
                    )}
                </>
              )}

              {/* ACCEPTANCE/REJECTION */}
              {/* SELL order */}
              {state.order.orderSide === OrderSide.BUY ? (
                <>
                  {state.order.recipientId === user.id &&
                    state.order.state === 'outstanding' && (
                      <Button
                        size="big"
                        label={intl.formatMessage(CommonTexts.completePayment)}
                        href={CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST_PAYMENT.pathBuilder(
                          {
                            assetId: state.token.id,
                            orderId: `${state.order.id}`,
                            classKey: state.selectedShareClass.key,
                          },
                        )}
                      />
                    )}
                  {state.order.metadata?.user?.id === user.id &&
                    ((state.order.state === 'approved' &&
                      !bypassSecondaryTradeIssuerApproval) ||
                      (state.order.state === 'submitted' &&
                        bypassSecondaryTradeIssuerApproval)) && (
                      <>
                        <Button
                          size="small"
                          label={
                            assetType === AssetType.SYNDICATED_LOAN
                              ? intl.formatMessage(
                                  SubscriptionTexts.acceptRepayment,
                                )
                              : intl.formatMessage(CommonTexts.acceptOrder)
                          }
                          onClick={() => {
                            dispatch(
                              setAppModal(
                                appModalData({
                                  title:
                                    assetType === AssetType.SYNDICATED_LOAN
                                      ? intl.formatMessage(
                                          SubscriptionTexts.acceptRepayment,
                                        )
                                      : intl.formatMessage(
                                          CommonTexts.acceptOrder,
                                        ),
                                  confirmAction: () =>
                                    acceptTradeOrder(
                                      state.order as IWorkflowInstance,
                                    ),
                                  confirmLabel:
                                    assetType === AssetType.SYNDICATED_LOAN
                                      ? intl.formatMessage(
                                          SubscriptionTexts.acceptRepayment,
                                        )
                                      : intl.formatMessage(
                                          CommonTexts.acceptOrder,
                                        ),
                                  confirmColor: colors.main,
                                  content: (
                                    <div style={{ width: 520 }}>
                                      <p>
                                        {assetType === AssetType.SYNDICATED_LOAN
                                          ? intl.formatMessage(
                                              SubscriptionTexts.sureToAcceptRepayment,
                                            )
                                          : intl.formatMessage(
                                              SubscriptionTexts.sureToAcceptOrder,
                                            )}
                                      </p>
                                    </div>
                                  ),
                                }),
                              ),
                            );
                          }}
                        />

                        <Button
                          size="small"
                          label={intl.formatMessage(CommonTexts.reject)}
                          color={colors.errorDark}
                          tertiary
                          iconLeft={mdiCancel}
                          style={{ marginLeft: '10px' }}
                          onClick={() => {
                            dispatch(
                              setAppModal(
                                appModalData({
                                  title: intl.formatMessage(CommonTexts.reject),
                                  confirmAction: ({ comment }) =>
                                    rejectTradeOrder(
                                      state.order as IWorkflowInstance,
                                      comment.value,
                                    ),
                                  confirmLabel: intl.formatMessage(
                                    CommonTexts.reject,
                                  ),
                                  confirmColor: colors.errorDark,
                                  content: (
                                    <div style={{ maxHeight: 200, width: 500 }}>
                                      <p style={{ marginBottom: '20px' }}>
                                        {intl.formatMessage(
                                          assetType ===
                                            AssetType.SYNDICATED_LOAN
                                            ? SubscriptionTexts.sureRejectRepayment
                                            : SubscriptionTexts.areSureRejectOrderRequest,
                                        )}
                                      </p>

                                      <Input
                                        type="textarea"
                                        label={intl.formatMessage(
                                          CommonTexts.reason,
                                        )}
                                        style={{ color: '#CC5252' }}
                                        name="comment"
                                        required
                                      />
                                    </div>
                                  ),
                                }),
                              ),
                            );
                          }}
                        />
                      </>
                    )}
                </>
              ) : (
                <>
                  {/* ACCEPTANCE/REJECTION */}
                  {/* BUY order */}
                  {(state.order.recipientId === user.id ||
                    state.order.data.dvp?.recipient?.id === user.id) &&
                    ((state.order.state === 'approved' &&
                      !bypassSecondaryTradeIssuerApproval) ||
                      (state.order.state === 'submitted' &&
                        bypassSecondaryTradeIssuerApproval)) && (
                      <>
                        <Button
                          size="small"
                          label={
                            assetType === AssetType.SYNDICATED_LOAN
                              ? intl.formatMessage(
                                  state.order.data.tradeOrderType === 'Novation'
                                    ? SubscriptionTexts.acceptNovation
                                    : CommonTexts.acceptDrawdown,
                                )
                              : intl.formatMessage(CommonTexts.acceptOrder)
                          }
                          onClick={() => {
                            dispatch(
                              setAppModal(
                                appModalData({
                                  title:
                                    assetType === AssetType.SYNDICATED_LOAN
                                      ? intl.formatMessage(
                                          state.order?.data.tradeOrderType ===
                                            'Novation'
                                            ? SubscriptionTexts.acceptNovation
                                            : CommonTexts.acceptDrawdown,
                                        )
                                      : intl.formatMessage(
                                          CommonTexts.acceptOrder,
                                        ),
                                  confirmAction: () =>
                                    acceptTradeOrder(
                                      state.order as IWorkflowInstance,
                                    ),
                                  confirmLabel:
                                    assetType === AssetType.SYNDICATED_LOAN
                                      ? intl.formatMessage(
                                          state.order?.data.tradeOrderType ===
                                            'Novation'
                                            ? SubscriptionTexts.acceptNovation
                                            : CommonTexts.acceptDrawdown,
                                        )
                                      : intl.formatMessage(
                                          CommonTexts.acceptOrder,
                                        ),
                                  confirmColor: colors.main,
                                  content: (
                                    <div style={{ width: 520 }}>
                                      <p>
                                        {assetType === AssetType.SYNDICATED_LOAN
                                          ? intl.formatMessage(
                                              state.order?.data
                                                .tradeOrderType === 'Novation'
                                                ? SubscriptionTexts.sureToAcceptNovation
                                                : SubscriptionTexts.sureToAcceptDrawdown,
                                            )
                                          : intl.formatMessage(
                                              SubscriptionTexts.sureToAcceptOrder,
                                            )}
                                      </p>
                                    </div>
                                  ),
                                }),
                              ),
                            );
                          }}
                        />

                        <Button
                          size="small"
                          label={intl.formatMessage(CommonTexts.reject)}
                          color={colors.errorDark}
                          tertiary
                          iconLeft={mdiCancel}
                          style={{ marginLeft: '10px' }}
                          onClick={() => {
                            dispatch(
                              setAppModal(
                                appModalData({
                                  title: intl.formatMessage(CommonTexts.reject),
                                  confirmAction: ({ comment }) =>
                                    rejectTradeOrder(
                                      state.order as IWorkflowInstance,
                                      comment.value,
                                    ),
                                  confirmLabel: intl.formatMessage(
                                    CommonTexts.reject,
                                  ),
                                  confirmColor: colors.errorDark,
                                  content: (
                                    <div style={{ maxHeight: 200, width: 500 }}>
                                      <p style={{ marginBottom: '20px' }}>
                                        {intl.formatMessage(
                                          assetType ===
                                            AssetType.SYNDICATED_LOAN
                                            ? state.order?.data
                                                .tradeOrderType === 'Novation'
                                              ? SubscriptionTexts.sureRejectNovation
                                              : SubscriptionTexts.sureRejectDrawdown
                                            : SubscriptionTexts.areSureRejectOrderRequest,
                                        )}
                                      </p>

                                      <Input
                                        type="textarea"
                                        label={intl.formatMessage(
                                          CommonTexts.reason,
                                        )}
                                        style={{ color: '#CC5252' }}
                                        name="comment"
                                        required
                                      />
                                    </div>
                                  ),
                                }),
                              ),
                            );
                          }}
                        />
                      </>
                    )}
                </>
              )}

              {/* REQUEST/REJECT PAYMENT */}
              {hasRole(user, [UserType.ISSUER]) &&
                state.order.state === 'accepted' &&
                getNextTransactionStatus(state.order.data) !== 'pending' && (
                  <>
                    <Button
                      size="small"
                      label={
                        assetType === AssetType.SYNDICATED_LOAN
                          ? intl.formatMessage(CommonTexts.requestPayment)
                          : intl.formatMessage(CommonTexts.createHold)
                      }
                      onClick={() => {
                        dispatch(
                          setAppModal(
                            appModalData({
                              title:
                                assetType === AssetType.SYNDICATED_LOAN
                                  ? intl.formatMessage(
                                      CommonTexts.requestPayment,
                                    )
                                  : intl.formatMessage(CommonTexts.createHold),
                              confirmAction: ({ timeToExpiration }) =>
                                requestTradeOrderPayment(
                                  state.order as IWorkflowInstance,
                                  timeToExpiration?.value,
                                ),
                              confirmLabel:
                                assetType === AssetType.SYNDICATED_LOAN
                                  ? intl.formatMessage(
                                      CommonTexts.requestPayment,
                                    )
                                  : intl.formatMessage(CommonTexts.createHold),
                              confirmColor: colors.main,
                              content: (
                                <div style={{ width: 520 }}>
                                  {assetType === AssetType.SYNDICATED_LOAN ? (
                                    <p>
                                      {intl.formatMessage(
                                        state.order?.data.tradeOrderType ===
                                          'Novation'
                                          ? SubscriptionTexts.areYouSureToRequestPaymentFromLender
                                          : state.order?.data.tradeOrderType ===
                                            'Repayment'
                                          ? SubscriptionTexts.areYouSureToRequestPaymentFromBorrower
                                          : SubscriptionTexts.areYouSureToRequestPayment,
                                      )}
                                    </p>
                                  ) : (
                                    <>
                                      <p>
                                        {intl.formatMessage(
                                          SubscriptionTexts.requestPaymentMsg1,
                                        )}
                                      </p>
                                      <h2>
                                        {intl.formatMessage(
                                          SubscriptionTexts.holdExpiry,
                                        )}
                                      </h2>
                                      <p>
                                        {intl.formatMessage(
                                          SubscriptionTexts.requestPaymentMsg2,
                                        )}
                                      </p>
                                      <Select
                                        name="timeToExpiration"
                                        defaultValue={7 * 24 * 3600}
                                        options={[
                                          {
                                            label: intl.formatMessage(
                                              CommonTexts.oneDay,
                                            ),
                                            value: `${24 * 3600}`,
                                          },
                                          {
                                            label: intl.formatMessage(
                                              CommonTexts.sevenDays,
                                            ),
                                            value: `${7 * 24 * 3600}`,
                                          },
                                          {
                                            label: intl.formatMessage(
                                              CommonTexts.fourteenDays,
                                            ),
                                            value: `${14 * 24 * 3600}`,
                                          },
                                        ]}
                                      />
                                    </>
                                  )}
                                </div>
                              ),
                            }),
                          ),
                        );
                      }}
                    />

                    <Button
                      size="small"
                      label={intl.formatMessage(CommonTexts.reject)}
                      color={colors.errorDark}
                      tertiary
                      iconLeft={mdiCancel}
                      style={{ marginLeft: '10px' }}
                      onClick={() => {
                        dispatch(
                          setAppModal(
                            appModalData({
                              title: intl.formatMessage(CommonTexts.reject),
                              confirmAction: ({ comment }) =>
                                rejectTradeOrder(
                                  state.order as IWorkflowInstance,
                                  comment.value,
                                ),
                              confirmLabel: intl.formatMessage(
                                CommonTexts.reject,
                              ),
                              confirmColor: colors.errorDark,
                              content: (
                                <div style={{ maxHeight: 200, width: 500 }}>
                                  <p style={{ marginBottom: '20px' }}>
                                    {assetType === AssetType.SYNDICATED_LOAN
                                      ? state.order?.data.tradeOrderType ===
                                        'Novation'
                                        ? SubscriptionTexts.sureRejectNovation
                                        : SubscriptionTexts.sureRejectDrawdown
                                      : SubscriptionTexts.areSureRejectOrderRequest}
                                  </p>

                                  <Input
                                    type="textarea"
                                    label={intl.formatMessage(
                                      CommonTexts.reason,
                                    )}
                                    style={{ color: '#CC5252' }}
                                    name="comment"
                                    required
                                  />
                                </div>
                              ),
                            }),
                          ),
                        );
                      }}
                    />
                  </>
                )}

              {/* COMPLETE PAYMENT */}
              {state.order.recipientId === user.id &&
                assetType === AssetType.SYNDICATED_LOAN &&
                state.order.state === 'outstanding' && (
                  <Button
                    size="big"
                    label={intl.formatMessage(CommonTexts.completePayment)}
                    href={CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT.pathBuilder(
                      {
                        orderId: `${state.order.id}`,
                      },
                    )}
                  />
                )}

              {/* CONFIRM PAYMENT */}
              {state.order.userId === user.id &&
                state.order.state === 'paying' && (
                  <Button
                    size="big"
                    label={intl.formatMessage(
                      SubscriptionTexts.confirmReceiptOfPayment,
                    )}
                    onClick={() => {
                      dispatch(
                        setAppModal(
                          appModalData({
                            title: intl.formatMessage(
                              SubscriptionTexts.confirmReceiptOfPayment,
                            ),
                            confirmAction: () =>
                              confirmTradeOrderPayment(
                                state.order as IWorkflowInstance,
                              ),
                            confirmLabel: intl.formatMessage(
                              CommonTexts.confirmPayment,
                            ),
                            confirmColor: colors.main,
                            content: (
                              <div style={{ width: 520 }}>
                                <p>
                                  {intl.formatMessage(
                                    SubscriptionTexts.confirmPaymentOrder,
                                  )}
                                </p>
                                <h2>
                                  {intl.formatMessage(
                                    CommonTexts.whatHappensNext,
                                  )}
                                </h2>
                                <p>
                                  {intl.formatMessage(
                                    SubscriptionTexts.oncePaymentConfirmedMsg,
                                  )}
                                </p>
                              </div>
                            ),
                          }),
                        ),
                      );
                    }}
                  />
                )}

              {/* SETTLE */}
              {hasRole(user, [UserType.ISSUER]) &&
                state.order.state === 'paid' &&
                getNextTransactionStatus(state.order.data) !== 'pending' && (
                  <Button
                    size="big"
                    label={
                      assetType === AssetType.SYNDICATED_LOAN
                        ? intl.formatMessage(
                            state.order.data.tradeOrderType === 'Novation'
                              ? SubscriptionTexts.completeNovation
                              : state.order.data.tradeOrderType === 'Repayment'
                              ? SubscriptionTexts.completeRepayment
                              : CommonTexts.completeDrawdown,
                          )
                        : intl.formatMessage(CommonTexts.settleOrder)
                    }
                    onClick={() => {
                      dispatch(
                        setAppModal(
                          appModalData({
                            title:
                              assetType === AssetType.SYNDICATED_LOAN
                                ? intl.formatMessage(
                                    state.order?.data.tradeOrderType ===
                                      'Novation'
                                      ? SubscriptionTexts.completeNovation
                                      : state.order?.data.tradeOrderType ===
                                        'Repayment'
                                      ? SubscriptionTexts.completeRepayment
                                      : CommonTexts.completeDrawdown,
                                  )
                                : intl.formatMessage(CommonTexts.settleOrder),
                            confirmAction: () =>
                              settleTradeOrder(
                                state.order as IWorkflowInstance,
                              ),
                            confirmLabel:
                              assetType === AssetType.SYNDICATED_LOAN
                                ? intl.formatMessage(
                                    state.order?.data.tradeOrderType ===
                                      'Novation'
                                      ? SubscriptionTexts.completeNovation
                                      : state.order?.data.tradeOrderType ===
                                        'Repayment'
                                      ? SubscriptionTexts.completeRepayment
                                      : CommonTexts.completeDrawdown,
                                  )
                                : intl.formatMessage(CommonTexts.settleOrder),
                            confirmColor: colors.main,
                            content: (
                              <div style={{ width: 520 }}>
                                <p>
                                  {assetType === AssetType.SYNDICATED_LOAN
                                    ? intl.formatMessage(
                                        state.order?.data.tradeOrderType ===
                                          'Novation'
                                          ? SubscriptionTexts.settleConfirmNovationDesc
                                          : state.order?.data.tradeOrderType ===
                                            'Repayment'
                                          ? SubscriptionTexts.settleConfirmRepaymentDesc
                                          : SubscriptionTexts.settleConfirmDrawdown,
                                      )
                                    : intl.formatMessage(
                                        SubscriptionTexts.settleConfirmOrder,
                                      )}
                                </p>
                              </div>
                            ),
                          }),
                        ),
                      );
                    }}
                  />
                )}
            </>
          )}
        </div>
      </PageTitle>

      <main>
        <SubscriptionSummary
          order={state.order}
          token={state.token}
          shareClass={state.selectedShareClass}
          assetHref={
            hasRole(user, [UserType.INVESTOR, UserType.UNDERWRITER])
              ? CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
                  assetId: state.order.entityId,
                })
              : CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({
                  assetId: state.order.entityId,
                })
          }
          currentTotal={currentTotal}
          wireTransferConfirmation={state.order.data.wireTransferConfirmation}
          assetType={assetType}
          isIssuerSide={true}
          investorName={getUserMetadata(state.order).name}
          investorFee={state.investorFee}
        />

        {hasRole(user, [UserType.INVESTOR]) &&
          canCancelOrder &&
          state.order.state === 'subscribed' && (
            <div style={{ marginTop: '8px', marginBottom: 0 }}>
              <Button
                size="small"
                label={intl.formatMessage(CommonTexts.cancelOrder)}
                color={colors.errorDark}
                iconLeft={mdiCancel}
                onClick={async () => {
                  dispatch(
                    setAppModal(
                      appModalData({
                        title: intl.formatMessage(CommonTexts.cancelOrder),
                        confirmAction: async ({ comment }) => {
                          try {
                            setState((s) => ({ ...s, isLoading: true }));
                            const { order: newOrder } = await DataCall({
                              method: API_CANCEL_PRIMARY_TRADE_ORDER.method,
                              path: API_CANCEL_PRIMARY_TRADE_ORDER.path(),
                              body: {
                                orderId: state.order?.id,
                                comment: comment.value,
                                sendNotification: true,
                              },
                            });
                            setState((s) => ({
                              ...s,
                              isLoading: false,
                              order: newOrder,
                            }));
                          } catch (error) {
                            setState((s) => ({
                              ...s,
                              isLoading: false,
                              hasLoadingError: true,
                            }));
                            EventEmitter.dispatch(
                              Events.EVENT_APP_MESSAGE,
                              appMessageData({
                                message: intl.formatMessage(
                                  SubscriptionTexts.rejectOrderError,
                                ),
                                secondaryMessage: String(error),
                                icon: mdiAlertOctagon,
                                color: colors.error,
                                isDark: true,
                              }),
                            );
                          }
                        },
                        confirmLabel: intl.formatMessage(
                          CommonTexts.cancelTheOrder,
                        ),
                        confirmColor: colors.errorDark,
                        content: (
                          <div style={{ maxWidth: 600, maxHeight: 220 }}>
                            <p style={{ marginBottom: '20px' }}>
                              {intl.formatMessage(
                                SubscriptionTexts.sureToCancelOrder,
                              )}
                            </p>

                            <Input
                              type="textarea"
                              label={intl.formatMessage(
                                CommonTexts.reasonForCancelation,
                              )}
                              required
                              name="comment"
                              placeholder={intl.formatMessage(
                                CommonTexts.startTyping,
                              )}
                              sublabel={intl.formatMessage(
                                CommonTexts.beDescriptive,
                              )}
                            />
                          </div>
                        ),
                      }),
                    ),
                  );
                }}
              />
            </div>
          )}
      </main>
    </div>
  );
};

export default injectIntl(SubscriptionOrderOverview);
