import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import { mdiAlertOctagon } from '@mdi/js';
import { useParams } from 'react-router-dom';

import { CLIENT_ROUTE_INVESTMENT_PRODUCT } from 'routesList';
import { colors } from 'constants/styles';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import {
  OrderSplitScreenSideBar,
  OrderSplitScreenLayout,
  OrderSplitScreenMainContent,
} from 'uiComponents/OrderSplitScreenLayout/';
import {
  OrderType,
  IToken,
  AssetType,
  IWorkflowInstance,
  PrimaryTradeType,
  IDocument,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { IUser } from 'User';
import { DataCall } from 'utils/dataLayer';
import {
  API_ASSET_ALL_GET,
  API_CREATE_PRIMARY_TRADE_ORDER,
  API_RETRIEVE_ASSET_BY_ID,
  API_RETRIEVE_FEE,
} from 'constants/apiRoutes';
import {
  getTokenShareClassCurrentNav,
  getProductFromToken,
  getAssetWalletInfoFromAssetData,
  getTokenShareClassName,
  getTokenShareClassKey,
} from 'utils/commonUtils';
import SubscriptionSummary from 'routes/Investor/SubscriptionSummary';
import SubscriptionOrderHeader from './components/SubscriptionOrderHeader';
import { SubscriptionPayment } from './components/SubscriptionPayment';
import { SubscriptionDocusign } from './components/SubscriptionDocusign';
import { SubscriptionDetails } from './components/SubscriptionDetails';
import { SubscriptionConfirmation } from './components/SubscriptionConfirmation';
import { useIntl } from 'react-intl';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { CommonTexts } from 'texts/commun/commonTexts';
import {
  ClassData,
  combineDateAndTime,
  Docusign,
} from 'routes/Issuer/AssetIssuance/assetTypes';
import Select from 'uiComponents/Select';
import { userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

export type Steps = 'details' | 'confirmation' | 'payment' | 'docusign';

interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  token?: IToken;
  selectedShareClass?: ClassData;
  cutOffDate?: number;
  currentTotal: number;
  wireTransferConfirmation?: IDocument;
  currentStep: Steps;
  isPassingOrder: boolean;
  order?: IWorkflowInstance;
  investorFee?: number;
}

export const SubscriptionOrder = () => {
  const intl = useIntl();
  const { assetId, classKey } = useParams<{
    assetId: string;
    classKey: string;
  }>();
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    currentTotal: 0,
    currentStep: 'details',
    isPassingOrder: false,
  });
  const investor = useSelector(userSelector) as IUser;

  const [tokens, setTokens] = useState<IToken[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState(assetId);

  useEffect(() => {
    if (selectedTokenId) loadData();
    // eslint-disable-next-line
  }, [selectedTokenId]);

  useEffect(() => {
    if (!assetId) loadTokens();
  }, [assetId]);

  const loadTokens = async () => {
    try {
      const { tokens }: { tokens: Array<IToken> } = await DataCall({
        method: API_ASSET_ALL_GET.method,
        path: API_ASSET_ALL_GET.path(),
        urlParams: {
          offset: 0,
          limit: 10,
          withBalances: true,
          withCycles: true,
        },
      });

      const filteredTokens = tokens.filter((token) => {
        const { assetType, shareClasses } = getProductFromToken(token);
        const hasRedemption =
          shareClasses?.[0]?.initialRedemption ||
          assetType === AssetType.CURRENCY;
        return assetType !== AssetType.SYNDICATED_LOAN && hasRedemption;
      });

      setTokens(filteredTokens);
      if (tokens.length > 0) setSelectedTokenId(tokens[0].id);
    } catch (error) {}
  };

  const loadData = async () => {
    try {
      setState((s) => ({
        ...s,
        isLoading: true,
      }));
      let token: IToken;
      if (assetId) {
        const { token: loadedToken } = await DataCall({
          method: API_RETRIEVE_ASSET_BY_ID.method,
          path: API_RETRIEVE_ASSET_BY_ID.path(selectedTokenId),
          urlParams: {
            withBalances: false,
            withCycles: true,
            withAssetData: true,
          },
        });
        token = loadedToken;
      } else {
        token = tokens.find((t) => t.id === selectedTokenId) as IToken;
      }
      const { assetType, shareClasses } = getProductFromToken(token);
      const selectedShareClass = shareClasses.find(
        (shareClass) =>
          shareClass.key === (token.assetData?.class[0].key as string),
      ) as ClassData;

      const { fees } = await DataCall({
        method: API_RETRIEVE_FEE.method,
        path: API_RETRIEVE_FEE.path(token.id),
        urlParams: {
          assetClass: selectedShareClass.key,
          investorId: investor.id,
        },
      });
      const investorFee = fees?.acquiredEntryFees;

      const orderRules = selectedShareClass.rules;

      const initialSubscription = selectedShareClass.initialSubscription;

      let cutoffDate: Date | undefined;
      if (initialSubscription) {
        cutoffDate = combineDateAndTime(
          initialSubscription.cutoffDate,
          initialSubscription.cutoffHour,
        );
      }

      const currentTotal =
        assetType === AssetType.FIXED_RATE_BOND
          ? orderRules?.minSubscriptionAmount || 0
          : orderRules?.subscriptionType === OrderType.QUANTITY ||
            assetType === AssetType.CURRENCY
          ? orderRules?.minSubscriptionQuantity || 0
          : orderRules?.minSubscriptionAmount || 0;

      setState((s) => ({
        ...s,
        token,
        selectedShareClass,
        isLoading: false,
        investorFee,
        currentTotal,
        cutOffDate: cutoffDate ? cutoffDate.getTime() : undefined,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        hasLoadingError: true,
      }));
    }
  };

  const placeOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();

      const {
        currentTotal,
        selectedShareClass,
        token,
        wireTransferConfirmation,
      } = state;

      if (!selectedShareClass || !token) {
        return;
      }

      setState((s) => ({ ...s, isPassingOrder: true }));

      const orderType =
        selectedShareClass.rules?.subscriptionType || OrderType.QUANTITY;
      const currentNav = getTokenShareClassCurrentNav(token);
      const { assetType } = getProductFromToken(token);

      let orderQuantity = 0;
      orderQuantity =
        assetType !== AssetType.FIXED_RATE_BOND &&
        orderType === OrderType.QUANTITY
          ? currentTotal
          : currentNav > 0
          ? currentTotal / currentNav
          : 0;

      let orderAmount;
      if (assetType === AssetType.FIXED_RATE_BOND) orderAmount = currentTotal;
      else {
        orderAmount =
          orderType === OrderType.AMOUNT
            ? currentTotal
            : currentTotal * currentNav;
      }

      const { order } = await DataCall({
        method: API_CREATE_PRIMARY_TRADE_ORDER.method,
        path: API_CREATE_PRIMARY_TRADE_ORDER.path(),
        body: {
          tokenId: assetId ? assetId : token.id,
          orderType,
          tradeType: PrimaryTradeType.SUBSCRIPTION,
          quantity: orderQuantity,
          amount: orderAmount,
          assetClass: classKey ? classKey : getTokenShareClassKey(token),
          data: {
            wireTransferConfirmation,
          },
          sendNotification: true,
        },
      });

      setState((s) => ({
        ...s,
        isPassingOrder: false,
        order,
        currentStep: 'confirmation',
      }));
    } catch (error) {
      setState((s) => ({ ...s, isPassingOrder: false }));
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(SubscriptionTexts.subscriptionOrderError),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
  };

  const {
    token,
    selectedShareClass,
    isLoading,
    hasLoadingError,
    currentTotal,
    currentStep,
    investorFee,
    isPassingOrder,
    wireTransferConfirmation,
    cutOffDate,
    order,
  } = state;
  if (isLoading) {
    return (
      <OrderSplitScreenLayout>
        <PageLoader />
      </OrderSplitScreenLayout>
    );
  }

  if (hasLoadingError || !token || !selectedShareClass) {
    return <PageError />;
  }
  const product = getProductFromToken(token);

  const legalAgreement: Docusign | undefined =
    token && token.assetData?.asset.documents?.docusign;

  return (
    <OrderSplitScreenLayout>
      <OrderSplitScreenMainContent>
        <SubscriptionOrderHeader
          currentStep={currentStep}
          selectedShareClass={selectedShareClass}
          {...product}
          legalAgreement={legalAgreement}
          setCurrentStep={(currentStep) =>
            setState((s) => ({ ...s, currentStep }))
          }
        />

        {currentStep === 'details' && (
          <>
            {!assetId && (
              <Select
                className="field"
                label={intl.formatMessage(CommonTexts.selectAsset)}
                required
                defaultValue={selectedTokenId}
                options={tokens.map((token) => ({
                  label: `${token.name} - ${getTokenShareClassName(token)}`,
                  value: token.id,
                }))}
                onChange={(newValue) => {
                  setSelectedTokenId(newValue);
                }}
              />
            )}
            <SubscriptionDetails
              token={token}
              selectedShareClass={selectedShareClass}
              isLoading={isPassingOrder}
              wireTransferConfirmation={wireTransferConfirmation}
              setCurrentTotal={(currentTotal) =>
                setState((s) => ({ ...s, currentTotal }))
              }
              setIsPassingOrder={(isPassingOrder) =>
                setState((s) => ({ ...s, isPassingOrder }))
              }
              setCurrentStep={(currentStep) =>
                setState((s) => ({ ...s, currentStep }))
              }
              onWireTransferConfirmationChange={(wireTransferConfirmation) =>
                setState((s) => ({
                  ...s,
                  wireTransferConfirmation,
                }))
              }
              onSubmit={placeOrder}
              setOrder={(order: IWorkflowInstance) =>
                setState((s) => ({ ...s, order }))
              }
            />
          </>
        )}

        {currentStep === 'docusign' && (
          <SubscriptionDocusign
            assetId={token.id}
            setCurrentStep={(currentStep) =>
              setState((s) => ({ ...s, currentStep }))
            }
          />
        )}

        {currentStep === 'payment' && (
          <SubscriptionPayment
            token={token}
            selectedShareClass={selectedShareClass}
            onSubmit={placeOrder}
            currentTotal={currentTotal}
            isLoading={isPassingOrder}
            wireTransferConfirmation={wireTransferConfirmation}
            {...getAssetWalletInfoFromAssetData(token)}
            investorFee={investorFee}
            setCurrentStep={(currentStep) =>
              setState((s) => ({ ...s, currentStep }))
            }
            onWireTransferConfirmationChange={(wireTransferConfirmation) =>
              setState((s) => ({ ...s, wireTransferConfirmation }))
            }
          />
        )}

        {currentStep === 'confirmation' && (
          <SubscriptionConfirmation
            token={token}
            selectedShareClass={selectedShareClass}
            cutOffDate={Number(cutOffDate)}
            order={order as IWorkflowInstance}
          />
        )}
      </OrderSplitScreenMainContent>

      <OrderSplitScreenSideBar>
        <SubscriptionSummary
          token={token}
          shareClass={selectedShareClass}
          title={
            product.assetType === AssetType.SYNDICATED_LOAN
              ? intl.formatMessage(CommonTexts.summary)
              : intl.formatMessage(CommonTexts.orderSummary)
          }
          order={state.order}
          currentTotal={currentTotal}
          assetHref={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
            assetId: token.id,
          })}
          wireTransferConfirmation={state.wireTransferConfirmation}
          assetType={product.assetType}
          investorFee={investorFee}
        />
      </OrderSplitScreenSideBar>
    </OrderSplitScreenLayout>
  );
};
