import { API_CREATE_PRIMARY_TRADE_ORDER } from 'constants/apiRoutes';
import { colors, spacing, typography } from 'constants/styles';
import React from 'react';
import {
  AssetType,
  IDocument,
  IToken,
  IWorkflowInstance,
  OrderType,
  PrimaryTradeType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import { CLIENT_ROUTE_INVESTMENT_PRODUCT } from 'routesList';
import styled from 'styled-components';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import Button from 'uiComponents/Button';
import Checkbox from 'uiComponents/Checkbox';
import Input from 'uiComponents/Input';
import InputFile from 'uiComponents/InputFile';
import {
  AssetName,
  Form,
  FormFooter,
  FormHeading,
} from 'uiComponents/OrderForm/';
import { getProductFromToken } from 'utils/commonUtils';
import { DataCall } from 'utils/dataLayer';
import { decimalisationValue } from 'utils/currencyFormat';

import { mdiAlertOctagon, mdiArrowLeft, mdiUpload } from '@mdi/js';

import { Steps } from '../../SubscriptionOrder';
import { useIntl } from 'react-intl';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { CommonTexts } from 'texts/commun/commonTexts';
import { loanOverviewMessages } from 'texts/routes/issuer/loanOverview';
import {
  ClassData,
  PaymentOption,
} from 'routes/Issuer/AssetIssuance/assetTypes';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

const CheckboxList = styled.div`
  margin-bottom: ${spacing.tightLooser};
  p {
    margin-bottom: ${spacing.tight};
    color: ${colors.mainText};
  }
  > div {
    margin-bottom: ${spacing.tight};
  }
  label {
    font-size: 15px;
  }
`;
interface IProps {
  token: IToken;
  selectedShareClass: ClassData;
  isLoading: boolean;
  wireTransferConfirmation?: IDocument;
  setCurrentTotal: (currentTotal: number) => void;
  setIsPassingOrder: (isPassingOrder: boolean) => void;
  setCurrentStep: (currentStep: Steps) => void;
  onWireTransferConfirmationChange: (e: IDocument | undefined) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  setOrder: (order: IWorkflowInstance) => void;
}

export const SubscriptionDetails: React.FC<IProps> = ({
  token,
  selectedShareClass,
  isLoading,
  wireTransferConfirmation,
  setCurrentStep,
  setIsPassingOrder,
  setCurrentTotal,
  onWireTransferConfirmationChange,
  onSubmit,
  setOrder,
}: IProps) => {
  const { assetType } = getProductFromToken(token as IToken);
  const intl = useIntl();
  const dispatch = useDispatch();

  const minUnit = decimalisationValue(selectedShareClass.decimalisation);
  const legalAgreement = token.assetData?.asset.documents?.docusign;

  if (assetType === AssetType.SYNDICATED_LOAN) {
    return (
      <Form
        onSubmit={async (e) => {
          try {
            e.preventDefault();

            if (!selectedShareClass || !token) {
              return;
            }

            setIsPassingOrder(true);

            const { order } = await DataCall({
              method: API_CREATE_PRIMARY_TRADE_ORDER.method,
              path: API_CREATE_PRIMARY_TRADE_ORDER.path(),
              body: {
                tokenId: token.id,
                orderType: OrderType.QUANTITY,
                tradeType: PrimaryTradeType.SUBSCRIPTION,
                amount: 1,
                quantity: selectedShareClass.facilityAmount,
                assetClass: selectedShareClass.key,
                data: {
                  wireTransferConfirmation,
                },
                sendNotification: true,
              },
            });

            setOrder(order);
            setCurrentStep('confirmation');
            setIsPassingOrder(false);
          } catch (error) {
            setIsPassingOrder(false);
            EventEmitter.dispatch(
              Events.EVENT_APP_MESSAGE,
              appMessageData({
                message: intl.formatMessage(
                  SubscriptionTexts.subscriptionOrderError,
                ),
                secondaryMessage: String(error),
                icon: mdiAlertOctagon,
                color: colors.error,
                isDark: true,
              }),
            );
          }
        }}
      >
        <FormHeading>
          {intl.formatMessage(SubscriptionTexts.confirmConditionsPrecedent)}
        </FormHeading>
        <p>
          {intl.formatMessage(
            SubscriptionTexts.uploadDocsRequiredForConditions,
          )}
          <br />
          <br />
          {intl.formatMessage(
            SubscriptionTexts.referenceConditionsPrecedent,
          )}{' '}
          <span style={{ color: colors.main }}>
            {intl.formatMessage(SubscriptionTexts.loanAgreement)}
          </span>
        </p>
        <AssetName>
          <span>{token?.name}</span>
        </AssetName>
        <CheckboxList>
          <p>
            {intl.formatMessage(SubscriptionTexts.borrowerConfirmThat)}
            <span
              style={{
                color: 'red',
                fontWeight: typography.weightBold,
              }}
            >
              *
            </span>
          </p>
          <Checkbox
            required
            label={intl.formatMessage(
              SubscriptionTexts.loanAgreementExecutedCheck,
            )}
          />
          <Checkbox
            required
            label={intl.formatMessage(SubscriptionTexts.noEventCheck)}
          />
          <Checkbox
            required
            label={intl.formatMessage(SubscriptionTexts.noMaterialAdverseCheck)}
          />
          <Checkbox
            required
            label={intl.formatMessage(
              SubscriptionTexts.allDocumentationRequiredCheck,
            )}
          />
        </CheckboxList>

        <div style={{ marginBottom: spacing.regular }}>
          <span
            style={{ paddingBottom: spacing.small, display: 'inline-block' }}
          >
            {intl.formatMessage(
              SubscriptionTexts.uploadProofConditionsPrecedent,
            )}
          </span>
          <span
            style={{
              color: 'red',
              fontWeight: typography.weightBold,
            }}
          >
            *
          </span>
          <InputFile
            name="wire-transfer"
            buttonLabel={intl.formatMessage(CommonTexts.chooseFile)}
            buttonIconLeft={mdiUpload}
            buttonColor={colors.main}
            value={
              wireTransferConfirmation
                ? [
                    wireTransferConfirmation.filename,
                    wireTransferConfirmation.docId,
                  ]
                : undefined
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
          />
        </div>

        <FormFooter>
          <Button
            size="small"
            label={intl.formatMessage(CommonTexts.back)}
            iconLeft={mdiArrowLeft}
            tertiary
            href={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
              assetId: token.id,
            })}
          />
          <Button
            size="small"
            label={intl.formatMessage(CommonTexts.submit)}
            type="submit"
            isLoading={isLoading}
          />
        </FormFooter>
      </Form>
    );
  } else if (assetType === AssetType.PHYSICAL_ASSET) {
    const rules = selectedShareClass?.rules;

    const orderType = rules?.subscriptionType;
    return (
      <Form onSubmit={onSubmit}>
        <FormHeading>
          {intl.formatMessage(SubscriptionTexts.digitalisationOrder)}
        </FormHeading>

        <AssetName>
          <span>{`${token?.name} - ${token?.symbol} `}</span>
          {!selectedShareClass?.isin ? '' : ` (${selectedShareClass?.isin})`}
        </AssetName>

        <Input
          rightTag={
            orderType === OrderType.AMOUNT
              ? selectedShareClass?.currency
              : intl.formatMessage(SubscriptionTexts.grams)
          }
          type="number"
          style={{ marginBottom: spacing.small }}
          onChange={(event) =>
            setCurrentTotal(
              event.currentTarget.value
                ? parseInt(event.currentTarget.value, 10)
                : 0,
            )
          }
          label={
            orderType === OrderType.AMOUNT
              ? intl.formatMessage(CommonTexts.amount)
              : intl.formatMessage(CommonTexts.quantity)
          }
          placeholder="0"
          required
          defaultValue={
            orderType === OrderType.QUANTITY
              ? rules?.minSubscriptionQuantity || 0
              : rules?.minSubscriptionAmount || 0
          }
          min={
            orderType === OrderType.QUANTITY
              ? rules?.minSubscriptionQuantity || 0
              : rules?.minSubscriptionAmount || 0
          }
          max={
            orderType === OrderType.QUANTITY
              ? rules?.maxSubscriptionQuantity
              : rules?.maxSubscriptionAmount
          }
        />

        <div style={{ marginBottom: spacing.regular }}>
          <span>
            {intl.formatMessage(SubscriptionTexts.uploadProofOfGoldTransfer)}
          </span>
          <span
            style={{
              color: 'red',
              fontWeight: typography.weightBold,
            }}
          >
            *
          </span>
          <InputFile
            name="wire-transfer"
            buttonLabel={intl.formatMessage(CommonTexts.chooseFile)}
            buttonIconLeft={mdiUpload}
            buttonColor={colors.main}
            value={
              wireTransferConfirmation
                ? [
                    wireTransferConfirmation.filename,
                    wireTransferConfirmation.docId,
                  ]
                : undefined
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
          />
        </div>

        <Checkbox
          required
          label={intl.formatMessage(
            SubscriptionTexts.iConfirmThatInformationIsReviewed,
          )}
        />

        <FormFooter>
          <Button
            size="small"
            label={intl.formatMessage(CommonTexts.back)}
            iconLeft={mdiArrowLeft}
            tertiary
            href={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
              assetId: token.id,
            })}
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
  } else if (assetType === AssetType.CURRENCY) {
    const rules = selectedShareClass?.rules;

    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          setCurrentStep('payment');
        }}
      >
        <FormHeading>
          {intl.formatMessage(SubscriptionTexts.subscriptionOrder)}
        </FormHeading>

        <AssetName>
          <span>{`${token?.name} - ${token?.symbol}`}</span>
        </AssetName>

        <Input
          type="number"
          style={{ marginBottom: spacing.small }}
          onChange={(event) =>
            setCurrentTotal(
              event.currentTarget.value
                ? parseInt(event.currentTarget.value, 10)
                : 0,
            )
          }
          label={intl.formatMessage(CommonTexts.quantity)}
          placeholder="0"
          required
          defaultValue={rules?.minSubscriptionQuantity || 0}
          min={rules?.minSubscriptionQuantity || 0}
          max={rules?.maxSubscriptionQuantity}
        />

        <Checkbox
          required
          label={intl.formatMessage(
            SubscriptionTexts.iConfirmThatInformationIsReviewed,
          )}
        />

        <FormFooter>
          <Button
            size="small"
            label={intl.formatMessage(CommonTexts.back)}
            iconLeft={mdiArrowLeft}
            tertiary
            href={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
              assetId: token.id,
            })}
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
  } else if (assetType === AssetType.FIXED_RATE_BOND) {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          if (legalAgreement) {
            dispatch(
              setAppModal(
                appModalData({
                  title: intl.formatMessage(
                    SubscriptionTexts.signSubscriptionAgreement,
                  ),
                  confirmAction: () => {
                    window.open(legalAgreement.url);
                    setCurrentStep('docusign');
                  },
                  confirmLabel: intl.formatMessage(
                    loanOverviewMessages.continueToDocSign,
                  ),
                  confirmColor: colors.main,
                  content: (
                    <div
                      style={{
                        width: 516,
                        fontSize: '16px',
                        lineHeight: '150%',
                        color: '#4A4A4A',
                      }}
                    >
                      {intl.formatMessage(
                        SubscriptionTexts.continueToDocSignSubscriptionDesc,
                      )}
                    </div>
                  ),
                }),
              ),
            );
          } else {
            setCurrentStep('payment');
          }
        }}
      >
        <FormHeading>
          {intl.formatMessage(SubscriptionTexts.subscriptionOrder)}
        </FormHeading>

        <AssetName>
          <span>
            {`${token?.name}${
              selectedShareClass?.key === 'classic'
                ? ''
                : ` - ${selectedShareClass?.key}`
            } `}
          </span>
          {!selectedShareClass?.isin ? '' : ` (${selectedShareClass?.isin})`}
        </AssetName>

        <Input
          rightTag={selectedShareClass?.currency}
          type="number"
          onChange={(event) =>
            setCurrentTotal(
              event.currentTarget.value
                ? parseFloat(event.currentTarget.value)
                : 0,
            )
          }
          label={intl.formatMessage(CommonTexts.amount)}
          placeholder="0"
          required
          defaultValue={selectedShareClass?.rules?.minSubscriptionAmount || 0}
          min={selectedShareClass?.rules?.minSubscriptionAmount || 0}
          max={selectedShareClass?.rules?.maxSubscriptionAmount}
          step={minUnit}
        />

        <Checkbox
          required
          label={intl.formatMessage(
            SubscriptionTexts.iConfirmThatInformationIsReviewed,
          )}
        />

        <FormFooter>
          <Button
            size="small"
            label={intl.formatMessage(CommonTexts.back)}
            iconLeft={mdiArrowLeft}
            tertiary
            href={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
              assetId: token.id,
            })}
          />
          <Button
            size="small"
            label={intl.formatMessage(SubscriptionTexts.confirm)}
            type="submit"
          />
        </FormFooter>
      </Form>
    );
  }

  // case CLOSED_END_FUND | OPEN_END_FUND

  return (
    <Form
      onSubmit={(e) => {
        if (
          selectedShareClass.paymentOptions?.option ===
          PaymentOption.AT_ORDER_CREATION
        ) {
          e.preventDefault();
          if (legalAgreement) {
            dispatch(
              setAppModal(
                appModalData({
                  title: intl.formatMessage(
                    SubscriptionTexts.signSubscriptionAgreement,
                  ),
                  confirmAction: () => {
                    window.open(legalAgreement.url);
                    setCurrentStep('docusign');
                  },
                  confirmLabel: intl.formatMessage(
                    loanOverviewMessages.continueToDocSign,
                  ),
                  confirmColor: colors.main,
                  content: (
                    <div
                      style={{
                        width: 516,
                        fontSize: '16px',
                        lineHeight: '150%',
                        color: '#4A4A4A',
                      }}
                    >
                      {intl.formatMessage(
                        SubscriptionTexts.continueToDocSignSubscriptionDesc,
                      )}
                    </div>
                  ),
                }),
              ),
            );
          } else {
            setCurrentStep('payment');
          }
        } else {
          onSubmit(e);
        }
      }}
    >
      <FormHeading>
        {intl.formatMessage(SubscriptionTexts.subscriptionOrder)}
      </FormHeading>

      <AssetName>
        <span>
          {`${token?.name}${
            selectedShareClass?.key === 'classic'
              ? ''
              : ` - ${selectedShareClass?.key}`
          } `}
        </span>
        {!selectedShareClass?.isin ? '' : ` (${selectedShareClass?.isin})`}
      </AssetName>

      <Input
        rightTag={
          selectedShareClass?.rules?.subscriptionType === OrderType.AMOUNT
            ? selectedShareClass?.currency
            : intl.formatMessage(CommonTexts.shares)
        }
        type="number"
        onChange={(event) =>
          setCurrentTotal(
            event.currentTarget.value
              ? parseInt(event.currentTarget.value, 10)
              : 0,
          )
        }
        label={
          selectedShareClass?.rules?.subscriptionType === OrderType.AMOUNT
            ? intl.formatMessage(CommonTexts.amount)
            : intl.formatMessage(CommonTexts.quantity)
        }
        placeholder="0"
        required
        defaultValue={
          selectedShareClass?.rules?.subscriptionType === OrderType.QUANTITY
            ? selectedShareClass?.rules?.minSubscriptionQuantity || 0
            : selectedShareClass?.rules?.minSubscriptionAmount || 0
        }
        min={
          selectedShareClass?.rules?.subscriptionType === OrderType.QUANTITY
            ? selectedShareClass?.rules?.minSubscriptionQuantity || 0
            : selectedShareClass?.rules?.minSubscriptionAmount || 0
        }
        max={
          selectedShareClass?.rules?.subscriptionType === OrderType.QUANTITY
            ? selectedShareClass?.rules?.maxSubscriptionQuantity
            : selectedShareClass?.rules?.maxSubscriptionAmount
        }
      />

      <Checkbox
        required
        label={intl.formatMessage(
          SubscriptionTexts.iConfirmThatInformationIsReviewed,
        )}
      />

      <FormFooter>
        <Button
          size="small"
          label={intl.formatMessage(CommonTexts.back)}
          iconLeft={mdiArrowLeft}
          tertiary
          href={CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
            assetId: token.id,
          })}
        />
        {selectedShareClass.paymentOptions?.option ===
        PaymentOption.AT_ORDER_CREATION ? (
          <Button
            size="small"
            label={
              legalAgreement
                ? intl.formatMessage(
                    SubscriptionTexts.signSubscriptionAgreement,
                  )
                : intl.formatMessage(SubscriptionTexts.continueToPayment)
            }
            type="submit"
          />
        ) : (
          <Button
            size="small"
            label={intl.formatMessage(CommonTexts.placeOrder)}
            type="submit"
            isLoading={isLoading}
          />
        )}
      </FormFooter>
    </Form>
  );
};
