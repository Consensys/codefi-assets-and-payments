import React, { useEffect, useState } from 'react';
import {
  API_CREATE_SECONDARY_TRADE_ORDER,
  API_ASSET_ALL_GET,
} from 'constants/apiRoutes';
import { colors } from 'constants/styles';
import { Link } from 'react-router-dom';
import {
  AssetType,
  DvpType,
  IToken,
  IWorkflowInstance,
  OrderType,
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
} from 'utils/commonUtils';
import { DataCall } from 'utils/dataLayer';
import { IUser } from 'User';
import {
  mdiAlertOctagon,
  mdiArrowLeft,
  mdiCheckCircle,
  mdiChevronRight,
} from '@mdi/js';

import { currencyFormat } from 'utils/currencyFormat';
import SellRequestSummary from '../SellRequestSummary';
import Select from 'uiComponents/Select';
import { useIntl } from 'react-intl';
import { SellRequestTexts } from 'texts/routes/investor/SellRequest';
import { CommonTexts } from 'texts/commun/commonTexts';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

export const SellRequest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [selectedToken, setSelectedToken] = useState<IToken>();
  const [tokens, setTokens] = useState<IToken[]>([]);
  const [shareClass, setShareClass] = useState<ClassData>();
  const [price, setPrice] = useState(0);
  const [amount, setAmount] = useState(0);
  const [recipient, setRecipient] = useState<string>('');
  const [order, setOrder] = useState<IWorkflowInstance>();
  const [currentStep, setCurrentStep] = useState('details');
  const [assetType, setAssetType] = useState<AssetType>();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [currentNav, setCurrentNav] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const intl = useIntl();
  const dispatch = useDispatch();

  const loadSelectedtokenData = (
    tokens: IToken[],
    assetId: string,
    classKey: string,
  ) => {
    const token = tokens.find((token) => token.id === assetId);
    if (!token) {
      return;
    }

    setSelectedToken(token);

    const { shareClasses, assetType, nav } = getProductFromToken(token);

    setCurrentBalance(getUserTokenBalance(token) || 0);

    const selectedShareClass = shareClasses.find((f) => f.key === classKey);

    setShareClass(selectedShareClass);
    setAssetType(assetType);

    setCurrentNav(nav);
  };

  useEffect(
    () => {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const { tokens }: { tokens: Array<IToken> } = await DataCall({
            method: API_ASSET_ALL_GET.method,
            path: API_ASSET_ALL_GET.path(),
            urlParams: {
              offset: 0,
              limit: 10,
              withBalances: true,
            },
          });

          setTokens(
            tokens.filter((token) => {
              const { assetType } = getProductFromToken(token);
              return assetType !== AssetType.SYNDICATED_LOAN;
            }),
          );

          const { assetId, classKey } = parseQuery(window.location.search);

          if (assetId && classKey) {
            loadSelectedtokenData(tokens, assetId, classKey);
          } else if (tokens.length > 0) {
            loadSelectedtokenData(
              tokens,
              tokens[0].id,
              getTokenShareClassKey(tokens[0]),
            );
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

  const createOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();

      if (!shareClass || !selectedToken || !recipient) {
        return;
      }

      setIsCreatingOrder(true);

      const { order } = await DataCall({
        method: API_CREATE_SECONDARY_TRADE_ORDER.method,
        path: API_CREATE_SECONDARY_TRADE_ORDER.path(),
        body: {
          recipientEmail: recipient,
          tokenId: selectedToken.id,
          assetClass: shareClass.key,
          orderType: OrderType.QUANTITY,
          amount: amount * price,
          quantity: amount,
          sendNotification: true,
          dvpType: DvpType.NON_ATOMIC,
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
          message: intl.formatMessage(SellRequestTexts.sellOrderError),
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
                title: intl.formatMessage(SellRequestTexts.createSellOrder),
                confirmAction: () => createOrder(e),
                confirmLabel: intl.formatMessage(CommonTexts.submit),
                confirmColor: colors.main,
                content: (
                  <ConfirmationText>
                    {intl.formatMessage(
                      SellRequestTexts.sellOrderCreationWarning,
                    )}
                  </ConfirmationText>
                ),
              }),
            ),
          );
        }}
      >
        <FormHeading>
          {intl.formatMessage(SellRequestTexts.sellOrder)}
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
            loadSelectedtokenData(tokens, tokenId, classKey);
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
              label={intl.formatMessage(
                assetIdentifier === 'share'
                  ? CommonTexts.numberOfShares
                  : CommonTexts.numberOfTokens,
              )}
              sublabel={intl.formatMessage(CommonTexts.availableBalance, {
                balance: formatNumber(currentBalance),
              })}
              placeholder="0"
              min="0"
              max={currentBalance}
              required
              defaultValue={shareClass.facilityAmount}
              disabled={isCreatingOrder}
            />

            <Input
              className="field"
              rightTag={shareClass.currency}
              type="number"
              onChange={(e, newValue) => setPrice(Number(newValue))}
              name="price"
              min="0"
              label={intl.formatMessage(
                assetIdentifier === 'share'
                  ? CommonTexts.currentPricePerShare
                  : CommonTexts.currentPricePerToken,
                {
                  price: currencyFormat(currentNav, shareClass.currency),
                },
              )}
              placeholder="0"
              required
              defaultValue={shareClass?.facilityAmount}
              disabled={isCreatingOrder}
            />

            <Input
              className="field"
              onChange={(e, newValue) => setRecipient(String(newValue))}
              name="recipient"
              label={intl.formatMessage(SellRequestTexts.buyerEmailAddress)}
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
                label={intl.formatMessage(SellRequestTexts.createOrder)}
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
          {intl.formatMessage(SellRequestTexts.sellOrderConfirmation)}
        </FormHeading>

        <Confirmation>
          <Icon
            icon={mdiCheckCircle}
            color={colors.success}
            style={{ width: '24px', height: '24px' }}
          />
          <span>
            {intl.formatMessage(SellRequestTexts.sellOrderConfirmationDesc, {
              name: selectedToken?.name,
              className: shareClass?.name || shareClass?.key,
            })}
          </span>
        </Confirmation>

        <p>
          <b>{intl.formatMessage(CommonTexts.whatHappensNext)}</b>
        </p>

        <p>
          {intl.formatMessage(SellRequestTexts.whatHappensNextDesc)}{' '}
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
            label={intl.formatMessage(SellRequestTexts.backToPortfolio)}
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
          <SellRequestSummary
            assetName={selectedToken.name}
            issuer={selectedToken.issuer as IUser}
            title={intl.formatMessage(CommonTexts.orderSummary)}
            shareClass={shareClass}
            order={order}
            amount={amount}
            price={order ? order.price : price}
            recipient={recipient}
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
