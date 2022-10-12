import { spacing } from 'constants/styles';
import React from 'react';
import { useIntl } from 'react-intl';
import { getStatus } from 'routes/Investor/SubscriptionSummary/SubscriptionSummary';
import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';
import {
  AssetType,
  IToken,
  IWorkflowInstance,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import styled from 'styled-components';
import Button from 'uiComponents/Button';
import InputFile from 'uiComponents/InputFile';
import {
  AssetData,
  AssetStatus,
  OrderSummary,
  OrderTotal,
} from 'uiComponents/OrderSummary';
import Preview from 'uiComponents/Preview';
import { IUser } from 'User';
import {
  constructCofidocsFileUrl,
  getLoanDataFromToken,
  getOrderType,
  getClientName,
  getWorkflowInstanceStatusStyle,
} from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';

const StyledList = styled.ul`
  margin-top: -${spacing.xs};
  &&& > li {
    border-bottom: none;
    line-height: 1.25;
    list-style: disc;
    display: list-item;
    margin-left: ${spacing.tight};
  }
`;

interface IProps {
  token: IToken;
  facility: ClassData;
  order?: IWorkflowInstance;
  assetHref: string;
  wireTransferConfirmation?: {
    filename: string;
    docId: string;
  };
  investorFee?: number;
  isIssuerSide: boolean;
}

export const SyndicatedLoanConditionsPrecedentOverview = ({
  token,
  facility,
  order,
  assetHref,
  wireTransferConfirmation,
  isIssuerSide,
}: IProps) => {
  const intl = useIntl();
  const { currency, underwriter, issuer, borrower } =
    getLoanDataFromToken(token);
  return (
    <>
      <OrderSummary>
        <OrderTotal>
          <p>{currencyFormat(facility.facilityAmount, currency)}</p>
        </OrderTotal>
        <AssetData>
          {order && (
            <AssetStatus>
              <span>Status</span>
              <div
                style={{
                  padding: '2px 8px',
                  fontSize: 12,
                  borderRadius: 4,
                  marginTop: '10px',
                  ...getWorkflowInstanceStatusStyle(order, true),
                }}
              >
                {getStatus(intl, order, true, AssetType.SYNDICATED_LOAN)}
              </div>
            </AssetStatus>
          )}
          <div>
            <span>Asset</span>
            <div>
              {`${token.name} `}
              <Button
                label="View Loan"
                tertiary
                size="small"
                style={{ padding: '0 0 0 16px', fontWeight: 400 }}
                href={assetHref}
              />
            </div>
          </div>
        </AssetData>
      </OrderSummary>

      {wireTransferConfirmation && (
        <>
          <OrderSummary>
            <h2>Documents</h2>
            <ul>
              <li style={{ marginTop: '-24px' }}>
                <Preview
                  url={constructCofidocsFileUrl(wireTransferConfirmation.docId)}
                  filename={wireTransferConfirmation.filename}
                  label="Conditions Precedent Documentation"
                />
                <InputFile
                  style={{ margin: '-10px' }}
                  value={[
                    wireTransferConfirmation.filename,
                    wireTransferConfirmation.docId,
                  ]}
                  downloadable
                  preview={false}
                />
              </li>
            </ul>
          </OrderSummary>
          <OrderSummary>
            <h2>Conditions Precedent</h2>
            <StyledList>
              <li>The Loan Agreement has been executed.</li>
              <li>
                No Event of Default is continuing or might reasonably be
                expected to result from the making of any Utilisation.
              </li>
              <li>
                There has been no material adverse change in its business or
                financial condition since the most recent financial statements
                were delivered.
              </li>
              <li>
                All the documentation required as part of Schedule II -
                Conditions Precedent To Initial Utilisation of the Loan
                Agreement is hereby submitted to the Facility Agent.
              </li>
            </StyledList>
          </OrderSummary>
        </>
      )}

      <OrderSummary>
        <h2>Details</h2>
        <ul>
          <li>
            <span>Type</span>
            <span>{getOrderType(AssetType.SYNDICATED_LOAN, order)}</span>
          </li>
          <li>
            <span>Total loan tokens to issue</span>
            <span>{currencyFormat(facility.facilityAmount, currency)}</span>
          </li>
          <li key={facility.name}>
            <span>Facility {facility.name}</span>
            <span>{currencyFormat(facility.facilityAmount, currency)}</span>
          </li>
          <li>
            <span>Borrower</span>
            <span>{getClientName(borrower as IUser)}</span>
          </li>
          <li>
            <span>Lead arranger</span>
            <span>{getClientName(underwriter as IUser)}</span>
          </li>
          {!isIssuerSide && (
            <li>
              <span>Facility agent</span>
              <span>{getClientName(issuer as IUser)}</span>
            </li>
          )}
        </ul>
      </OrderSummary>
    </>
  );
};
