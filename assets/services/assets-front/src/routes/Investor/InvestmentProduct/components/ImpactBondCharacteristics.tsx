import React from 'react';
import { MessageDescriptor, useIntl } from 'react-intl';
import {
  BankInformations,
  BorrowerDetails,
  ClassData,
  ImpactIntermediaryDetails,
  LoanGeneralDetails,
  LoanImpacts,
  LoanSummaryInformation,
  LoanViabilityCommercialImpact,
  Term,
} from 'routes/Issuer/AssetIssuance/assetTypes';
import {
  AssetCycleInstance,
  AssetType,
  IToken,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { CommonTexts } from 'texts/commun/commonTexts';
import { InvestmentProductTexts } from 'texts/routes/investor/InvestmentProduct';
import { Card } from 'uiComponents/Card';
import { capitalizeFirstLetter, getAssetType } from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';
import { orderManagementRules } from 'utils/tokenUtility';

interface IProps {
  token: IToken;
  selectedShareClass: ClassData;
  bankAccount: BankInformations;
  assetType: AssetType;
  cycle?: AssetCycleInstance;
  redemptionCycle?: AssetCycleInstance;
  borrowerDetails?: BorrowerDetails;
  impactIntermediaryDetails?: ImpactIntermediaryDetails;
  loanGeneralDetails?: LoanGeneralDetails;
  loanImpacts?: LoanImpacts;
  loanSummaryInformation?: LoanSummaryInformation;
  loanViabilityCommercialImpact?: LoanViabilityCommercialImpact;
  loanRedemptionStartDate?: string;
  loanRedemptionCutOffDate?: string;
  loanRedemptionSettlementDate?: string;
  description?: string;
}

const ImpactBondCharacteristics: React.FC<IProps> = ({
  token,
  selectedShareClass,
  bankAccount,
  assetType,
  cycle,
  borrowerDetails,
  impactIntermediaryDetails,
  loanGeneralDetails,
  loanImpacts,
  loanSummaryInformation,
  loanViabilityCommercialImpact,
  loanRedemptionStartDate,
  loanRedemptionCutOffDate,
  loanRedemptionSettlementDate,
  description,
}: IProps) => {
  const intl = useIntl();

  const { startDate, cutOffDate, valuationDate, unpaidFlagDate } =
    orderManagementRules(token, cycle?.id);

  const characteristicsValues = [
    [
      {
        label: InvestmentProductTexts.assetType,
        value: getAssetType(assetType),
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.assetName,
        value: token.name,
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.assetSymbol,
        value: token.symbol,
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.assetDescription,
        value: description,
        isShowing: true,
        isTitle: false,
      },
      {
        label: CommonTexts.TitleLoanSummaryInformation,
        value: '',
        isShowing: !!loanSummaryInformation?.loanshort,
        isTitle: true,
      },
      {
        label: CommonTexts.LoanSummaryInformationPitchUrl,
        value: loanSummaryInformation?.pitchUrl || '',
        isShowing: !!loanSummaryInformation?.pitchUrl,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanSummaryInformationAmount,
        value: loanSummaryInformation?.amount || '',
        isShowing: !!loanSummaryInformation?.amount,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanSummaryInformationPeriod,
        value: loanSummaryInformation?.loanPeriod || '',
        isShowing: !!loanSummaryInformation?.loanPeriod,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanSummaryInformationInterestRate,
        value: loanSummaryInformation?.loanInterestRate || '',
        isShowing: !!loanSummaryInformation?.loanInterestRate,
        isTitle: false,
      },
      {
        label: CommonTexts.borrowerName,
        value: borrowerDetails?.name || '',
        isShowing: !!borrowerDetails?.name,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanSummaryInformationBorrowerCountry,
        value: loanSummaryInformation?.borrowerCountry || '',
        isShowing: !!loanSummaryInformation?.borrowerCountry,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanSummaryInformationBorrowerCityState,
        value: loanSummaryInformation?.borrowerCityState || '',
        isShowing: !!loanSummaryInformation?.borrowerCityState,
        isTitle: false,
      },
      {
        label: CommonTexts.impactIntermediary,
        value: '',
        isShowing: !!impactIntermediaryDetails?.proposedOnBehalfOfaBorrower,
        isTitle: true,
      },
      {
        label: CommonTexts.impactIntermediaryName,
        value: impactIntermediaryDetails?.impactIntermediaryName || '',
        isShowing: !!impactIntermediaryDetails?.impactIntermediaryName,
        isTitle: false,
      },
      {
        label: CommonTexts.impactIntermediaryCountry,
        value: impactIntermediaryDetails?.impactIntermediaryCountry || '',
        isShowing: !!impactIntermediaryDetails?.impactIntermediaryCountry,
        isTitle: false,
      },
      {
        label: CommonTexts.impactIntermediaryBusinessExperience,
        value: impactIntermediaryDetails?.businessExperience || '',
        isShowing: !!impactIntermediaryDetails?.businessExperience,
        isTitle: false,
      },
      {
        label: CommonTexts.impactIntermediaryHistoryWithBorrower,
        value: impactIntermediaryDetails?.historyWithBorrower || '',
        isShowing: !!impactIntermediaryDetails?.historyWithBorrower,
        isTitle: false,
      },
      {
        label: CommonTexts.impactIntermediaryWebsite,
        value: impactIntermediaryDetails?.website || '',
        isShowing: !!impactIntermediaryDetails?.website,
        isTitle: false,
      },
      {
        label: CommonTexts.loanGeneralDetails,
        value: '',
        isShowing: !!borrowerDetails?.generaldescription,
        isTitle: true,
      },
      {
        label: CommonTexts.borrowerGeneralDescription,
        value: borrowerDetails?.generaldescription || '',
        isShowing: !!borrowerDetails?.generaldescription,
        isTitle: false,
      },
      {
        label: CommonTexts.borrowerDescription,
        value: borrowerDetails?.description || '',
        isShowing: !!borrowerDetails?.description,
        isTitle: false,
      },

      {
        label: CommonTexts.loanGeneralDetailsBorrowerBrief,
        value: loanGeneralDetails?.borrowerbrief || '',
        isShowing: !!loanGeneralDetails?.borrowerbrief,
        isTitle: false,
      },
      {
        label: CommonTexts.loanGeneralDetailsEmailForLenders,
        value: loanGeneralDetails?.emailforlenders || '',
        isShowing: !!loanGeneralDetails?.emailforlenders,
        isTitle: false,
      },
      {
        label: CommonTexts.borrowerWebsite,
        value: borrowerDetails?.website || '',
        isShowing: !!borrowerDetails?.website,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanImpacts,
        value: '',
        isShowing: !!loanImpacts?.description,
        isTitle: true,
      },
      {
        label: CommonTexts.LoanImpactsDescription,
        value: loanImpacts?.description || '',
        isShowing: !!loanImpacts?.description,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanImpactsBorrowerImpact,
        value: loanImpacts?.borrowerImpact || '',
        isShowing: !!loanImpacts?.borrowerImpact,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanImpactsBorrowerImpactLinks,
        value: loanImpacts?.borrowerImpactLinks || '',
        isShowing: !!loanImpacts?.borrowerImpactLinks,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanViabilityCommercialImpact,
        value: '',
        isShowing: !!loanViabilityCommercialImpact?.reasonsByBorrower,
        isTitle: true,
      },
      {
        label: CommonTexts.LoanViabilityCommercialImpactReasonsByBorrower,
        value: loanViabilityCommercialImpact?.reasonsByBorrower || '',
        isShowing: !!loanViabilityCommercialImpact?.reasonsByBorrower,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanViabilityCommercialImpactOtherFunding,
        value: loanViabilityCommercialImpact?.otherFunding || '',
        isShowing: !!loanViabilityCommercialImpact?.otherFunding,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanViabilityCommercialImpactBenefits,
        value: loanViabilityCommercialImpact?.benefits || '',
        isShowing: !!loanViabilityCommercialImpact?.benefits,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanViabilityCommercialImpactSecurities,
        value: loanViabilityCommercialImpact?.securities || '',
        isShowing: !!loanViabilityCommercialImpact?.securities,
        isTitle: false,
      },
      {
        label: CommonTexts.LoanViabilityCommercialImpactViability,
        value: loanViabilityCommercialImpact?.viability || '',
        isShowing: !!loanViabilityCommercialImpact?.viability,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.bankInformation,
        value: '',
        isShowing: !!bankAccount?.holderName,
        isTitle: true,
      },
      {
        label: InvestmentProductTexts.holderName,
        value: bankAccount?.holderName || '',
        isShowing: !!bankAccount?.holderName,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.accountType,
        value: bankAccount?.accountType || '',
        isShowing: !!bankAccount?.accountType,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.bankName,
        value: bankAccount?.bankName || '',
        isShowing: !!bankAccount?.bankName,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.bsb,
        value: bankAccount?.bsb || '',
        isShowing: !!bankAccount?.bsb,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.accountNumber,
        value: bankAccount?.accountNumber || '',
        isShowing: !!bankAccount?.accountNumber,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.achRoutingNumber,
        value: bankAccount?.achRoutingNumber || '',
        isShowing: !!bankAccount?.achRoutingNumber,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.wireRoutingNumber,
        value: bankAccount?.wireRoutingNumber || '',
        isShowing: !!bankAccount?.wireRoutingNumber,
        isTitle: false,
      },
      {
        label: CommonTexts.swiftBic,
        value: bankAccount?.swift || '',
        isShowing: !!bankAccount?.swift,
        isTitle: false,
      },
      {
        label: CommonTexts.bankNumberIBAN,
        value: bankAccount?.iban || '',
        isShowing: !!bankAccount?.iban,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.bankAddress,
        value: bankAccount?.bankAddress || '',
        isShowing: !!bankAccount?.bankAddress,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.bankAddress2,
        value: bankAccount?.bankAddress2 || '',
        isShowing: !!bankAccount?.bankAddress2,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.bankCity,
        value: bankAccount?.bankCity || '',
        isShowing: !!bankAccount?.bankCity,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.bankState,
        value: bankAccount?.bankState || '',
        isShowing: !!bankAccount?.bankState,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.bankZIP,
        value: bankAccount?.bankZIP || '',
        isShowing: !!bankAccount?.bankZIP,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.bankCountry,
        value: bankAccount?.bankCountry || '',
        isShowing: !!bankAccount?.bankCountry,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.recipientFullName,
        value: bankAccount?.recipientFullName || '',
        isShowing: !!bankAccount?.recipientFullName,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.recipientBankAddress1,
        value: bankAccount?.recipientBankAddress1 || '',
        isShowing: !!bankAccount?.recipientBankAddress1,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.recipientBankAddress2,
        value: bankAccount?.recipientBankAddress2 || '',
        isShowing: !!bankAccount?.recipientBankAddress2,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.recipientBankCity,
        value: bankAccount?.recipientBankCity || '',
        isShowing: !!bankAccount?.recipientBankCity,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.recipientState,
        value: bankAccount?.recipientState || '',
        isShowing: !!bankAccount?.recipientState,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.recipientBankZIP,
        value: bankAccount?.recipientBankZIP || '',
        isShowing: !!bankAccount?.recipientBankZIP,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.recipientCountry,
        value: bankAccount?.recipientCountry || '',
        isShowing: !!bankAccount?.recipientCountry,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.recipientEmail,
        value: bankAccount?.recipientEmail || '',
        isShowing: !!bankAccount?.recipientEmail,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.ISINCode,
        value: selectedShareClass.isin,
        isShowing: !!selectedShareClass.isin,
      },
      {
        label: InvestmentProductTexts.investmentFee,
        value: `${selectedShareClass.fees?.acquiredEntryFees}%`,
        isShowing: !!selectedShareClass.fees?.acquiredEntryFees,
      },
      {
        label: InvestmentProductTexts.annualFee,
        value: `${selectedShareClass.fees?.managementFees}%`,
        isShowing: !!selectedShareClass.fees?.managementFees,
      },
    ],
    [
      {
        label: InvestmentProductTexts.couponRate,
        value: `${
          selectedShareClass.couponRate?.rateValue
        }% ${selectedShareClass.couponRate?.rateFrequency.toLowerCase()}`,
        isShowing:
          selectedShareClass.couponRate?.rateValue &&
          selectedShareClass.couponRate?.rateFrequency,
      },
      {
        label: InvestmentProductTexts.couponPaymentFrequency,
        value: capitalizeFirstLetter(
          selectedShareClass.couponPaymentFrequency || '',
        ),
        isShowing: selectedShareClass.couponPaymentFrequency,
      },
      {
        label: InvestmentProductTexts.currency,
        value: selectedShareClass.currency,
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.maxGlobalSubscriptionAmount,
        value: currencyFormat(
          selectedShareClass.rules?.maxGlobalSubscriptionAmount,
          selectedShareClass.currency,
        ),
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.minGlobalSubscriptionAmount,
        value: currencyFormat(
          selectedShareClass.rules?.minGlobalSubscriptionAmount,
          selectedShareClass.currency,
        ),
        isShowing: true,
        isTitle: false,
      },

      {
        label: InvestmentProductTexts.maxInvestment,
        value: currencyFormat(
          selectedShareClass.rules?.maxSubscriptionAmount,
          selectedShareClass.currency,
        ),
        isShowing: !!selectedShareClass.rules?.maxSubscriptionAmount,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.minInvestment,
        value: currencyFormat(
          selectedShareClass.rules?.minSubscriptionAmount,
          selectedShareClass.currency,
        ),
        isShowing: !!selectedShareClass.rules?.minSubscriptionAmount,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.loanContributionIncrements,
        value: selectedShareClass.shareClass.loanContributionIncrements,
        isShowing: !!selectedShareClass.shareClass.loanContributionIncrements,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.pricePerUnit,
        value: currencyFormat(
          selectedShareClass.nav.value,
          selectedShareClass.currency,
        ),
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.subscriptionStartDate,
        value: startDate?.toLocaleString(),
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.subscriptionCutOffDate,
        value: cutOffDate?.toLocaleString(),
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.settlementPeriodInDays,
        value: selectedShareClass.initialSubscription.settlementPeriodInDays,
        isShowing:
          !!selectedShareClass.initialSubscription.settlementPeriodInDays,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.subscriptionValuationDate,
        value: valuationDate?.toLocaleString(),
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.subscriptionUnpaidFlagDate,
        value: unpaidFlagDate?.toLocaleString(),
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.redemptionStartDate,
        value: loanRedemptionStartDate,
        isShowing: true,
      },
      {
        label: InvestmentProductTexts.redemptionCutOffDate,
        value: loanRedemptionCutOffDate,
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.redemptionSettlementDate,
        value: loanRedemptionSettlementDate,
        isShowing: true,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.repaymentSchedule,
        value: '',
        isShowing: !!selectedShareClass.loanRepayment.schedule,
        isTitle: true,
      },
      {
        label: InvestmentProductTexts.lenderRepaymentTerms,
        value: selectedShareClass.loanRepayment.instalmentsSchedule
        ? Term.viaInstallment
        : Term.fullRepayment,
        isShowing: !!selectedShareClass.loanRepayment.terms,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.lenderRepaymentSchedule,
        value: selectedShareClass.loanRepayment.schedule,
        isShowing: !!selectedShareClass.loanRepayment.schedule,
        isTitle: false,
      },
      {
        label: InvestmentProductTexts.lenderRepaymentInstalmentSchedule,
        value: selectedShareClass.loanRepayment.instalmentsSchedule,
        isShowing: !!selectedShareClass.loanRepayment.instalmentsSchedule,
        isTitle: false,
      },
    ],
  ];

  return (
    <Card className="characteristics">
      <header>
        {intl.formatMessage(InvestmentProductTexts.assetCharacteristics)}
      </header>
      <div>
        {characteristicsValues.map((characteristicValues, index) => {
          return (
            <div key={index}>
              <ul>
                {characteristicValues.map((characteristicValue, index) => {
                  return (
                    characteristicValue.isShowing && (
                      <li key={index}>
                        <span
                          style={{
                            minWidth: '140px',
                            maxWidth: characteristicValue.isTitle
                              ? '300px'
                              : '140px',
                            fontWeight: characteristicValue.isTitle
                              ? 'bold'
                              : '',
                            color: characteristicValue.isTitle ? '#545557' : '',
                          }}>
                          {intl.formatMessage(
                            characteristicValue.label as MessageDescriptor,
                          )}
                        </span>
                        <span style={{ marginLeft: '15px' , whiteSpace: 'pre-wrap',}}>
                          {characteristicValue.value}
                        </span>
                      </li>
                    )
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ImpactBondCharacteristics;
