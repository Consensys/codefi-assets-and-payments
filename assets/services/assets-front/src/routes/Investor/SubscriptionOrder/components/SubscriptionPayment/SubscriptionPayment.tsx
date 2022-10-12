import React, { useMemo } from 'react';

import Button from 'uiComponents/Button';
import { mdiArrowLeft } from '@mdi/js';

import { currencyFormat } from 'utils/currencyFormat';

import { appModalData } from 'uiComponents/AppModal/AppModal';

import { colors, spacing, typography } from 'constants/styles';
import {
  Details,
  Form,
  FormFooter,
  FormHeading,
  PlaceOrderConfirmation,
  PlaceOrderInformation,
} from 'uiComponents/OrderForm/';
import {
  OrderType,
  IToken,
  IDocument,
  AssetType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import InputFile from 'uiComponents/InputFile';
import {
  getTokenShareClassCurrentNav,
  getProductFromToken,
  getTokenCurrency,
} from 'utils/commonUtils';
import { Link } from 'react-router-dom';
import { Steps } from '../../SubscriptionOrder';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import CalculateFees from '../../../../common/HelperFees/HelperFees';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import BankInformationView from '../../../InvestmentProduct/components/BankInformationView';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';

export type PaymentMean = 'metaMask' | 'creditCard' | 'wireTransfer';

interface IProps {
  token: IToken;
  selectedShareClass: ClassData;
  currentTotal: number;
  isLoading: boolean;
  assetWalletChain?: string;
  assetWalletAddress?: string;
  assetWalletCryptoCurrency?: string;
  investorFee?: number;
  setCurrentStep: (currentStep: Steps) => void;
  wireTransferConfirmation?: IDocument;
  onWireTransferConfirmationChange: (e: IDocument | undefined) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const SubscriptionPayment: React.FC<IProps> = ({
  token,
  selectedShareClass,
  currentTotal,
  assetWalletChain,
  assetWalletAddress,
  assetWalletCryptoCurrency,
  isLoading,
  investorFee,
  setCurrentStep,
  wireTransferConfirmation,
  onWireTransferConfirmationChange,
  onSubmit,
}: IProps) => {
  const { assetType, bankAccount, bankInformation } = getProductFromToken(
    token as IToken,
  );
  const intl = useIntl();
  const dispatch = useDispatch();
  const frbInputFile = useMemo(
    () => (
      <InputFile
        name="wire-transfer"
        buttonLabel={intl.formatMessage(
          SubscriptionTexts.uploadWireTransferConfirmation,
        )}
        buttonColor={colors.main}
        value={
          wireTransferConfirmation && [
            wireTransferConfirmation.filename,
            wireTransferConfirmation.docId,
          ]
        }
        onChange={async (newValue) => {
          onWireTransferConfirmationChange(
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
    ),
    [intl, onWireTransferConfirmationChange, wireTransferConfirmation],
  );

  const totalAmountNoFees =
    assetType === AssetType.FIXED_RATE_BOND
      ? currentTotal
      : selectedShareClass?.rules?.subscriptionType === OrderType.AMOUNT
      ? currentTotal
      : currentTotal * getTokenShareClassCurrentNav(token as IToken);

  const { totalWithCustomFees } = CalculateFees(
    selectedShareClass,
    investorFee,
    totalAmountNoFees,
  );

  return (
    <Form
      onSubmit={
        assetType === AssetType.FIXED_RATE_BOND
          ? (e) => {
              e.preventDefault();
              dispatch(
                setAppModal(
                  appModalData({
                    title: intl.formatMessage(CommonTexts.placeOrder),
                    confirmAction: () => onSubmit(e),
                    confirmLabel: intl.formatMessage(CommonTexts.placeOrder),
                    confirmColor: colors.main,
                    content: (
                      <>
                        <PlaceOrderConfirmation>
                          {intl.formatMessage(
                            SubscriptionTexts.placeOrderConfirmation,
                          )}
                        </PlaceOrderConfirmation>
                        <PlaceOrderInformation>
                          {intl.formatMessage(
                            SubscriptionTexts.placeOrderInformation,
                          )}
                        </PlaceOrderInformation>
                      </>
                    ),
                  }),
                ),
              );
            }
          : onSubmit
      }
    >
      <FormHeading>{intl.formatMessage(CommonTexts.payment)}</FormHeading>

      <Details>
        {assetType !== AssetType.FIXED_RATE_BOND && (
          <p>
            {intl.formatMessage(SubscriptionTexts.toPayInitiateWireTransfer)}
          </p>
        )}
        <h3>{intl.formatMessage(CommonTexts.transferDetails)}</h3>
        {bankInformation && (
          <BankInformationView bankInformation={bankInformation} />
        )}
        {bankAccount.bankName && (
          <li>
            <span>{intl.formatMessage(CommonTexts.bankName)}</span>
            <span>{bankAccount.bankName}</span>
          </li>
        )}
        {bankAccount.iban && (
          <li>
            <span>{intl.formatMessage(CommonTexts.accountNumberIBAN)}</span>
            <span>{bankAccount.iban}</span>
          </li>
        )}
        {bankAccount.swift && (
          <li>
            <span>{intl.formatMessage(CommonTexts.swiftBic)}</span>
            <span>{bankAccount.swift}</span>
          </li>
        )}
        {bankAccount.holderName && (
          <li>
            <span>{intl.formatMessage(CommonTexts.holderName)}</span>
            <span>{bankAccount.holderName}</span>
          </li>
        )}
        {(assetWalletChain ||
          assetWalletAddress ||
          assetWalletCryptoCurrency) && (
          <li>
            <span>
              {intl.formatMessage(CommonTexts.assetWalletInfoSeparator)}
            </span>
          </li>
        )}
        {assetWalletChain && (
          <li>
            <span>{intl.formatMessage(CommonTexts.assetWalletChain)}</span>
            <span>{assetWalletChain}</span>
          </li>
        )}
        {assetWalletCryptoCurrency && (
          <li>
            <span>
              {intl.formatMessage(CommonTexts.assetWalletCryptoCurrency)}
            </span>
            <span>{assetWalletCryptoCurrency}</span>
          </li>
        )}
        {assetWalletAddress && (
          <li>
            <span>{intl.formatMessage(CommonTexts.assetWalletAddress)}</span>
            <span>{assetWalletAddress}</span>
          </li>
        )}
        <li>
          <span>{intl.formatMessage(CommonTexts.totalToTransfer)}</span>
          <span>
            {currencyFormat(
              totalWithCustomFees,
              getTokenCurrency(token as IToken),
              undefined,
              2,
            )}
          </span>
        </li>

        <footer>
          {assetType === AssetType.FIXED_RATE_BOND ? (
            frbInputFile
          ) : (
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
                                  )}{' '}
                                </li>
                              </ul>
                            </div>
                          ),
                        }),
                      ),
                    );
                  }}
                >
                  {intl.formatMessage(CommonTexts.seeAcceptedDocumentsTypes)}
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
              required
              onChange={async (newValue) => {
                onWireTransferConfirmationChange(
                  newValue.length === 2
                    ? {
                        filename: newValue[0],
                        docId: newValue[1],
                      }
                    : undefined,
                );
              }}
            />
          )}
        </footer>
      </Details>

      <FormFooter>
        <Button
          size="small"
          label={intl.formatMessage(CommonTexts.back)}
          iconLeft={mdiArrowLeft}
          tertiary
          onClick={() => setCurrentStep('details')}
        />
        <Button
          size="small"
          label={intl.formatMessage(CommonTexts.placeOrder)}
          type="submit"
          isLoading={isLoading}
        />
      </FormFooter>
    </Form>
  );
};
