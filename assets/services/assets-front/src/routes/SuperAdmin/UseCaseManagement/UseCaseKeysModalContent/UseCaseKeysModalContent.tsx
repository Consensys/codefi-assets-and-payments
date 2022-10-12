import { mdiDownload, mdiUpload } from '@mdi/js';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { commonActionsTexts } from 'texts/commun/actions';
import { superAdminAccountSettings } from 'texts/routes/superAdmin/superAdminAccountSettings';
import Button from 'uiComponents/Button';
import InputFile from 'uiComponents/InputFile';
import Label from 'uiComponents/Label';

const UseCaseKeysModalContent = () => {
  const intl = useIntl();

  const [useCaseKeys, setUseCaseKeys] = useState<any>();

  const downloadUseCaseKeys = () => {
    console.log('Downloading use case keys...');
  };

  return (
    <div>
      <Label
        label={intl.formatMessage(
          superAdminAccountSettings.setUseCaseKeysForUseCase,
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
            useCaseKeys ? [useCaseKeys.filename, useCaseKeys.docId] : undefined
          }
          onChange={([filename, docId]) => {
            if (filename && docId) {
              setUseCaseKeys({
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
          onClick={downloadUseCaseKeys}
        />
      </div>
    </div>
  );
};

export default UseCaseKeysModalContent;
