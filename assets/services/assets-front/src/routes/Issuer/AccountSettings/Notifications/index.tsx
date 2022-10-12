import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import { ColorPicker } from 'uiComponents/ColorPicker/ColorPicker';
import { getConfig } from 'utils/configUtils';
import Input from 'uiComponents/Input';
import { interfaceConfigurationMessages } from 'texts/routes/issuer/accountSettings';
import { AccountSettingsProviderContext } from '../provider';

export const Notifications: React.FC = () => {
  const intl = useIntl();

  const config = getConfig();
  const [state, setState] = useState({
    isLoading: false,
    hasLoadingError: false,
    mailLogo: config.mailColor,
    mailColor: config.mailColor || config.mainColor,
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        margin: '-32px -40px',
        height: '100%',
      }}
    >
      <AccountSettingsProviderContext.Consumer>
        {({ theme, setTheme }: any) => {
          return (
            <>
              <div
                style={{
                  width: '300px',
                  padding: 40,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      marginBottom: '5px',
                    }}
                  >
                    {intl.formatMessage(
                      interfaceConfigurationMessages.emailLogoLabel,
                    )}
                  </div>
                  <div>
                    <Input
                      defaultValue={state.mailLogo}
                      onChange={(e, v) => {
                        setState((s) => ({ ...s, mailLogo: v || '' }));
                        setTheme((theme: any) => ({
                          ...theme,
                          mailLogo: v,
                        }));
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 32 }}>
                  <ColorPicker
                    label={intl.formatMessage(
                      interfaceConfigurationMessages.primaryColor,
                    )}
                    color={state.mailColor}
                    parentCallback={(mailColor: string) => {
                      setState((s) => ({ ...s, mailColor }));
                      setTheme((theme: any) => ({
                        ...theme,
                        mailColor,
                      }));
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  width: '100%',
                  background: '#F8F8F9',
                  padding: 40,
                }}
              >
                <div
                  style={{
                    maxWidth: 600,
                    background: '#ffffff',
                    padding: 40,
                    display: 'flex',
                    flexDirection: 'column',
                    margin: 'auto',
                    color: 'rgb(94, 105, 119)',
                    fontSize: '14px',
                    lineHeight: 2,
                  }}
                >
                  {state.mailLogo && (
                    <div>
                      <img
                        alt="logo"
                        src={state.mailLogo}
                        style={{
                          width: 'auto',
                          height: 'auto',
                          maxHeight: 80,
                          marginBottom: 32,
                        }}
                      />
                    </div>
                  )}
                  <span
                    style={{
                      marginBottom: 12,
                    }}
                  >
                    Dear Alex,
                  </span>
                  <p>
                    Example Co. has requested payment be made for Seller Co.
                    sell order to sell 1,000 ASI Global Index shares for
                    $310,150. Please view the order and complete payment.
                  </p>
                  <button
                    style={{
                      color: 'white',
                      background: state.mailColor,
                      border: 'none',
                      height: 48,
                      fontWeight: 700,
                    }}
                  >
                    REVIEW INFORMATION
                  </button>
                </div>
              </div>
            </>
          );
        }}
      </AccountSettingsProviderContext.Consumer>
    </div>
  );
};
