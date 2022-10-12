import React from 'react';
import { useIntl } from 'react-intl';
import { CommonTexts } from '../../../../texts/commun/commonTexts';
import { BankInformation } from '../../../Issuer/AssetIssuance/assetTypes';
const BankInformationView = ({
  bankInformation,
}: {
  bankInformation: BankInformation;
}) => {
  const intl = useIntl();

  return (
    <>
      {bankInformation.country && (
        <li>
          <span>{intl.formatMessage(CommonTexts.country)}</span>
          <span>{bankInformation.country}</span>
        </li>
      )}
      {bankInformation.currency && bankInformation.currencyCode && (
        <li>
          <span>{intl.formatMessage(CommonTexts.currency)}</span>
          <span>{`${bankInformation.currency}-${bankInformation.currencyCode}`}</span>
        </li>
      )}
      {bankInformation.accountNumber && (
        <li>
          <span>{intl.formatMessage(CommonTexts.accountNumber)}</span>
          <span>{bankInformation.accountNumber}</span>
        </li>
      )}
      {bankInformation.iban && (
        <li>
          <span>{intl.formatMessage(CommonTexts.IBAN)}</span>
          <span>{bankInformation.iban}</span>
        </li>
      )}
      {bankInformation.institutionNumber && (
        <li>
          <span>{intl.formatMessage(CommonTexts.institutionNumber)}</span>
          <span>{bankInformation.institutionNumber}</span>
        </li>
      )}
      {bankInformation.recipientName && (
        <li>
          <span>{intl.formatMessage(CommonTexts.recipientName)}</span>
          <span>{bankInformation.recipientName}</span>
        </li>
      )}
      {bankInformation.routingNumber && (
        <li>
          <span>{intl.formatMessage(CommonTexts.routingNumber)}</span>
          <span>{bankInformation.routingNumber}</span>
        </li>
      )}
      {bankInformation.sortCode && (
        <li>
          <span>{intl.formatMessage(CommonTexts.sortCode)}</span>
          <span>{bankInformation.sortCode}</span>
        </li>
      )}
      {bankInformation.transitNumber && (
        <li>
          <span>{intl.formatMessage(CommonTexts.transitNumber)}</span>
          <span>{bankInformation.transitNumber}</span>
        </li>
      )}
    </>
  );
};

export default BankInformationView;
