import React, { useEffect, useState } from 'react';
import { mdiAlertOctagon, mdiDownload, mdiUpload } from '@mdi/js';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useIntl } from 'react-intl';

import PageTitle from 'uiComponents/PageTitle';
import InputFile from 'uiComponents/FileReader';
import Button from 'uiComponents/Button';
import { superAdminAccountSettings } from 'texts/routes/superAdmin/superAdminAccountSettings';
import { CommonTexts } from 'texts/commun/commonTexts';
import { commonActionsTexts } from 'texts/commun/actions';
import { colors } from 'constants/styles';
import Label from 'uiComponents/Label';
import { DataCall } from '../../../utils/dataLayer';
import {
  API_DELETE_USECASE,
  API_GET_USECASE,
  API_UPDATE_USECASE,
} from '../../../constants/apiRoutes';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { EventEmitter, Events } from 'features/events/EventEmitter';

const Container = styled.div`
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

      .download-upload-buttons {
        display: flex;
      }
    }

    .buttons {
      display: flex;
      border-top: 1px solid #dfe0e5;
      padding: 24px 0;
    }
  }
`;

export interface UpdateUseCaseProps
  extends RouteComponentProps<{ useCase: string }> {}

const UpdateUseCase = ({ match: { params } }: UpdateUseCaseProps) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const { goBack } = useHistory();
  const [usecase, setUsecase] = useState<any>({});
  const [defaultConfiguration, setDefaultConfiguration] = useState<any>();
  const [useCaseKeys, setUseCaseKeys] = useState<any>();
  const [defaultConfigurationUpdated, setDefaultConfigurationUpdated] =
    useState<any>(false);
  const [useCaseKeysUpdated, setUseCaseKeysUpdated] = useState<any>(false);

  const inputFileStyle = {
    width: 'fit-content',
    marginRight: 16,
  };

  useEffect(() => {
    DataCall({
      method: API_GET_USECASE.method,
      path: API_GET_USECASE.path(params.useCase),
    }).then(async (resp: any) => {
      setUsecase(resp);
      setDefaultConfiguration(resp.config);
      setUseCaseKeys(resp.keys);
    });
  }, [params.useCase]);

  const downloadUseCaseKeys = () => {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:application/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(usecase.keys)),
    );
    element.setAttribute('download', `${params.useCase}-keys.json`);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  };

  const downloadDefaultConfiguration = () => {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:application/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(usecase.config)),
    );
    element.setAttribute('download', `${params.useCase}.json`);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  };

  const deleteUsecase = async () => {
    await DataCall({
      method: API_DELETE_USECASE.method,
      path: API_DELETE_USECASE.path(params.useCase),
      body: {
        useCaseName: params.useCase,
      },
    });
    goBack();
  };

  const onSubmit = async () => {
    try {
      setLoading(true);
      await DataCall({
        method: API_UPDATE_USECASE.method,
        path: API_UPDATE_USECASE.path(params.useCase),
        body: {
          useCaseName: params.useCase,
          defaultConfiguration,
          useCaseKeys,
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
    <Container>
      <PageTitle
        title={intl.formatMessage(
          superAdminAccountSettings.useCaseManagementTitle,
        )}
        withBreadcrumbs
      />
      <form onSubmit={onSubmit}>
        <div className="form-inputs">
          <Label
            label={intl.formatMessage(
              superAdminAccountSettings.setDefaultConfigurationForUseCase,
            )}
            disabled
          />
          <div className="download-upload-buttons">
            <InputFile
              accept={'.json'}
              style={inputFileStyle}
              buttonLabel={intl.formatMessage(commonActionsTexts.upload)}
              buttonIconLeft={mdiUpload}
              value={defaultConfigurationUpdated ? 'Done' : undefined}
              onChange={(jsonString: string) => {
                const json = JSON.parse(jsonString);
                setDefaultConfiguration(json);
                setDefaultConfigurationUpdated(true);
              }}
              required
            />
            {!!defaultConfigurationUpdated && (
              <p style={{ margin: '0.5rem 1rem 0 0' }}>Complete</p>
            )}
            <Button
              size="small"
              label={intl.formatMessage(commonActionsTexts.download)}
              iconLeft={mdiDownload}
              onClick={downloadDefaultConfiguration}
            />
          </div>
          <Label
            label={intl.formatMessage(
              superAdminAccountSettings.setUseCaseKeysForUseCase,
            )}
            disabled
          />
          <div className="download-upload-buttons">
            <InputFile
              accept={'.json'}
              style={inputFileStyle}
              buttonLabel={intl.formatMessage(commonActionsTexts.upload)}
              buttonIconLeft={mdiUpload}
              value={useCaseKeysUpdated ? 'Done' : undefined}
              onChange={(jsonString: string) => {
                const json = JSON.parse(jsonString);
                setUseCaseKeys(json);
                setUseCaseKeysUpdated(true);
              }}
              required
            />
            {!!useCaseKeysUpdated && (
              <p style={{ margin: '0.5rem 1rem 0 0' }}>Complete</p>
            )}
            <Button
              size="small"
              label={intl.formatMessage(commonActionsTexts.download)}
              iconLeft={mdiDownload}
              onClick={downloadUseCaseKeys}
            />
          </div>
        </div>
        <div className="buttons">
          <Button
            type="button"
            onClick={onSubmit}
            isLoading={loading}
            size="small"
            label={intl.formatMessage(superAdminAccountSettings.editUseCase)}
          />
          <Button
            size="small"
            label={intl.formatMessage(CommonTexts.cancel)}
            onClick={goBack}
            disabled={loading}
            tertiary
          />
          <Button
            style={{ marginLeft: 'auto' }}
            size="small"
            label={intl.formatMessage(commonActionsTexts.delete)}
            disabled={loading}
            onClick={deleteUsecase}
            color={colors.errorDark}
          />
        </div>
      </form>
    </Container>
  );
};

export default UpdateUseCase;
