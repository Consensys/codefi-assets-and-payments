import {
  API_CBDC_DIGITAL_CURRENCIES,
  API_CREATE_SECONDARY_TRADE_ORDER,
  API_RETRIEVE_ASSET_BY_ID,
} from 'constants/apiRoutes';
import {
  DigitalCurrency,
  DvpType,
  IToken,
  IWorkflowInstance,
  OrderType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  AssetName,
  Confirmation,
  ConfirmationActions,
  ConfirmationText,
  Form,
  FormFooter,
  FormHeading,
  FormTopNavigation,
} from 'uiComponents/OrderForm/';
import {
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
} from 'routesList';
import { IUser } from 'User';
import {
  OrderSplitScreenLayout,
  OrderSplitScreenMainContent,
  OrderSplitScreenSideBar,
} from 'uiComponents/OrderSplitScreenLayout/';
import React, { useEffect, useState } from 'react';
import { colors, spacing } from 'constants/styles';
import { getLoanDataFromToken, getClientName } from 'utils/commonUtils';
import {
  mdiAlertOctagon,
  mdiArrowLeft,
  mdiCheckCircle,
  mdiChevronRight,
} from '@mdi/js';

import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import { DEFAULT_CBDC_PARAMS } from 'constants/cbdc';
import { DataCall } from 'utils/dataLayer';
import Icon from 'uiComponents/Icon';
import Input from 'uiComponents/Input';
import InputDate from 'uiComponents/InputDate';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import { RouteComponentProps } from 'react-router-dom';
import Select from 'uiComponents/Select';
import { SyndicatedLoanOrderOverview } from '../SyndicatedLoanOrderOverview';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { ClassData, LoanFees } from 'routes/Issuer/AssetIssuance/assetTypes';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps
  extends RouteComponentProps<{ assetId: string; facilityKey: string }> {}

const interestPeriodOptions = [
  {
    label: '1 Month',
    value: '1 Month',
  },
  {
    label: '3 Months',
    value: '3 Months',
  },
  {
    label: '6 Months',
    value: '6 Months',
  },
];

export const DrawdownRequest: React.FC<IProps> = ({
  match: {
    params: { assetId, facilityKey },
  },
}: IProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [token, setToken] = useState<IToken>();
  const [recipient, setRecipient] = useState<IUser>();
  const [facilityAgent, setFacilityAgent] = useState<IUser>();
  const [digitalCurrencies, setDigitalCurrencies] = useState<DigitalCurrency[]>(
    [],
  );
  const [paymentTokenAddess, setPaymentTokenAddess] = useState<string>();
  const [facility, setFacility] = useState<ClassData>();
  const [amount, setAmount] = useState(0);
  const [interestPeriod, setInterestPeriod] = useState('1 Month');
  const [utilizationDate, setUtilizationDate] = useState(new Date());
  const [order, setOrder] = useState<IWorkflowInstance>();
  const [currentStep, setCurrentStep] = useState('details');
  const [isPlacingDrawdown, setIsPlacingDrawdown] = useState(false);
  const dispatch = useDispatch();

  useEffect(
    () => {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const { token: retrievedToken } = await DataCall({
            method: API_RETRIEVE_ASSET_BY_ID.method,
            path: API_RETRIEVE_ASSET_BY_ID.path(assetId),
            urlParams: {
              withBalances: false,
            },
          });
          setToken(retrievedToken);

          const { facilities, underwriter, issuer } =
            getLoanDataFromToken(retrievedToken);
          setRecipient(underwriter);
          setFacilityAgent(issuer as IUser);

          const selectedFacility = facilities.find(
            (f) => f.key === facilityKey,
          );
          setFacility(selectedFacility);
          setAmount(Number(selectedFacility?.facilityAmount));

          try {
            const retrievedDigitalCurrencies: DigitalCurrency[] =
              await DataCall({
                method: API_CBDC_DIGITAL_CURRENCIES.method,
                path: API_CBDC_DIGITAL_CURRENCIES.path(),
              });
            if (retrievedDigitalCurrencies.length > 0) {
              const matchedDigitalCurrency = retrievedDigitalCurrencies.find(
                (digitalCurrency) =>
                  digitalCurrency.currency === selectedFacility?.currency,
              );
              if (matchedDigitalCurrency) {
                setDigitalCurrencies([matchedDigitalCurrency]);
                setPaymentTokenAddess(matchedDigitalCurrency.address);
              } else {
                setDigitalCurrencies(retrievedDigitalCurrencies);
                setPaymentTokenAddess(retrievedDigitalCurrencies[0].address);
              }
            }
          } catch {
            setDigitalCurrencies([DEFAULT_CBDC_PARAMS]);
            setPaymentTokenAddess(DEFAULT_CBDC_PARAMS.address);
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

  const placeDrawdownRequest = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    try {
      event.preventDefault();

      if (!facility || !token || !recipient) {
        return;
      }

      setIsPlacingDrawdown(true);

      const { order } = await DataCall({
        method: API_CREATE_SECONDARY_TRADE_ORDER.method,
        path: API_CREATE_SECONDARY_TRADE_ORDER.path(),
        body: {
          recipientId: recipient.id,
          tokenId: assetId,
          assetClass: facilityKey,
          orderType: OrderType.QUANTITY,
          amount: 1,
          quantity: amount,
          sendNotification: true,
          dvpType: DvpType.ATOMIC,
          paymentTokenAddess,
          paymentTokenStandard: 'ERC20Token',
          data: {
            interestPeriod,
            utilizationDate: utilizationDate.getTime(),
          },
        },
      });

      setIsPlacingDrawdown(false);
      setOrder(order);

      setCurrentStep('confirmation');
    } catch (error) {
      setIsPlacingDrawdown(false);
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: 'Request Drawdown Error',
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
  };

  function renderDetails() {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch(
            setAppModal(
              appModalData({
                title: 'Request drawdown',
                confirmAction: () => placeDrawdownRequest(e),
                confirmLabel: {
                  en: 'Place request',
                },
                confirmColor: colors.main,
                content: (
                  <ConfirmationText>
                    Are you sure you want to place this drawdown request? The
                    request is irrevocable and the Facility Agent and the Lead
                    Arranger will be notified.
                  </ConfirmationText>
                ),
              }),
            ),
          );
        }}
      >
        <FormHeading>Request drawdown</FormHeading>
        <AssetName>
          <span>{token?.name}</span>
        </AssetName>
        <InputDate
          label="Proposed utilisation date"
          required={true}
          className="field"
          defaultValue={utilizationDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => {
            setUtilizationDate(new Date((e.target as HTMLInputElement).value));
          }}
        />
        <Select
          style={{
            display:
              digitalCurrencies.length === 1 && paymentTokenAddess
                ? 'none'
                : 'block',
          }}
          required
          className="field"
          name="digital-currency"
          label="Select your currency"
          defaultValue={paymentTokenAddess}
          options={digitalCurrencies.map((digitalCurrenty) => ({
            label: digitalCurrenty.currency,
            value: digitalCurrenty.address,
          }))}
          onChange={(newValue) => setPaymentTokenAddess(newValue)}
        />
        <Input
          className="field"
          rightTag={facility?.currency}
          type="number"
          onChange={(e, newValue) => setAmount(Number(newValue))}
          name="amount"
          label="Amount to drawdown"
          placeholder="0"
          required
          defaultValue={
            (facility?.facilityAmount || 0) -
            ((token?.assetData?.asset?.fees as LoanFees).establishmentFees || 0)
          }
          disabled={true}
        />
        <Select
          className="field"
          onChange={(value) => setInterestPeriod(value)}
          name="interest-period"
          label="Interest period"
          readOnly={isPlacingDrawdown}
          placeholder="Please select an interest period"
          defaultValue={interestPeriodOptions[0].value}
          options={interestPeriodOptions}
          required
        />
        <Checkbox
          required
          style={{ marginTop: spacing.tightLooser }}
          label="The Borrower confirms that each further condition precedent specified in the agreement is satisfied on the date of this drawdown request."
        />
        <FormFooter>
          <Button
            size="small"
            label="Back"
            iconLeft={mdiArrowLeft}
            tertiary
            href={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
              assetId,
            })}
          />
          <Button
            size="small"
            label="Submit"
            type="submit"
            isLoading={isPlacingDrawdown}
          />
        </FormFooter>
      </Form>
    );
  }

  function renderConfirmation() {
    return (
      <div>
        <FormHeading>Request confirmation</FormHeading>

        <Confirmation>
          <Icon
            icon={mdiCheckCircle}
            color={colors.success}
            style={{ width: '24px', height: '24px' }}
          />
          <span>Your request to drawdown has been created.</span>
        </Confirmation>

        <p>
          <b>What happens next</b>
        </p>

        <p>
          Once both {getClientName(recipient as IUser)} and{' '}
          {getClientName(facilityAgent as IUser)} approve the drawdown request,
          CBDC will be transferred to your account on the CBDC platform.
        </p>

        <ConfirmationActions>
          <Button
            label="View  drawdown request"
            href={CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
              orderId: `${(order as IWorkflowInstance).id}`,
            })}
          />
          <Button
            label="View loan"
            href={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
              assetId: token?.id || '',
            })}
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

  if (hasLoadingError || !token || !facility) {
    return <PageError />;
  }
  return (
    <OrderSplitScreenLayout>
      <OrderSplitScreenMainContent>
        <FormTopNavigation>
          <div>
            <span className={currentStep === 'details' ? 'active' : undefined}>
              Drawdown details
            </span>
            <Icon icon={mdiChevronRight} width={18} />
            <span
              className={currentStep === 'confirmation' ? 'active' : undefined}
            >
              Confirmation
            </span>
          </div>
        </FormTopNavigation>

        {/* Steps content */}
        {currentStep === 'details' && renderDetails()}
        {currentStep === 'confirmation' && renderConfirmation()}
      </OrderSplitScreenMainContent>

      <OrderSplitScreenSideBar>
        <SyndicatedLoanOrderOverview
          token={token}
          facility={facility}
          order={order}
          assetHref={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
            assetId: token.id,
          })}
          requestInterestPeriod={interestPeriod}
          requestUtilizationDate={utilizationDate}
          requestAmount={amount}
          requestType="Drawdown"
          requestUnderwriter={recipient}
        />
      </OrderSplitScreenSideBar>
    </OrderSplitScreenLayout>
  );
};
