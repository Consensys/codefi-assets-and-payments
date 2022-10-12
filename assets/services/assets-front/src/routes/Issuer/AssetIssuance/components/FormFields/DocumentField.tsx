import React, { FC } from 'react';
import CSS from 'csstype';
import clsx from 'clsx';
import { IntlShape, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import i18n from 'utils/i18n';
import { spacing, colors } from 'constants/styles';
import InputFile from 'uiComponents/InputFile';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { IIssuanceElement } from '../../insuanceDataType';
import { ElementStatus } from '../../elementsTypes';
import store from 'features/app.store';
import { setAppModal } from 'features/user/user.store';

const getFileAccept = (accept: string | undefined) => {
  switch (accept) {
    case 'pdf':
      return '.pdf';
    case 'image':
      return '.png,.jpg,jpeg,.JPG,.JPEG';
    default:
      return undefined;
  }
};

const getElementSubLabel = (
  element: IIssuanceElement,
  intl: IntlShape,
): string | React.ReactNode => {
  const { dispatch } = store;
  let sublabel;
  if (element.sublabel) {
    if (element.map === 'asset_images_banner') {
      sublabel = (
        <>
          {i18n(intl.locale, element.sublabel)}{' '}
          <Link
            to="#"
            style={{ color: colors.main }}
            onClick={() => {
              dispatch(
                setAppModal(
                  appModalData({
                    closeIcon: true,
                    noPadding: true,
                    title: intl.formatMessage(
                      assetIssuanceMessages.exampleBannerImage,
                    ),
                    content: (
                      <div
                        style={{
                          width: 777,
                          paddingTop: spacing.regular,
                        }}
                      >
                        <img
                          alt="asset-banner"
                          src="/asset_banner.png"
                          style={{
                            display: 'block',
                            margin: 'auto',
                            width: 713,
                          }}
                        />
                      </div>
                    ),
                  }),
                ),
              );
            }}
          >
            {intl.formatMessage(assetIssuanceMessages.seeExample)}
          </Link>
        </>
      );
    } else if (element.map === 'asset_images_cover') {
      sublabel = (
        <>
          {i18n(intl.locale, element.sublabel)}{' '}
          <Link
            to="#"
            style={{ color: colors.main }}
            onClick={() => {
              dispatch(
                setAppModal(
                  appModalData({
                    closeIcon: true,
                    noPadding: true,
                    title: intl.formatMessage(
                      assetIssuanceMessages.exampleCardBackgroundImage,
                    ),
                    content: (
                      <div
                        style={{
                          width: 700,
                        }}
                      >
                        <img
                          alt="asset-background"
                          src="/asset_background.png"
                          style={{
                            display: 'block',
                            margin: 'auto',
                            width: 353,
                          }}
                        />
                      </div>
                    ),
                  }),
                ),
              );
            }}
          >
            {intl.formatMessage(assetIssuanceMessages.seeExample)}
          </Link>
        </>
      );
    } else {
      sublabel = i18n(intl.locale, element.sublabel);
    }
    return sublabel;
  }
};

interface IProps {
  element: IIssuanceElement;
  reviewMode: boolean;
  style?: CSS.Properties;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}

export const DocumentField: FC<IProps> = ({
  element,
  reviewMode,
  style,
  onUpdateData,
}: IProps) => {
  const intl = useIntl();

  const sublabel = getElementSubLabel(element, intl);
  const required =
    element.status === ElementStatus.mandatory ||
    element.status === ElementStatus.conditionalMandatory;

  return (
    <div
      className={clsx('_route_issuer_assetIssuance_formField', {
        [`size_${element.size}`]: element.size,
        fillLine: element.fillLine,
      })}
      style={style}
    >
      <InputFile
        name={element.key}
        label={i18n(intl.locale, element.label)}
        sublabel={sublabel}
        disabled={reviewMode}
        aspect={element.map === 'asset_images_banner' ? 3 / 1 : undefined}
        multiline={element.multiline}
        accept={getFileAccept(element.fileAccept)}
        required={required}
        isImage={element.fileAccept === 'image' && !required}
        value={element.data}
        onChange={(newValue) => onUpdateData(element.key, newValue)}
      />
    </div>
  );
};
