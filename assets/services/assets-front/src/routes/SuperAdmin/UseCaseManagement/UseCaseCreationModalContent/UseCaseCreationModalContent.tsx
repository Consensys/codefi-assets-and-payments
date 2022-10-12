import React, { useState } from 'react';
import { mdiUpload } from '@mdi/js';
import styled from 'styled-components';

import Input from 'uiComponents/Input';
import InputFile from 'uiComponents/InputFile';
import { useIntl } from 'react-intl';
import { superAdminAccountSettings } from 'texts/routes/superAdmin/superAdminAccountSettings';
import { commonActionsTexts } from 'texts/commun/actions';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;

  .file-input {
    color: #475166;
    font-weight: 700;
  }
`;

const UseCaseCreation = () => {
  const intl = useIntl();

  const [useCaseName, setUseCaseName] = useState('');
  const [defaultConfiguration, setDefaultConfiguration] = useState<any>();
  const [useCase, setUseCase] = useState<any>();

  return (
    <StyledContainer>
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
        value={
          defaultConfiguration
            ? [defaultConfiguration.filename, defaultConfiguration.docId]
            : undefined
        }
        onChange={([filename, docId]) => {
          if (filename && docId) {
            setDefaultConfiguration({
              filename,
              docId,
            });
          }
        }}
        required
      />
      <InputFile
        label={intl.formatMessage(
          superAdminAccountSettings.setUseCaseKeysForUseCase,
        )}
        buttonLabel={intl.formatMessage(commonActionsTexts.upload)}
        buttonIconLeft={mdiUpload}
        value={useCase ? [useCase.filename, useCase.docId] : undefined}
        onChange={([filename, docId]) => {
          if (filename && docId) {
            setUseCase({
              filename,
              docId,
            });
          }
        }}
        required
      />
    </StyledContainer>
  );
};

export default UseCaseCreation;
