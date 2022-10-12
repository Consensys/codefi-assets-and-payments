import React, { useState } from 'react';
import { useIntl } from 'react-intl';

import { superAdminAccountSettings } from 'texts/routes/superAdmin/superAdminAccountSettings';
import Input from 'uiComponents/Input';

interface IProps {
  name: string;
}

const EditNameModalContent = (props: IProps) => {
  const intl = useIntl();
  const [useCaseName, setUseCaseName] = useState(props.name);

  return (
    <div>
      <Input
        type="text"
        required
        label={intl.formatMessage(superAdminAccountSettings.useCaseName)}
        defaultValue={useCaseName}
        onChange={(e, newValue) => setUseCaseName(String(newValue))}
      />
    </div>
  );
};

export default EditNameModalContent;
