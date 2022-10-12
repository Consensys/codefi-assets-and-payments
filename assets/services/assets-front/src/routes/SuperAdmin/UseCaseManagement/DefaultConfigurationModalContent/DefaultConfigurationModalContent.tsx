import { mdiDownload, mdiUpload } from '@mdi/js';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';

import { commonActionsTexts } from 'texts/commun/actions';
import { superAdminAccountSettings } from 'texts/routes/superAdmin/superAdminAccountSettings';
import Button from 'uiComponents/Button';
import InputFile from 'uiComponents/InputFile';
import Label from 'uiComponents/Label';

const DefaultConfigurationModalContent = () => {
  const intl = useIntl();

  const [defaultConfiguration, setDefaultConfiguration] = useState<any>();

  const downloadDefaultConfiguration = () => {
    console.log('Downloading default configuration...');
  };

  return (
    <div>
      <Label
        label={intl.formatMessage(
          superAdminAccountSettings.setDefaultConfigurationForUseCase,
        )}
        disabled
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <InputFile
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
        <Button
          style={{ marginLeft: '16px' }}
          size="small"
          label={intl.formatMessage(commonActionsTexts.download)}
          iconLeft={mdiDownload}
          onClick={downloadDefaultConfiguration}
        />
      </div>
    </div>
  );
};

export default DefaultConfigurationModalContent;
