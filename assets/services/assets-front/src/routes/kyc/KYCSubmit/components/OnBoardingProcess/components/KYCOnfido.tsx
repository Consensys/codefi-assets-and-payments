import React, { useEffect } from 'react';
import * as Onfido from 'onfido-sdk-ui';
import { IKYCSectionElement } from 'types/KYCSectionElement';
import PageLoader from 'uiComponents/PageLoader';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { KYCOnfidoTexts } from 'texts/routes/kyc/KYCSubmit';
import { useCallback } from 'react';

interface IProps extends WrappedComponentProps {
  item: IKYCSectionElement;
  saveElement?: (name: string, values: Array<string>) => void;
  templateName: string;
}

let counter = 0;

const KYCOnfidoClass: React.FC<IProps> = ({
  intl,
  item,
  templateName,
  saveElement,
}) => {
  const initOnfidoComponent = useCallback(async () => {
    const jwtToken = item?.elementInstance?.data?.jwtToken;
    if (jwtToken) {
      Onfido.init({
        token: jwtToken,
        containerId: 'onfido-mount',
        steps: [
          {
            type: 'welcome',
            options: {
              title: intl.formatMessage(KYCOnfidoTexts.verifyTitle, {
                templateName: templateName,
              }),
              descriptions: [
                intl.formatMessage(KYCOnfidoTexts.verifyDescription, {
                  templateName: templateName,
                }),
              ],
              nextButton: intl.formatMessage(KYCOnfidoTexts.verifyIdentity),
            },
          },
          {
            type: 'document',
            options: {
              documentTypes: {
                passport: true,
                driving_licence: true, // eslint-disable-line
                national_identity_card: true, // eslint-disable-line
              },
              forceCrossDevice: false,
              useLiveDocumentCapture: false,
            },
          },
          'face',
          'complete',
        ],
      });
    } else if (counter < 3) {
      if (saveElement) {
        counter += 1;
        saveElement(item.element.key, [getRandomString()]);
        await initOnfidoComponent();
      }
    }
  }, [intl, item, saveElement, templateName]);

  useEffect(() => {
    initOnfidoComponent();
  }, [initOnfidoComponent]);

  const getRandomString = () => {
    return Math.random().toString(36).substring(7);
  };

  const jwtToken = item?.elementInstance?.data?.jwtToken;
  if (!jwtToken) {
    if (counter < 3) {
      return <PageLoader />;
    } else {
      return (
        <div>
          {intl.formatMessage(KYCOnfidoTexts.onfidoLoadError, {
            onfidoError: item?.elementInstance?.data?.onfidoError,
          })}
        </div>
      );
    }
  } else {
    return <div id="onfido-mount"></div>;
  }
};

export const KYCOnfido = injectIntl(KYCOnfidoClass);
