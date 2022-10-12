import { mdiAlertOctagon, mdiDownload } from '@mdi/js';
import { API_FETCH_POSTMAN_CREDENTIALS } from 'constants/apiRoutes';
import { colors } from 'constants/styles';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { commonActionsTexts } from 'texts/commun/actions';
import { CommonTexts } from 'texts/commun/commonTexts';
import { apiCredentialsMessages } from 'texts/routes/issuer/accountSettings';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import Button from 'uiComponents/Button';
import PageLoader from 'uiComponents/PageLoader';
import {
  constructFileUrlFromBlob,
  convertJsonToBlob,
  download,
} from 'utils/commonUtils';
import { getConfigs } from 'utils/configs';
import { DataCall } from 'utils/dataLayer';
import { SettingsContainer } from '../SettingsContainer';

const ApiCredentials: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const intl = useIntl();
  const configs = getConfigs();

  const downloadHandler = async () => {
    setIsLoading(true);
    try {
      const { postmanCredentials } = await DataCall({
        method: API_FETCH_POSTMAN_CREDENTIALS.method,
        path: API_FETCH_POSTMAN_CREDENTIALS.path(configs.auth.clientId),
      });
      const blob = convertJsonToBlob(postmanCredentials);
      const url = await constructFileUrlFromBlob(blob, 'json');
      download(url, 'apicredentials.json');
    } catch (err) {
      console.log(err);
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(CommonTexts.error),
          secondaryMessage: String(err),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <SettingsContainer
      title={intl.formatMessage(apiCredentialsMessages.codefiAssetsApi)}
      description={
        <>
          {intl.formatMessage(
            apiCredentialsMessages.codefiAssetsApiDescription,
          )}
          <br />
          <br />
          {`${intl.formatMessage(apiCredentialsMessages.apiDocumentation)}: `}
          <Link
            to={{
              pathname:
                'https://documenter.getpostman.com/view/5733481/SW7T8XSY',
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            https://documenter.getpostman.com/view/5733481/SW7T8XSY
          </Link>
        </>
      }
    >
      <p
        style={{
          fontSize: '16px',
          fontStyle: 'normal',
          fontWeight: 400,
          lineHeight: '24px',
        }}
      >
        appcredentials.json
      </p>
      <Button
        style={{
          width: 'fit-content',
        }}
        size="small"
        iconLeft={mdiDownload}
        label={intl.formatMessage(commonActionsTexts.download)}
        onClick={downloadHandler}
      />
    </SettingsContainer>
  );
};

export default ApiCredentials;
