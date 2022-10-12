import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  mdiAlertOctagon,
  mdiArrowLeft,
  mdiCheckCircle,
  mdiChevronRight,
} from '@mdi/js';
import { useIntl } from 'react-intl';

import { colors } from 'constants/styles';
import {
  API_CREATE_PRIMARY_TRADE_ORDER,
  API_ASSET_ALL_GET,
} from 'constants/apiRoutes';
import {
  AssetCycleInstance,
  AssetType,
  IToken,
  IWorkflowInstance,
  OrderType,
  PrimaryTradeType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_INVESTOR_PORTFOLIO,
  CLIENT_ROUTE_ORDER_MANAGEMENT,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
} from 'routesList';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import Button from 'uiComponents/Button';
import Icon from 'uiComponents/Icon';
import Input from 'uiComponents/Input';
import {
  Confirmation,
  ConfirmationActions,
  ConfirmationText,
  Form,
  FormFooter,
  FormHeading,
  FormTopNavigation,
} from 'uiComponents/OrderForm/';
import {
  OrderSplitScreenLayout,
  OrderSplitScreenMainContent,
  OrderSplitScreenSideBar,
} from 'uiComponents/OrderSplitScreenLayout/';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import {
  formatNumber,
  getProductFromToken,
  getTokenShareClassKey,
  getTokenShareClassName,
  getUserTokenBalance,
  parseQuery,
  capitalizeFirstLetter,
  getClientName,
} from 'utils/commonUtils';
import { DataCall } from 'utils/dataLayer';
import { IUser } from 'User';
import { RedeemRequestSummary } from 'routes/Investor/RedeemRequest/components/RedeemRequestSummary';
import Select from 'uiComponents/Select';

import { RedeemRequestTexts } from 'texts/routes/investor/RedeemRequest';
import { CommonTexts } from 'texts/commun/commonTexts';
import { formatLongDate } from 'utils/formatLongDate';
import {
  ClassData,
  combineDateAndTime,
} from 'routes/Issuer/AssetIssuance/assetTypes';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

export const RedeemRequest: React.FC = () => {
  let amountInput: Input;
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [selectedToken, setSelectedToken] = useState<IToken>();
  const [tokens, setTokens] = useState<IToken[]>([]);
  const [shareClass, setShareClass] = useState<ClassData>();
  const [amount, setAmount] = useState(0);
  const [order, setOrder] = useState<IWorkflowInstance>();
  const [cycle, setCycle] = useState<AssetCycleInstance>();
  const [currentStep, setCurrentStep] = useState('details');
  const [assetType, setAssetType] = useState<AssetType>();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [currentNav, setCurrentNav] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const intl = useIntl();
  const dispatch = useDispatch();

  const loadSelectedtokenData = (
    token: IToken | undefined,
    classKey: string,
  ) => {
    if (!token) {
      return;
    }

    setSelectedToken(token);

    const { assetType, shareClasses, nav } = getProductFromToken(token);
    const hasRedemption =
      shareClasses?.[0]?.initialRedemption || assetType === AssetType.CURRENCY;

    if (hasRedemption) {
      const redemptionCycle = (token.cycles || []).filter(
        (c) => c.type === PrimaryTradeType.REDEMPTION,
      );

      setCycle(redemptionCycle?.[0]);
    }

    setCurrentBalance(getUserTokenBalance(token) || 0);

    const selectedShareClass = shareClasses.find((f) => f.key === classKey);

    setShareClass(selectedShareClass);
    setAssetType(assetType);

    setCurrentNav(nav);
  };

  useEffect(
    () => {
      const loadData = async () => {
        try {
          setIsLoading(true);
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

          const { assetId, classKey } = parseQuery(window.location.search);

          if (assetId && classKey) {
            const selectedToken = tokens.find((token) => token.id === assetId);
            loadSelectedtokenData(selectedToken, classKey);
          } else if (tokens.length > 0) {
            loadSelectedtokenData(tokens[0], getTokenShareClassKey(tokens[0]));
          }

          setIsLoading(false);
        } catch (error) {
          console.log(error);
          setIsLoading(false);
          setHasLoadingError(true);
        }
      };
      loadData();
    },
    // eslint-disable-next-line
    [],
  );

  const placeOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();

      if (!shareClass || !selectedToken) {
        return;
      }

      setIsCreatingOrder(true);

      const { order } = await DataCall({
        method: API_CREATE_PRIMARY_TRADE_ORDER.method,
        path: API_CREATE_PRIMARY_TRADE_ORDER.path(),
        body: {
          tokenId: selectedToken.id,
          orderType: OrderType.QUANTITY,
          tradeType: PrimaryTradeType.REDEMPTION,
          quantity: amount,
          assetClass: shareClass.key,
          sendNotification: true,
        },
      });

      setIsCreatingOrder(false);
      setOrder(order);
      setCurrentStep('confirmation');
    } catch (error) {
      setIsCreatingOrder(false);
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(RedeemRequestTexts.redemptionOrderError),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
  };

  function renderDetails() {
    const assetIdentifier =
      assetType === AssetType.PHYSICAL_ASSET ? 'share' : 'token';
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch(
            setAppModal(
              appModalData({
                title: intl.formatMessage(CommonTexts.placeOrder),
                confirmAction: () => placeOrder(e),
                confirmLabel: intl.formatMessage(CommonTexts.placeOrder),
                confirmColor: colors.main,
                content: (
                  <ConfirmationText>
                    {intl.formatMessage(
                      RedeemRequestTexts.redemptionOrderCreationWarning,
                    )}
                  </ConfirmationText>
                ),
              }),
            ),
          );
        }}
      >
        <FormHeading>
          {intl.formatMessage(RedeemRequestTexts.redemptionOrder)}
        </FormHeading>

        <Select
          className="field"
          label={intl.formatMessage(CommonTexts.selectAsset)}
          required
          defaultValue={
            selectedToken && shareClass
              ? `${selectedToken.id}|${shareClass.key}`
              : undefined
          }
          options={tokens.map((token) => ({
            label: `${token.name} - ${getTokenShareClassName(token)}`,
            value: `${token.id}|${getTokenShareClassKey(token)}`,
          }))}
          onChange={(newValue) => {
            const [tokenId, classKey] = newValue.split('|');
            const selectedToken = tokens.find((token) => token.id === tokenId);
            loadSelectedtokenData(selectedToken, classKey);
          }}
        />

        {shareClass && selectedToken && (
          <>
            <Input
              className="field"
              rightTag={capitalizeFirstLetter(`${assetIdentifier}s`)}
              type="number"
              onChange={(e, newValue) => setAmount(Number(newValue))}
              name="amount"
              ref={(input) => (amountInput = input as Input)}
              label={intl.formatMessage(
                assetIdentifier === 'share'
                  ? CommonTexts.numberOfShares
                  : CommonTexts.numberOfTokens,
              )}
              labelDescription={
                <>
                  {intl.formatMessage(CommonTexts.availableBalance, {
                    balance: formatNumber(currentBalance),
                  })}{' '}
                  <button
                    type="button"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: colors.main,
                    }}
                    onClick={() => {
                      setAmount(Number(currentBalance));
                      amountInput.setValue(currentBalance as unknown as string);
                    }}
                  >
                    {intl.formatMessage(RedeemRequestTexts.redeemAll)}
                  </button>
                </>
              }
              placeholder="0"
              min="1"
              max={currentBalance}
              required
              disabled={isCreatingOrder}
            />

            <FormFooter>
              <Button
                size="small"
                label={intl.formatMessage(CommonTexts.back)}
                iconLeft={mdiArrowLeft}
                tertiary
                href={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
                  assetId: selectedToken.id,
                })}
              />
              <Button
                size="small"
                label={intl.formatMessage(RedeemRequestTexts.createOrder)}
                type="submit"
                isLoading={isCreatingOrder}
              />
            </FormFooter>
          </>
        )}
      </Form>
    );
  }

  function renderConfirmation() {
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
            {intl.formatMessage(
              RedeemRequestTexts.redemptionOrderConfirmationDesc,
              {
                name: selectedToken?.name,
                className: shareClass?.name || shareClass?.key,
                issuer: getClientName(selectedToken?.issuer as IUser),
              },
            )}
          </span>
        </Confirmation>

        <p>
          <b>{intl.formatMessage(CommonTexts.whatHappensNext)}</b>
        </p>

        <p>
          {intl.formatMessage(RedeemRequestTexts.whatHappensNextDesc, {
            valuation: formatLongDate(
              new Date(
                combineDateAndTime(
                  shareClass?.initialRedemption?.valuationDate,
                  shareClass?.initialRedemption?.valuationHour,
                ) || '',
              ).getTime(),
            ),
          })}{' '}
          <Link
            to={CLIENT_ROUTE_ORDER_MANAGEMENT}
            style={{ color: colors.main }}
          >
            {intl.formatMessage(CommonTexts.orderManagement)}
          </Link>
          .
        </p>

        <ConfirmationActions>
          <Button
            label={intl.formatMessage(CommonTexts.viewOrder)}
            href={CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
              orderId: `${(order as IWorkflowInstance).id}`,
            })}
          />
          <Button
            label={intl.formatMessage(RedeemRequestTexts.backToPortfolio)}
            href={CLIENT_ROUTE_INVESTOR_PORTFOLIO}
          />
        </ConfirmationActions>
      </div>
    );
  }

  if (isLoading) {
    return (
      <OrderSplitScreenLayout>
        <PageLoader />
      </OrderSplitScreenLayout>
    );
  }

  if (hasLoadingError) {
    return <PageError />;
  }

  return (
    <OrderSplitScreenLayout>
      <OrderSplitScreenMainContent>
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

        {/* Steps content */}
        {currentStep === 'details' && renderDetails()}
        {currentStep === 'confirmation' && renderConfirmation()}
      </OrderSplitScreenMainContent>

      <OrderSplitScreenSideBar>
        {selectedToken && shareClass && assetType && (
          <RedeemRequestSummary
            assetName={selectedToken.name}
            issuer={selectedToken.issuer as IUser}
            title={intl.formatMessage(CommonTexts.orderSummary)}
            shareClass={shareClass}
            cycle={cycle}
            amount={amount}
            currentSharePrice={currentNav}
            assetHref={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
              assetId: selectedToken.id,
            })}
            assetType={assetType}
          />
        )}
      </OrderSplitScreenSideBar>
    </OrderSplitScreenLayout>
  );
};
