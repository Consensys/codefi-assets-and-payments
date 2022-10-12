import React, { useState } from 'react';
import { IntlShape, useIntl } from 'react-intl';
import { Upload } from 'antd';

import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import { ColorPicker } from 'uiComponents/ColorPicker/ColorPicker';
import { getConfig } from 'utils/configUtils';
import FakeApp from 'uiComponents/FakeApp';
import Button from 'uiComponents/Button';
import { interfaceConfigurationMessages } from 'texts/routes/issuer/accountSettings';
import { AccountSettingsProviderContext } from '../provider';
interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  largeLogoBase64: string;
  smallLogoBase64: string;
  faviconBase64: string;
  colorMain: string;
  colorSidebarText: string;
  colorSidebarTextHover: string;
  colorSidebarBackground: string;
  colorSidebarBackgroundHover: string;
}

const getBase64 = async (
  file: File,
  callback: (result: string | ArrayBuffer | null) => void,
) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    callback(reader.result);
  };
  reader.onerror = function (error) {
    console.log('Error: ', error);
  };
};

const uploadButton = (
  label: string,
  message: string,
  intl: IntlShape,
  callback: (res: string) => void,
): JSX.Element => {
  return (
    <div
      style={{
        marginTop: '10px',
        marginBottom: '10px',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '5px',
        }}
      >
        {label}
      </div>
      <div>
        <Upload
          showUploadList={false}
          customRequest={async (options: any) => {
            getBase64(options.file, (result) => {
              callback(result as string);
            });
          }}
        >
          <Button
            style={{
              fontSize: '14px',
              fontWeight: 600,
              height: '36px',
              width: '113px',
            }}
            label={intl.formatMessage(
              interfaceConfigurationMessages.uploadLogoAction,
            )}
            color={'#1D1D1E'}
            secondary
          />
        </Upload>
      </div>
    </div>
  );
};

export const InterfaceConfiguration: React.FC = () => {
  const intl = useIntl();
  const config = getConfig();
  const [state, setState] = useState<IState>({
    isLoading: false,
    hasLoadingError: false,
    largeLogoBase64: config.logo,
    smallLogoBase64: config.LOGO_WITHOUT_LABEL,
    faviconBase64: config.FAVICON,
    colorMain: config.mainColor,
    colorSidebarText: config.SIDEBAR_TEXT,
    colorSidebarTextHover: config.SIDEBAR_TEXT_HOVER,
    colorSidebarBackground: config.SIDEBAR_BACKGROUND,
    colorSidebarBackgroundHover: config.SIDEBAR_BACKGROUND_HOVER,
  });

  if (state.isLoading) {
    return (
      <div>
        <PageLoader />
      </div>
    );
  }

  if (state.hasLoadingError) {
    return (
      <div>
        <PageError />
      </div>
    );
  }

  return (
    <AccountSettingsProviderContext.Consumer>
      {({ theme, setTheme }: any) => {
        return (
          <menu
            style={{
              display: 'flex',
              flexDirection: 'row',
              height: '100%',
              marginTop: '-32px',
            }}
          >
            <div
              style={{
                maxWidth: '300px',
              }}
            >
              <div
                style={{
                  marginTop: '20px',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                {intl.formatMessage(interfaceConfigurationMessages.general)}
              </div>
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {intl.formatMessage(interfaceConfigurationMessages.logos)}
              </div>
              <div>
                {uploadButton(
                  intl.formatMessage(
                    interfaceConfigurationMessages.companyLogoLargeLabel,
                  ),
                  intl.formatMessage(
                    interfaceConfigurationMessages.companyLogoLargeMessage,
                  ),
                  intl,
                  (largeLogoBase64: string) => {
                    setState((s) => ({ ...s, largeLogoBase64 }));
                    setTheme((theme: any) => ({
                      ...theme,
                      largeLogoBase64,
                    }));
                  },
                )}
              </div>
              <div>
                {uploadButton(
                  intl.formatMessage(
                    interfaceConfigurationMessages.companyLogoSmallLabel,
                  ),
                  intl.formatMessage(
                    interfaceConfigurationMessages.companyLogoSmallMessage,
                  ),
                  intl,
                  (smallLogoBase64: string) => {
                    setState((s) => ({ ...s, smallLogoBase64 }));
                    setTheme((theme: any) => ({
                      ...theme,
                      smallLogoBase64,
                    }));
                  },
                )}
              </div>
              <div>
                {uploadButton(
                  intl.formatMessage(
                    interfaceConfigurationMessages.faviconLabel,
                  ),
                  intl.formatMessage(
                    interfaceConfigurationMessages.faviconMessage,
                  ),
                  intl,
                  (faviconBase64: string) => {
                    setState((s) => ({ ...s, faviconBase64 }));
                    setTheme((theme: any) => ({
                      ...theme,
                      faviconBase64,
                    }));
                  },
                )}
              </div>
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {intl.formatMessage(interfaceConfigurationMessages.colors)}
              </div>
              <ColorPicker
                label={intl.formatMessage(
                  interfaceConfigurationMessages.primaryColor,
                )}
                color={state.colorMain}
                parentCallback={(color: string) => {
                  setState((s) => ({ ...s, colorMain: color }));
                  setTheme((theme: any) => ({
                    ...theme,
                    colorMain: color,
                  }));
                }}
              />
              <div
                style={{
                  marginTop: '20px',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                {intl.formatMessage(interfaceConfigurationMessages.sidebar)}
              </div>
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {intl.formatMessage(interfaceConfigurationMessages.general)}
              </div>
              <ColorPicker
                label={intl.formatMessage(
                  interfaceConfigurationMessages.linkColor,
                )}
                color={config.SIDEBAR_TEXT}
                parentCallback={(color: string) => {
                  setState((s) => ({ ...s, colorSidebarText: color }));
                  setTheme((theme: any) => ({
                    ...theme,
                    colorSidebarText: color,
                  }));
                }}
              />
              <ColorPicker
                label={intl.formatMessage(
                  interfaceConfigurationMessages.backgroundColor,
                )}
                color={config.SIDEBAR_BACKGROUND}
                parentCallback={(color: string) => {
                  setState((s) => ({ ...s, colorSidebarBackground: color }));
                  setTheme((theme: any) => ({
                    ...theme,
                    colorSidebarBackground: color,
                  }));
                }}
              />
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {intl.formatMessage(interfaceConfigurationMessages.hoverActive)}
              </div>
              <ColorPicker
                label={intl.formatMessage(
                  interfaceConfigurationMessages.linkColor,
                )}
                color={config.SIDEBAR_TEXT_HOVER}
                parentCallback={(color: string) => {
                  setState((s) => ({ ...s, colorSidebarTextHover: color }));
                  setTheme((theme: any) => ({
                    ...theme,
                    colorSidebarTextHover: color,
                  }));
                }}
              />
              <ColorPicker
                label={intl.formatMessage(
                  interfaceConfigurationMessages.backgroundColor,
                )}
                color={config.SIDEBAR_BACKGROUND_HOVER}
                parentCallback={(color: string) => {
                  setState((s) => ({
                    ...s,
                    colorSidebarBackgroundHover: color,
                  }));
                  setTheme((theme: any) => ({
                    ...theme,
                    colorSidebarBackgroundHover: color,
                  }));
                }}
              />
            </div>
            <div
              style={{
                background: '#F5F5F5',
                width: '100%',
                paddingTop: 64,
              }}
            >
              <FakeApp
                largeLogoBase64={state.largeLogoBase64}
                smallLogoBase64={state.smallLogoBase64}
                faviconBase64={state.faviconBase64}
                colorMain={state.colorMain}
                colorSidebarText={state.colorSidebarText}
                colorSidebarTextHover={state.colorSidebarTextHover}
                colorSidebarBackground={state.colorSidebarBackground}
                colorSidebarBackgroundHover={state.colorSidebarBackgroundHover}
              />
            </div>
          </menu>
        );
      }}
    </AccountSettingsProviderContext.Consumer>
  );
};
