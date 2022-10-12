import {
  API_CBDC_DIGITAL_CURRENCIES,
  API_CREATE_SECONDARY_TRADE_ORDER,
  API_FETCH_USERS,
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
import { IUser, UserType } from 'User';
import {
  OrderSplitScreenLayout,
  OrderSplitScreenMainContent,
  OrderSplitScreenSideBar,
} from 'uiComponents/OrderSplitScreenLayout/';
import React, { useEffect, useState } from 'react';
import { colors, spacing } from 'constants/styles';
import {
  getLoanDataFromToken,
  getClientName,
  getUserTokenBalance,
} from 'utils/commonUtils';
import {
  mdiAlertOctagon,
  mdiArrowLeft,
  mdiCheckCircle,
  mdiChevronRight,
} from '@mdi/js';

import { useSelector, useDispatch } from 'react-redux';
import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import { DataCall } from 'utils/dataLayer';
import Icon from 'uiComponents/Icon';
import Input from 'uiComponents/Input';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import { RouteComponentProps } from 'react-router-dom';
import Select from 'uiComponents/Select';
import { SyndicatedLoanOrderOverview } from '../SyndicatedLoanOrderOverview';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { DEFAULT_CBDC_PARAMS } from 'constants/cbdc';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { setAppModal, userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps
  extends RouteComponentProps<{ assetId: string; facilityKey: string }> {}

export const NovationRequest: React.FC<IProps> = ({
  match: {
    params: { assetId, facilityKey },
  },
}: IProps) => {
  const user = useSelector(userSelector) as IUser;

  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadingError, setHasLoadingError] = useState(false);

  const [users, setUsers] = useState<IUser[]>([]);
  const [facilityAgent, setFacilityAgent] = useState<IUser>();
  const [borrower, setBorrower] = useState<IUser>();
  const [recipient, setRecipient] = useState<IUser>();

  const [digitalCurrencies, setDigitalCurrencies] = useState<DigitalCurrency[]>(
    [],
  );
  const [paymentTokenAddess, setPaymentTokenAddess] = useState<string>();

  const [token, setToken] = useState<IToken>();
  const [facilities, setFacilities] = useState<ClassData[]>([]);
  const [facility, setFacility] = useState<ClassData>();

  const [amount, setAmount] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [interestPeriod, setInterestPeriod] = useState('-');

  const [order, setOrder] = useState<IWorkflowInstance>();
  const [currentStep, setCurrentStep] = useState('details');
  const [isPlacingNovation, setIsPlacingNovation] = useState(false);

  const dispatch = useDispatch();

  useEffect(
    () => {
      const loadData = async () => {
        setIsLoading(true);
        setBorrower(user);
        try {
          const { token: retrievedToken } = await DataCall({
            method: API_RETRIEVE_ASSET_BY_ID.method,
            path: API_RETRIEVE_ASSET_BY_ID.path(assetId),
            urlParams: {
              withBalances: true,
            },
          });
          setToken(retrievedToken);

          const drawdownInterestPeriod =
            (
              retrievedToken.userRelatedData
                ?.tokenActions as IWorkflowInstance[]
            )?.find(
              (action) =>
                action.state === 'executed' &&
                action.data.tradeOrderType !== 'Novation',
            )?.data?.interestPeriod || '-';

          setInterestPeriod(drawdownInterestPeriod);

          const {
            facilities: newFacilities,
            issuer,
            borrowerId,
          } = getLoanDataFromToken(retrievedToken);
          setFacilities(newFacilities);

          setFacilityAgent(issuer as IUser);

          const selectedFacility = newFacilities.find(
            (f) => f.key === facilityKey,
          );
          setFacility(selectedFacility);

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

          const { users: fetchedUsers }: { users: Array<IUser> } =
            await DataCall({
              method: API_FETCH_USERS.method,
              path: API_FETCH_USERS.path(),
              urlParams: {
                offset: 0,
                userType: UserType.UNDERWRITER,
              },
            });

          setUsers(
            fetchedUsers.filter(
              (fetchedUser) =>
                fetchedUser.id !== user.id &&
                fetchedUser.id !== issuer?.id &&
                fetchedUser.id !== borrowerId,
            ),
          );
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
          setHasLoadingError(true);
        }
      };
      loadData();
    },
    // eslint-disable-next-line
    [user],
  );

  const placeNovationRequest = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    try {
      event.preventDefault();

      if (!facility || !token || !recipient) {
        return;
      }

      setIsPlacingNovation(true);

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
            tradeOrderType: 'Novation',
            tradeOrderFee: totalFees,
          },
        },
      });

      setIsPlacingNovation(false);
      setOrder(order);

      setCurrentStep('confirmation');
    } catch (error) {
      setIsPlacingNovation(false);
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: 'Request Novation Error',
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
                title: 'Submit Novation',
                confirmAction: () => placeNovationRequest(e),
                confirmLabel: {
                  en: 'Submit',
                },
                confirmColor: colors.main,
                content: (
                  <ConfirmationText>
                    Are you sure you want to place this Novation order? The
                    Lender will be notified by continuing.
                  </ConfirmationText>
                ),
              }),
            ),
          );
        }}
      >
        <FormHeading>Novate Facility</FormHeading>
        <AssetName>
          <span>{token?.name}</span>
        </AssetName>
        <Select
          required
          className="field"
          name="recipient"
          label="Lender"
          options={[
            { label: 'Select a lender', value: '' },
            ...users.map((user) => ({
              label: `${user.firstName} ${user.lastName}`,
              value: user.id,
            })),
          ]}
          onChange={(newValue) =>
            setRecipient(users.find((user) => user.id === newValue))
          }
        />
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
          label="Amount to novate"
          placeholder="0"
          required
          defaultValue={0}
          min={0}
          max={token ? getUserTokenBalance(token) : undefined}
        />
        <Input
          className="field"
          rightTag={facility?.currency}
          type="number"
          onChange={(e, newValue) => setTotalFees(Number(newValue))}
          name="totalFees"
          label="Novation fees"
          placeholder="0"
          required
          defaultValue={0}
          min={0}
        />

        <Checkbox
          required
          style={{ marginTop: spacing.tightLooser }}
          label="I confirm that I have read and agree to the Novation terms and conditions specified in the Loan Agreement."
        />
        <Checkbox
          required
          style={{ marginTop: spacing.tightLooser }}
          label="I confirm that I have reviewed the Novation information and is correct."
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
            isLoading={isPlacingNovation}
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
          <span>Novation order has been created.</span>
        </Confirmation>

        <p>
          <b>What happens next</b>
        </p>
        <p>
          Once {getClientName(recipient as IUser)} approve the Novation Details,{' '}
          {getClientName(facilityAgent as IUser)} will instruct{' '}
          {getClientName(recipient as IUser)} to complete the payment with CBDC.
        </p>

        <ConfirmationActions>
          <Button
            label="View novation request"
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
              Novation details
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
          requestAmount={amount}
          requestType="Novation"
          requestFees={totalFees}
          requestBorrower={borrower}
          requestUnderwriter={recipient}
        />
      </OrderSplitScreenSideBar>
    </OrderSplitScreenLayout>
  );
};
