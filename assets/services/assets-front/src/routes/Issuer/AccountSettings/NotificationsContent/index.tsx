import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Upload } from 'antd';

import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import Loader from 'uiComponents/Loader';
import Button from 'uiComponents/Button';
import { commonActionsTexts } from 'texts/commun/actions';
import {
  mdiAlertOctagon,
  mdiCheckCircle,
  mdiDownload,
  mdiUpload,
} from '@mdi/js';
import { DataCall } from 'utils/dataLayer';
import {
  API_FETCH_MAIL_TEMPLATES,
  API_UPSERT_MAIL_TEMPLATES,
} from 'constants/apiRoutes';
import {
  constructFileUrlFromBlob,
  convertJsonToBlob,
  download,
} from 'utils/commonUtils';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { CommonTexts } from 'texts/commun/commonTexts';
import { colors } from 'constants/styles';
import { platformNotificationsMessages } from 'texts/routes/issuer/accountSettings';
import { SettingsContainer } from '../SettingsContainer';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IState {
  isUploading: boolean;
  isLoading: boolean;
  hasLoadingError: boolean;
  error?: any;
  templates: any[];
}

export const NotificationsContent: React.FC = () => {
  useEffect(() => {
    getTemplates();
  }, []);

  const intl = useIntl();

  const [state, setState] = useState<IState>({
    isLoading: false,
    isUploading: false,
    hasLoadingError: false,
    templates: [],
  });
  const getTemplates = async () => {
    try {
      setState((s) => ({
        ...s,
        isLoading: true,
        hasLoadingError: false,
      }));
      const templates = await DataCall({
        method: API_FETCH_MAIL_TEMPLATES.method,
        path: API_FETCH_MAIL_TEMPLATES.path(),
      });
      setState((s) => ({
        ...s,
        templates,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        hasLoadingError: true,
      }));
    } finally {
      setState((s) => ({
        ...s,
        isLoading: false,
      }));
    }
  };

  const getLastUpdatedAt = (templates: any[]) => {
    if (templates.length > 0) {
      const max = Math.max(
        ...templates.map((t) => new Date(t.updatedAt).getTime()),
      );
      if (!max) {
        return null;
      }
      if (new Date().getTime() - max < 60 * 1000) {
        return intl.formatMessage(platformNotificationsMessages.aFewSecondsAgo);
      }
      return new Date(max).toLocaleString();
    }
    return null;
  };

  const customRequest = async (options: any) => {
    try {
      setState((s) => ({ ...s, isUploading: true }));

      await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsBinaryString(options.file);
        reader.onload = async (e) => {
          try {
            const items = JSON.parse(e.target?.result as string);
            const templates = await DataCall({
              method: API_UPSERT_MAIL_TEMPLATES.method,
              path: API_UPSERT_MAIL_TEMPLATES.path(),
              body: items,
            });
            resolve(templates);
          } catch (error) {
            reject(error);
          }
        };
      });

      const templates = await DataCall({
        method: API_FETCH_MAIL_TEMPLATES.method,
        path: API_FETCH_MAIL_TEMPLATES.path(),
      });

      setState((s) => ({
        ...s,
        isUploading: false,
        templates,
      }));
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(commonActionsTexts.fileUploaded),
          secondaryMessage: intl.formatMessage(
            platformNotificationsMessages.notificationsUploadSuccessMessage,
            {
              file: 'notifications.json',
            },
          ),
          icon: mdiCheckCircle,
          color: colors.success,
          isDark: false,
        }),
      );
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(CommonTexts.error),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
      setState((s) => ({
        ...s,
        hasLoadingError: true,
        error,
        isUploading: false,
      }));
    }
  };

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
        <PageError
          errorCode={state.error?.code}
          errorMessage={state.error?.message}
        />
      </div>
    );
  }

  return (
    <SettingsContainer
      title={intl.formatMessage(platformNotificationsMessages.title)}
      description={intl.formatMessage(
        platformNotificationsMessages.description,
      )}
    >
      <div>
        {state.isUploading ? (
          <span
            style={{
              color: '#777C8C',
              fontSize: '16px',
              lineHeight: '24px',
              display: 'flex',
            }}
          >
            <Loader
              color="#777C8C"
              width={18}
              style={{ height: 'unset', width: 'unset' }}
            />
            {`${intl.formatMessage(commonActionsTexts.uploadingFile)} ...`}
          </span>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                color: '#1A2233',
                fontSize: '16px',
                lineHeight: '24px',
              }}
            >
              notifications.json
            </span>
            <span
              style={{
                color: '#777C8C',
                fontSize: '12px',
                lineHeight: '18px',
              }}
            >
              {intl.formatMessage(commonActionsTexts.lastUpdated)}:{' '}
              {getLastUpdatedAt(state.templates)}
            </span>
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 24,
        }}
      >
        <Button
          style={{
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: 600,
            height: '35px',
            marginRight: '16px',
          }}
          onClick={async () => {
            const blob = convertJsonToBlob(state.templates);
            const url = await constructFileUrlFromBlob(blob, 'json');
            download(url, 'notifications.json');
          }}
          iconLeft={mdiDownload}
          label={intl.formatMessage(commonActionsTexts.download)}
          color="#989CA6"
          textColor="#475166"
          secondary
        />
        <Upload showUploadList={false} customRequest={customRequest}>
          <Button
            style={{
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 600,
              height: '35px',
            }}
            isLoading={state.isUploading}
            iconLeft={mdiUpload}
            label={intl.formatMessage(commonActionsTexts.upload)}
            color="#989CA6"
            textColor="#475166"
            secondary
          />
        </Upload>
      </div>
    </SettingsContainer>
  );
};
