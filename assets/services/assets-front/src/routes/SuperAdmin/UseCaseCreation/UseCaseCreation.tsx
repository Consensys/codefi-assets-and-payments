import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { mdiAlertOctagon, mdiUpload } from '@mdi/js';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';

import PageTitle from 'uiComponents/PageTitle';
import Input from 'uiComponents/Input';
import InputFile from 'uiComponents/FileReader';
import Button from 'uiComponents/Button';
import { superAdminAccountSettings } from 'texts/routes/superAdmin/superAdminAccountSettings';
import { CommonTexts } from 'texts/commun/commonTexts';
import { commonActionsTexts } from 'texts/commun/actions';
import { DataCall } from '../../../utils/dataLayer';
import { API_CREATE_USECASE } from '../../../constants/apiRoutes';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { colors } from 'constants/styles';
import { EventEmitter, Events } from 'features/events/EventEmitter';

const StyledContainer = styled.div`
  height: calc(100vh - 64px);
  padding: 32px 40px;
  display: flex;
  flex-direction: column;

  form {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 0 64px;

    .form-inputs {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .file-input {
        color: #475166;
        font-weight: 700;
      }
    }

    .buttons {
      display: flex;
      border-top: 1px solid #dfe0e5;
      padding: 24px 0;
    }
  }
`;

const UseCaseCreation = () => {
  const intl = useIntl();
  const { goBack } = useHistory();

  const [useCaseName, setUseCaseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [defaultConfiguration, setDefaultConfiguration] = useState<any>();
  const [useCase, setUseCase] = useState<any>();

  const onSubmit = async () => {
    try {
      setLoading(true);
      await DataCall({
        method: API_CREATE_USECASE.method,
        path: API_CREATE_USECASE.path(),
        body: {
          useCaseName,
          defaultConfiguration,
          useCaseKeys: useCase,
        },
      });
      goBack();
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <PageTitle
        title={intl.formatMessage(
          superAdminAccountSettings.useCaseManagementTitle,
        )}
        withBreadcrumbs
      />
      <form onSubmit={onSubmit}>
        <div className="form-inputs">
          <Input
            type="text"
            required
            label={intl.formatMessage(superAdminAccountSettings.useCaseName)}
            defaultValue={useCaseName}
            onChange={(e, newValue) => setUseCaseName(String(newValue))}
          />
          <InputFile
            label={intl.formatMessage(
              superAdminAccountSettings.setDefaultConfigurationForUseCase,
            )}
            buttonLabel={intl.formatMessage(commonActionsTexts.upload)}
            buttonIconLeft={mdiUpload}
            value={defaultConfiguration ? 'Done' : undefined}
            onChange={(jsonString: string) => {
              const json = JSON.parse(jsonString);
              setDefaultConfiguration(json);
            }}
            required
          />
          {!!defaultConfiguration && <p>Complete</p>}
          <InputFile
            label={intl.formatMessage(
              superAdminAccountSettings.setUseCaseKeysForUseCase,
            )}
            buttonLabel={intl.formatMessage(commonActionsTexts.upload)}
            buttonIconLeft={mdiUpload}
            value={useCase ? 'Done' : undefined}
            onChange={(jsonString: string) => {
              const json = JSON.parse(jsonString);
              setUseCase(json);
            }}
            required
          />
          {!!useCase && <p>Complete</p>}
        </div>
        <div className="buttons">
          <Button
            type="button"
            onClick={onSubmit}
            isLoading={loading}
            size="small"
            label={intl.formatMessage(superAdminAccountSettings.createUseCase)}
          />
          <Button
            size="small"
            disabled={loading}
            label={intl.formatMessage(CommonTexts.cancel)}
            onClick={goBack}
            tertiary
          />
        </div>
      </form>
    </StyledContainer>
  );
};

export default UseCaseCreation;
