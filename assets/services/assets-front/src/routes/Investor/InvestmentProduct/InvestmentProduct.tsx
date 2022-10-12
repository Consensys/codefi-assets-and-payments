import React, { useState } from 'react';
import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';

import {
  CLIENT_ROUTE_INVESTMENT_PRODUCTS,
  CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER,
} from 'routesList';

import './InvestmentProduct.scss';
import { Card } from 'uiComponents/Card';
import Select from 'uiComponents/Select';
import Button from 'uiComponents/Button';
// import { currencyFormat } from "utils/currencyFormat";
import { DataCall } from 'utils/dataLayer';
import {
  API_LIST_ALL_ACTIONS,
  API_RETRIEVE_ASSET_BY_ID,
  API_RETRIEVE_ASSET_PRICE,
} from 'constants/apiRoutes';
import { RouteComponentProps } from 'react-router-dom';
import {
  IToken,
  AssetType,
  IWorkflowInstance,
  AssetCycleInstance,
  PrimaryTradeType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  getAssetType,
  // computeAuM,
  getProductFromToken,
  getTokenCurrency,
} from 'utils/commonUtils';
import InputFile from 'uiComponents/InputFile';
import ServerImage from 'uiComponents/ServerImage';
import { orderManagementRules } from 'utils/tokenUtility';
import Icon from 'uiComponents/Icon';
import { mdiClockOutline, mdiEarth } from '@mdi/js';
import { Link } from 'react-router-dom';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { colors, spacing, typography } from 'constants/styles';
import { currencyFormat } from 'utils/currencyFormat';
import { LoanOverview } from 'routes/Issuer/LoanOverview';
import { useIntl } from 'react-intl';
import { InvestmentProductTexts } from 'texts/routes/investor/InvestmentProduct';
import { CommonTexts } from 'texts/commun/commonTexts';
import ImpactBondCharacteristics from './components/ImpactBondCharacteristics';
import { Progress } from 'antd';
import FundraiserInfo from './components/FundraiserInfo';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { SdgIcon } from 'uiComponents/SdgIcons/SdgIcon';
import { SdgIconFull } from 'uiComponents/SdgIcons/SdgIconFull';
import moment from 'moment';
import { AssetData, ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import BankInformationView from './components/BankInformationView';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';

interface IProps extends RouteComponentProps<{ assetId: string }> {}

interface IState {
  token?: IToken;
  cycle?: AssetCycleInstance;
  shareClasses: Array<ClassData>;
  selectedShareClassKey: string;
  isLoading: boolean;
  hasLoadingError: boolean;
  actions: Array<IWorkflowInstance>;
  currentPrice: any;
}

export const InvestmentProduct: React.FC<IProps> = ({ match }) => {
  const intl = useIntl();
  const dispatch = useDispatch();

  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    selectedShareClassKey: 'none',
    shareClasses: [],
    actions: [],
    currentPrice: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setState((s) => ({
          ...s,
          isLoading: true,
        }));
        const { token }: { token: IToken } = await DataCall({
          method: API_RETRIEVE_ASSET_BY_ID.method,
          path: API_RETRIEVE_ASSET_BY_ID.path(match.params.assetId),
          urlParams: {
            withBalances: false,
            withCycles: true,
          },
        });
        const { shareClasses } = getProductFromToken(token);

        const subscriptionCycle = token.cycles?.filter(
          (c) => c.type === PrimaryTradeType.SUBSCRIPTION,
        )?.[0];

        const { actions }: { actions: Array<IWorkflowInstance> } =
          await DataCall({
            method: API_LIST_ALL_ACTIONS.method,
            path: API_LIST_ALL_ACTIONS.path(),
            urlParams: {
              offset: 0,
              limit: 10,
              tokenId: match.params.assetId,
            },
          });

        const currentPrice = await DataCall({
          method: API_RETRIEVE_ASSET_PRICE.method,
          path: API_RETRIEVE_ASSET_PRICE.path(match.params.assetId),
        });

        setState((s) => ({
          ...s,
          token,
          actions,
          currentPrice,
          cycle: subscriptionCycle,
          shareClasses,
          isLoading: false,
          selectedShareClassKey: shareClasses[0].key,
        }));
      } catch (error) {
        setState((s) => ({
          ...s,
          isLoading: false,
          hasLoadingError: true,
        }));
      }
    };

    loadData();
  }, [match.params.assetId]);

  if (state.isLoading) {
    return (
      <div id="_route_investor_investmentProduct">
        <PageLoader />
      </div>
    );
  }

  if (state.hasLoadingError || !state.token) {
    return (
      <div id="_route_investor_investmentProduct">
        <PageError />
      </div>
    );
  }

  const assetData: AssetData = state.token.assetData as AssetData;
  // asset type
  const assetType = assetData.type;

  if (assetType === AssetType.SYNDICATED_LOAN) {
    return <LoanOverview token={state.token} actions={state.actions} />;
  }

  const {
    assetProspectus,
    assetTeam,
    assetBanner,
    bankAccount,
    nav,
    documents,
    description,
    impactTargetsData,
    bankInformation,
    borrowerDetails,
    impactIntermediaryDetails,
    loanGeneralDetails,
    loanImpacts,
    loanSummaryInformation,
    loanViabilityCommercialImpact,
    loanRedemptionStartDate,
    loanRedemptionCutOffDate,
    loanRedemptionSettlementDate,
    impactDocument,
    commercialImpactsDocument,
  } = getProductFromToken(state.token);

  const isCommodity = assetType === AssetType.PHYSICAL_ASSET;
  const isFixedRateBond = assetType === AssetType.FIXED_RATE_BOND;
  const isImpactBond = !!impactTargetsData;

  const fullName = isCommodity
    ? `${state.token.name} - ${state.token.symbol}`
    : state.token.name;

  const buttonLabel = intl.formatMessage(
    isCommodity
      ? InvestmentProductTexts.digitalize
      : isFixedRateBond
      ? InvestmentProductTexts.invest
      : InvestmentProductTexts.subscribe,
  );

  const {
    canCreateOrder,
    timeToCutOff,
    timeToStartDate,
    // startDate,
    // cutOffDate,
  } = orderManagementRules(state.token, state.cycle?.id);

  const selectedShareClass = state.shareClasses.find(
    (shareClass) => shareClass.key === state.selectedShareClassKey,
  ) as ClassData;

  if (Array.isArray(documents)) {
    if (assetProspectus) {
      documents.push({
        name: intl.formatMessage(InvestmentProductTexts.tokenProspectus),
        key: assetProspectus.key,
      });
    }

    if (impactDocument) {
      impactDocument.forEach((singleDocument) => {
        if (!documents.some((e) => e.name === singleDocument.name)) {
          documents.push({
            name: singleDocument.name,
            key: singleDocument.key,
          });
        }
      });
    }

    if (commercialImpactsDocument) {
      commercialImpactsDocument.forEach((document) => {
        //Make sure not to push same document twice
        if (!documents.some((e) => e.name === document.name)) {
          documents.push({
            name: document.name,
            key: document.key,
          });
        }
      });
    }
  }
  const documentsSplitter = documents.length / 2;
  const rightDocs = Array.isArray(documents)
    ? documents.slice(0, documentsSplitter)
    : [];
  const leftDocs = Array.isArray(documents)
    ? documents.slice(documentsSplitter)
    : [];
  const minSubscriptionAmount = selectedShareClass.rules?.minSubscriptionAmount;
  const maxGlobalSubscriptionAmount =
    selectedShareClass.rules?.maxGlobalSubscriptionAmount;
  const impactTargets = assetData?.asset?.impact?.targets || [];
  const borrowerInformation = state.token.data.borrowerInformation;

  return (
    <div id="_route_investor_investmentProduct">
      <PageTitle
        className="title"
        title={fullName}
        backLink={{
          label: intl.formatMessage(
            InvestmentProductTexts.allInvestmentProducts,
          ),
          to: CLIENT_ROUTE_INVESTMENT_PRODUCTS,
        }}>
        <div className="actions">
          {canCreateOrder && timeToCutOff && (
            <span>
              <Icon icon={mdiClockOutline} color="#475166" />
              {intl.formatMessage(
                InvestmentProductTexts.endOfSubscriptionPeriod,
                { timeToCutOff },
              )}
            </span>
          )}
          {!canCreateOrder && !timeToStartDate && (
            <span>
              <Icon icon={mdiClockOutline} color="#475166" />
              {intl.formatMessage(
                InvestmentProductTexts.subscriptionPeriodClosed,
                { timeToCutOff },
              )}
            </span>
          )}
          {!canCreateOrder && timeToStartDate && (
            <span>
              <Icon icon={mdiClockOutline} color="#475166" />
              {intl.formatMessage(
                InvestmentProductTexts.subscriptionPeriodStarts,
                { timeToStartDate },
              )}
            </span>
          )}
          <Button
            size="small"
            label={buttonLabel}
            disabled={!canCreateOrder}
            href={CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER.pathBuilder({
              assetId: match.params.assetId,
              classKey: state.selectedShareClassKey,
            })}
          />
        </div>
      </PageTitle>

      <main>
        {assetBanner && (
          <ServerImage
            docId={assetBanner.key}
            alt="asset-banner"
            style={{ width: '100%', maxHeight: 400 }}
          />
        )}

        <div className="projectContainer">
          <Card className="summaryContainer">
            <header>
              {intl.formatMessage(InvestmentProductTexts.assetOverview)}
            </header>
            <div>
              <div style={{ marginBottom: '50px' }} className="summary">
                {description}
              </div>
              {isFixedRateBond && isImpactBond && (
                <div className="sdg">
                  <h2>
                    {intl.formatMessage(assetIssuanceMessages.impactGoals)}
                  </h2>
                  <div>
                    {impactTargets?.map((impactTarget: any, index) => {
                      return (
                        <div key={index}>
                          <SdgIconFull element={impactTarget.category} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
          {isFixedRateBond && isImpactBond && (
            <div>
              <Card className="investContainer">
                {!canCreateOrder && timeToStartDate && (
                  <div>
                    <div>
                      <div>
                        <p>
                          {minSubscriptionAmount
                            ? currencyFormat(
                                minSubscriptionAmount,
                                getTokenCurrency(state.token),
                              )
                            : intl.formatMessage(
                                InvestmentProductTexts.noMinimum,
                              )}
                        </p>
                        <p>
                          {intl.formatMessage(
                            InvestmentProductTexts.minInvestment,
                          )}
                        </p>
                      </div>
                      {selectedShareClass.couponRate && (
                        <div className="targetValue">
                          <p>{selectedShareClass.couponRate.rateValue}%</p>
                          <p>
                            {intl.formatMessage(
                              InvestmentProductTexts.targetReturn,
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      size="small"
                      label={buttonLabel}
                      disabled={!canCreateOrder}
                      href={CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER.pathBuilder(
                        {
                          assetId: match.params.assetId,
                          classKey: state.selectedShareClassKey,
                        },
                      )}
                    />
                    <span>
                      <Icon icon={mdiClockOutline} color="#475166" />
                      {intl.formatMessage(
                        InvestmentProductTexts.untilSubscriptionOpens,
                        { timeToStartDate },
                      )}
                    </span>
                  </div>
                )}

                {canCreateOrder && timeToCutOff && (
                  <div>
                    <div className="investProgress">
                      <Progress
                        type="line"
                        percent={
                          (state.currentPrice.price /
                            maxGlobalSubscriptionAmount) *
                          100
                        }
                        showInfo={false}
                        strokeColor="#1a5afe"
                        strokeWidth={10}
                        width={70}
                      />
                      <p>
                        {currencyFormat(
                          state.currentPrice.price,
                          selectedShareClass.currency,
                        )}{' '}
                        of{' '}
                        {currencyFormat(
                          maxGlobalSubscriptionAmount,
                          selectedShareClass.currency,
                        )}
                      </p>
                    </div>
                    <div>
                      <div>
                        <p>
                          {minSubscriptionAmount
                            ? currencyFormat(
                                minSubscriptionAmount,
                                getTokenCurrency(state.token),
                              )
                            : intl.formatMessage(
                                InvestmentProductTexts.noMinimum,
                              )}
                        </p>
                        <p>
                          {intl.formatMessage(
                            InvestmentProductTexts.minInvestment,
                          )}
                        </p>
                      </div>
                      {selectedShareClass.couponRate && (
                        <div className="targetValue">
                          <p>{selectedShareClass.couponRate.rateValue}%</p>
                          <p>
                            {intl.formatMessage(
                              InvestmentProductTexts.targetReturn,
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      size="small"
                      label={buttonLabel}
                      disabled={!canCreateOrder}
                      href={CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER.pathBuilder(
                        {
                          assetId: match.params.assetId,
                          classKey: state.selectedShareClassKey,
                        },
                      )}
                    />
                    <span>
                      <Icon icon={mdiClockOutline} color="#475166" />
                      {intl.formatMessage(
                        InvestmentProductTexts.untilSubscriptionEnds,
                        { timeToCutOff },
                      )}
                    </span>
                  </div>
                )}
                {!canCreateOrder && !timeToStartDate && (
                  <>
                    <header>
                      {intl.formatMessage(
                        InvestmentProductTexts.nextCouponPayment,
                      )}
                    </header>
                    <div className="couponPaymentDate">
                      {state.shareClasses?.[0]?.couponRate?.paymentDate
                        ? moment(
                            new Date(
                              state.shareClasses?.[0]?.couponRate?.paymentDate,
                            ),
                          ).format('DD/MM/YYYY')
                        : '-'}
                    </div>
                  </>
                )}
              </Card>

              <Card className="targetsContainer">
                <header>
                  {intl.formatMessage(InvestmentProductTexts.projectTargets)}
                </header>
                <div>
                  <div className="summary"></div>
                  <div className="targetName">
                    {impactTargets?.map((impactTarget: any, index) => {
                      return (
                        <div key={index}>
                          <Progress
                            type="circle"
                            percent={25}
                            strokeColor="#69bfa0"
                            width={64}
                            format={() => (
                              <SdgIcon element={impactTarget.category} />
                            )}
                          />
                          <p>
                            {impactTarget.metric} {impactTarget.unit}{' '}
                            {impactTarget.target}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {state.shareClasses.length > 1 && (
          <div className="shareClassSelector">
            <h2>
              {intl.formatMessage(InvestmentProductTexts.selectShareClass)}
            </h2>
            <div>
              <Select
                options={state.shareClasses.map((shareClass) => ({
                  label: intl.formatMessage(InvestmentProductTexts.shareClass, {
                    className: shareClass.name || shareClass.key,
                    classKey: shareClass.key,
                  }),
                  value: shareClass.key,
                }))}
                onChange={(selectedShareClassKey) =>
                  setState((s) => ({
                    ...s,
                    selectedShareClassKey,
                  }))
                }
              />
            </div>
          </div>
        )}

        {selectedShareClass && (
          <>
            {assetType === AssetType.FIXED_RATE_BOND ? (
              <ImpactBondCharacteristics
                token={state.token}
                selectedShareClass={selectedShareClass}
                bankAccount={bankAccount}
                assetType={assetType}
                cycle={state.cycle}
                borrowerDetails={borrowerDetails}
                impactIntermediaryDetails={impactIntermediaryDetails}
                loanGeneralDetails={loanGeneralDetails}
                loanImpacts={loanImpacts}
                loanSummaryInformation={loanSummaryInformation}
                loanViabilityCommercialImpact={loanViabilityCommercialImpact}
                loanRedemptionStartDate={loanRedemptionStartDate}
                loanRedemptionCutOffDate={loanRedemptionCutOffDate}
                loanRedemptionSettlementDate={loanRedemptionSettlementDate}
                description={description}
              />
            ) : (
              <Card className="characteristics">
                <header>
                  {intl.formatMessage(InvestmentProductTexts.characteristics)}
                </header>

                <div>
                  <div>
                    <h3>
                      {intl.formatMessage(
                        InvestmentProductTexts.generalCharacteristicsAsset,
                      )}
                    </h3>
                    <ul>
                      {!isCommodity && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.assetType,
                            )}
                          </span>
                          <span>{getAssetType(assetType)}</span>
                        </li>
                      )}
                      <li>
                        <span>
                          {intl.formatMessage(InvestmentProductTexts.assetName)}
                        </span>
                        <span>{state.token.name}</span>
                      </li>
                      <li>
                        <span>
                          {intl.formatMessage(
                            InvestmentProductTexts.assetSymbol,
                          )}
                        </span>
                        <span>{state.token.symbol}</span>
                      </li>
                      {isCommodity && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.assetCustodian,
                            )}
                          </span>
                          <span>{bankAccount.bankName}</span>
                        </li>
                      )}
                      {bankInformation && (
                        <BankInformationView
                          bankInformation={bankInformation}
                        />
                      )}
                      {bankAccount.iban && (
                        <li>
                          <span>
                            {intl.formatMessage(CommonTexts.accountNumberIBAN)}
                          </span>
                          <span>{bankAccount.iban}</span>
                        </li>
                      )}
                      {bankAccount.swift && (
                        <li>
                          <span>
                            {intl.formatMessage(CommonTexts.swiftBic)}
                          </span>
                          <span>{bankAccount.swift}</span>
                        </li>
                      )}
                      {bankAccount.holderName && (
                        <li>
                          <span>
                            {intl.formatMessage(CommonTexts.holderName)}
                          </span>
                          <span>{bankAccount.holderName}</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div>
                    {isCommodity ? (
                      <h3>
                        <br />
                      </h3>
                    ) : (
                      <h3>
                        {intl.formatMessage(
                          InvestmentProductTexts.shareClassCharacteristics,
                        )}
                      </h3>
                    )}
                    <ul>
                      {!isCommodity && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.shareClass,
                              {
                                className:
                                  selectedShareClass.name ||
                                  selectedShareClass.key,
                                classKey: selectedShareClass.key,
                              },
                            )}
                          </span>
                          <span>
                            {selectedShareClass.key?.toUpperCase() ||
                              selectedShareClass.name?.toUpperCase()}
                          </span>
                        </li>
                      )}
                      {nav && (
                        <li>
                          <span>
                            {intl.formatMessage(InvestmentProductTexts.NAV)}
                          </span>
                          <span>
                            {currencyFormat(nav, selectedShareClass.currency)}
                          </span>
                        </li>
                      )}
                      {!isCommodity && selectedShareClass.isin && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.ISINCode,
                            )}
                          </span>
                          <span>{selectedShareClass.isin}</span>
                        </li>
                      )}
                      {selectedShareClass.shareType && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.shareType,
                            )}
                          </span>
                          <span>{selectedShareClass.shareType}</span>
                        </li>
                      )}
                      <li>
                        <span>
                          {intl.formatMessage(InvestmentProductTexts.currency)}
                        </span>
                        <span>{selectedShareClass.currency}</span>
                      </li>

                      {/* Subscription */}
                      {selectedShareClass.rules?.minSubscriptionAmount && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.minimumSubscriptionAmount,
                            )}
                          </span>
                          <span>
                            {currencyFormat(
                              selectedShareClass.rules?.minSubscriptionAmount,
                              selectedShareClass.currency,
                            )}
                          </span>
                        </li>
                      )}

                      {selectedShareClass.rules?.minSubscriptionQuantity && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.minimumSubscriptionQuantity,
                            )}
                          </span>
                          <span>
                            {selectedShareClass.rules?.minSubscriptionQuantity}
                          </span>
                        </li>
                      )}

                      {selectedShareClass.rules?.maxSubscriptionAmount && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.maximumSubscriptionAmount,
                            )}
                          </span>
                          <span>
                            {currencyFormat(
                              selectedShareClass.rules?.maxSubscriptionAmount,
                              selectedShareClass.currency,
                            )}
                          </span>
                        </li>
                      )}

                      {selectedShareClass.rules?.maxSubscriptionQuantity && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.maximumSubscriptionQuantity,
                            )}
                          </span>
                          <span>
                            {selectedShareClass.rules?.maxSubscriptionQuantity}
                          </span>
                        </li>
                      )}
                      {/* Subscription */}

                      {/* Redemption */}
                      {selectedShareClass.rules?.minRedemptionQuantity && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.minimumRedemptionQuantity,
                            )}
                          </span>
                          <span>
                            {selectedShareClass.rules?.minRedemptionQuantity}
                          </span>
                        </li>
                      )}

                      {selectedShareClass.rules?.maxRedemptionQuantity && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.maximumRedemptionQuantity,
                            )}
                          </span>
                          <span>
                            {selectedShareClass.rules?.maxRedemptionQuantity}
                          </span>
                        </li>
                      )}
                      {/* Redemption */}

                      {selectedShareClass.decimalisation && (
                        <li>
                          <span>
                            {intl.formatMessage(
                              InvestmentProductTexts.decimalisation,
                            )}
                          </span>
                          <span>{selectedShareClass.decimalisation}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {assetType === AssetType.FIXED_RATE_BOND && (
              <FundraiserInfo borrowerInformation={borrowerInformation} />
            )}

            {assetTeam.length > 0 && (
              <Card className="documents">
                <header>
                  {intl.formatMessage(InvestmentProductTexts.team)}
                </header>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}>
                  {assetTeam.map((teamMember, memberIndex) => {
                    return (
                      <div
                        key={`team_member_${memberIndex}`}
                        style={{
                          display: 'flex',
                          width: assetTeam.length % 2 === 0 ? '50%' : '33%',
                        }}>
                        <div>
                          <ServerImage
                            docId={teamMember.image.key}
                            alt="asset-banner"
                            style={{ width: '96px', height: '96px' }}
                          />
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: 250,
                            padding: 16,
                          }}>
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: 500,
                              color: '#1A2233',
                              lineHeight: '24px',
                            }}>
                            {teamMember.name}
                          </span>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 400,
                              color: '#475166',
                              lineHeight: '21px',
                            }}>
                            {teamMember.role}
                          </span>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                            }}>
                            <Link
                              to={teamMember.url}
                              target="_blank"
                              rel="noopener noreferrer">
                              <Icon icon={mdiEarth} color="#4D79FF" />
                            </Link>
                            <Link
                              to="#"
                              style={{
                                marginLeft: 8,
                                fontSize: 14,
                                color: colors.main,
                              }}
                              onClick={() => {
                                dispatch(
                                  setAppModal(
                                    appModalData({
                                      closeIcon: true,
                                      noPadding: true,
                                      title: teamMember.name,
                                      content: (
                                        <div
                                          style={{
                                            width: '580px',
                                            padding: spacing.regular,
                                          }}>
                                          <div
                                            key={`team_member_${memberIndex}`}
                                            style={{
                                              display: 'flex',
                                            }}>
                                            <div>
                                              <ServerImage
                                                docId={teamMember.image.key}
                                                alt="asset-banner"
                                                style={{
                                                  width: '96px',
                                                  height: '96px',
                                                }}
                                              />
                                            </div>
                                            <div
                                              style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                width: 250,
                                                padding: 16,
                                              }}>
                                              <span
                                                style={{
                                                  fontSize: '16px',
                                                  fontWeight: 500,
                                                  color: '#1A2233',
                                                  lineHeight: '24px',
                                                }}>
                                                {teamMember.name}
                                              </span>
                                              <span
                                                style={{
                                                  fontSize: '14px',
                                                  fontWeight: 400,
                                                  color: '#475166',
                                                  lineHeight: '21px',
                                                }}>
                                                {teamMember.role}
                                              </span>
                                              <div
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                }}>
                                                <Link
                                                  to={teamMember.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer">
                                                  <Icon
                                                    icon={mdiEarth}
                                                    color="#4D79FF"
                                                  />
                                                </Link>
                                              </div>
                                            </div>
                                          </div>
                                          <p
                                            style={{
                                              fontSize: typography.sizeF2,
                                              color: '#475166',
                                              marginTop: spacing.tightLooser,
                                            }}>
                                            {teamMember.bio}
                                          </p>
                                        </div>
                                      ),
                                    }),
                                  ),
                                );
                              }}>
                              {intl.formatMessage(
                                InvestmentProductTexts.viewBio,
                              )}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}
        {selectedShareClass && (
          <>
            {documents.length > 0 && (
              <Card className="documents">
                <header>
                  {intl.formatMessage(InvestmentProductTexts.documents)}
                </header>
                <div>
                  <div>
                    <ul>
                      {leftDocs.map((doc, docIndex) => {
                        if (!doc) {
                          return null;
                        }
                        return (
                          <li key={`doc-left-${docIndex}`}>
                            <span>{doc.name}</span>
                            <span>
                              <InputFile
                                value={[doc.name, doc.key]}
                                downloadable
                                preview={false}
                              />
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {rightDocs.length > 0 && (
                    <div>
                      <ul>
                        {rightDocs.map((doc, docIndex) => {
                          if (!doc) {
                            return null;
                          }
                          return (
                            <li key={`doc-left-${docIndex}`}>
                              <span>{doc.name}</span>
                              <span>
                                <InputFile
                                  value={[doc.name, doc.key]}
                                  downloadable
                                  preview={false}
                                />
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};
