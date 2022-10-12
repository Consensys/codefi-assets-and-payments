import React, { useState } from 'react';

import { colors } from 'constants/styles';
import { ShareClassesList } from 'uiComponents/ShareClassesList';
import InputFile from 'uiComponents/InputFile';

import './FundInformationsReview.scss';
import { IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { getAssetType, getProductFromToken } from 'utils/commonUtils';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { Document } from 'routes/Issuer/AssetIssuance/assetTypes';
import { useEffect } from 'react';

interface IProps {
  token: IToken;
}

interface IFundData {
  title: string;
  elements: Array<{
    title: string;
    value?: React.ReactNode;
    file?: string;
    fileName?: string;
    image?: Document;
  }>;
}

interface IState {
  fundData: Array<IFundData>;
}

const FundInformationsReviewClass: React.FC<IProps & WrappedComponentProps> = ({
  token,
  intl,
}) => {
  const [state, setState] = useState<IState>({
    fundData: [],
  });
  useEffect(() => {
    const {
      assetType,
      assetProspectus,
      description,
      bankAccount,
      assetBanner,
    } = getProductFromToken(token);
    const notSet = (
      <span style={{ color: colors.errorDark }}>
        {intl.formatMessage(CommonTexts.notSet)}
      </span>
    );

    const fundData: Array<IFundData> = [
      {
        title: intl.formatMessage(CommonTexts.general),
        elements: [
          {
            title: intl.formatMessage(CommonTexts.assetType),
            value: assetType ? getAssetType(assetType) : notSet,
          },
          {
            title: intl.formatMessage(CommonTexts.assetSymbol),
            value: token.symbol || notSet,
          },
          {
            title: intl.formatMessage(CommonTexts.assetDesc),
            value: description || notSet,
          },
        ],
      },
      {
        title: intl.formatMessage(CommonTexts.bankInformation),
        elements: [
          {
            title: intl.formatMessage(CommonTexts.bankName),
            value: bankAccount.bankName || notSet,
          },
          {
            title: intl.formatMessage(CommonTexts.IBAN),
            value: bankAccount.iban || notSet,
          },
          {
            title: intl.formatMessage(CommonTexts.swiftBic),
            value: bankAccount.swift || notSet,
          },
        ],
      },
      {
        title: intl.formatMessage(CommonTexts.assetProspectus),
        elements: [
          {
            title: intl.formatMessage(CommonTexts.assetProspectus),
            file: assetProspectus.key,
          },
        ],
      },
      {
        title: intl.formatMessage(CommonTexts.assetCoverImage),
        elements: [
          {
            title: intl.formatMessage(CommonTexts.assetCoverImage),
            image: assetBanner,
          },
        ],
      },
    ];
    setState((s) => ({ ...s, fundData }));
  }, []);

  const { shareClasses } = getProductFromToken(token);
  return (
    <div className="_uiComponent_fundInformationsReview">
      <h2>{intl.formatMessage(CommonTexts.assetInformation)}</h2>

      {state.fundData.map((section) => (
        <React.Fragment key={section.title}>
          <h3>{section.title}</h3>

          {section.elements.map((item) => (
            <React.Fragment key={item.title}>
              <h4>{item.title}</h4>
              {item.value && <p className="value">{item.value}</p>}
              {item.file && (
                <InputFile disabled value={item.file as unknown as string[]} />
              )}
              {item.image && (
                <InputFile disabled value={[item.image.name, item.image.key]} />
              )}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}

      {shareClasses.length > 1 && (
        <>
          <h2 className="shareClasses">
            {intl.formatMessage(CommonTexts.shareClasses)}
          </h2>

          <ShareClassesList shareClasses={shareClasses} />
        </>
      )}
    </div>
  );
};

export const FundInformationsReview = injectIntl(FundInformationsReviewClass);
