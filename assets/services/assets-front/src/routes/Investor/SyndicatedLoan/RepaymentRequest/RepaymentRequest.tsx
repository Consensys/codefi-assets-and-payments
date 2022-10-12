import {
  API_CBDC_DIGITAL_CURRENCIES,
  API_CREATE_SECONDARY_TRADE_ORDER,
  API_LIST_ALL_ACTIONS,
  API_RETRIEVE_ASSET_BY_ID,
} from 'constants/apiRoutes';
import {
  DigitalCurrency,
  DvpType,
  IToken,
  IWorkflowInstance,
  OrderSide,
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
import { colors, spacing, typography } from 'constants/styles';
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
import Label from 'uiComponents/Label';
import { Link } from 'react-router-dom';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import { RepaymentRequestSummary } from './RepaymentRequestSummary';
import { RouteComponentProps } from 'react-router-dom';
import Select from 'uiComponents/Select';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { getRemainingRepaymentAmountToLender } from './repaymentUtils';
import styled from 'styled-components';
import {
  ClassData,
  combineDateAndTime,
} from 'routes/Issuer/AssetIssuance/assetTypes';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps
  extends RouteComponentProps<{
    assetId: string;
    facilityKey: string;
    recipientId: string;
  }> {}

const RecipientName = styled.div`
  font-size: ${typography.sizeF1};
  margin-bottom: ${spacing.tight};
`;

export const RepaymentRequest: React.FC<IProps> = ({
  match: {
    params: { assetId, facilityKey, recipientId },
  },
}: IProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadingError, setHasLoadingError] = useState(false);

  const [digitalCurrencies, setDigitalCurrencies] = useState<DigitalCurrency[]>(
    [],
  );
  const [paymentTokenAddess, setPaymentTokenAddess] = useState<string>();

  const [token, setToken] = useState<IToken>();
  const [facilities, setFacilities] = useState<ClassData[]>([]);
  const [facility, setFacility] = useState<ClassData>();
  const [isEarlyRepayment, setIsEarlyRepayment] = useState(false);
  const [actions, setActions] = useState([] as IWorkflowInstance[]);

  const [facilityAgent, setFacilityAgent] = useState<IUser>();
  const [recipient, setRecipient] = useState<IUser>();

  const [amount, setAmount] = useState(0);

  const [order, setOrder] = useState<IWorkflowInstance>();
  const [currentStep, setCurrentStep] = useState('details');
  const [isPlacingRepayment, setIsPlacingRepayment] = useState(false);

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
              withBalances: true,
            },
          });
          setToken(retrievedToken);

          const { facilities: newFacilities, issuer } =
            getLoanDataFromToken(retrievedToken);

          setFacilities(newFacilities);
          setFacilityAgent(issuer as IUser);

          const selectedFacility = newFacilities.find(
            (f) => f.key === facilityKey,
          );
          setFacility(selectedFacility);

          setIsEarlyRepayment(
            new Date(
              combineDateAndTime(
                selectedFacility?.initialSubscription.cutoffDate,
                selectedFacility?.initialSubscription.cutoffHour,
              ) || '',
            ).getTime() >= new Date().getTime(),
          );

          const notaries = retrievedToken.notaries;

          setRecipient(
            notaries.find((notary: IUser) => notary.id === recipientId),
          );

          const { actions: newActions }: { actions: IWorkflowInstance[] } =
            await DataCall({
              method: API_LIST_ALL_ACTIONS.method,
              path: API_LIST_ALL_ACTIONS.path(),
              urlParams: {
                offset: 0,
                limit: 30,
                tokenId: assetId,
              },
            });
          setActions(newActions);

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

  const placeRepaymentRequest = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    try {
      event.preventDefault();

      if (!facility || !token) {
        return;
      }

      setIsPlacingRepayment(true);

      const { order } = await DataCall({
        method: API_CREATE_SECONDARY_TRADE_ORDER.method,
        path: API_CREATE_SECONDARY_TRADE_ORDER.path(),
        body: {
          senderId: recipient?.id,
          tokenId: assetId,
          assetClass: facilityKey,
          orderType: OrderType.QUANTITY,
          amount: 1,
          quantity: amount,
          sendNotification: true,
          dvpType: DvpType.ATOMIC,
          paymentTokenAddess,
          paymentTokenStandard: 'ERC20Token',
          orderSide: OrderSide.BUY,
          recipientId,
          data: {
            tradeOrderType: 'Repayment',
          },
        },
      });

      setIsPlacingRepayment(false);
      setOrder(order);

      setCurrentStep('confirmation');
    } catch (error) {
      setIsPlacingRepayment(false);
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: 'Request Repayment Error',
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
                title: 'Submit Repayment Notice',
                confirmAction: () => placeRepaymentRequest(e),
                confirmLabel: {
                  en: 'Submit',
                },
                confirmColor: colors.main,
                content: (
                  <ConfirmationText>
                    Are you sure you want to create this repayment notice? By
                    continuing {getClientName(facilityAgent as IUser)} will be
                    notified.
                  </ConfirmationText>
                ),
              }),
            ),
          );
        }}
      >
        <FormHeading>Repayment</FormHeading>
        <AssetName>
          <span>{token?.name}</span>
        </AssetName>

        <Label label="Lender to repay" required />
        <RecipientName>
          {recipient ? getClientName(recipient) : ''}
        </RecipientName>

        <Select
          required
          className="field"
          name="facility"
          label="Facility"
          disabled={facilities.length === 1}
          defaultValue={facility?.key}
          options={facilities.map((mappedFacility) => ({
            label: mappedFacility.name,
            value: mappedFacility.key,
          }))}
          onChange={(newValue) =>
            setFacility(
              facilities.find(
                (searchedFacility) => searchedFacility.key === newValue,
              ),
            )
          }
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
          label="Repayment amount"
          placeholder="0"
          required
          defaultValue={0}
          min={0}
          max={
            token && actions.length
              ? getRemainingRepaymentAmountToLender(actions, recipientId)
              : undefined
          }
          style={{ marginBottom: spacing.regular }}
        />

        {isEarlyRepayment && (
          <Checkbox
            required
            checked
            disabled
            style={{ marginTop: spacing.tightLooser }}
            label="I accept the early repayment fee."
          />
        )}
        <Checkbox
          required
          style={{ marginTop: spacing.tightLooser }}
          label="I confirm that I have reviewed the Repayment information and is correct."
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
            isLoading={isPlacingRepayment}
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
          <span>
            Your repayment notice has been submitted to{' '}
            {getClientName(facilityAgent as IUser)}.
          </span>
        </Confirmation>

        <p>
          <b>What happens next</b>
        </p>
        <p>
          Your repayment notice has been submitted and is pending the approval
          of the Facility Agent. The order can be viewed in{' '}
          <Link
            to={CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
              orderId: `${(order as IWorkflowInstance).id}`,
            })}
          >
            Order management
          </Link>
          .
        </p>
        <p>
          Once the repayment notice has been approved, you will receive an
          instruction to execute the repayment in CBDC.
        </p>

        <ConfirmationActions>
          <Button
            label="View repayment request"
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
              Repayment request
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
        <RepaymentRequestSummary
          isBorrowerSide
          token={token}
          facility={facility}
          order={order}
          assetHref={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
            assetId: token.id,
          })}
          requestRepaymentAmount={amount}
          recipient={recipient}
        />
      </OrderSplitScreenSideBar>
    </OrderSplitScreenLayout>
  );
};

export default RepaymentRequest;
