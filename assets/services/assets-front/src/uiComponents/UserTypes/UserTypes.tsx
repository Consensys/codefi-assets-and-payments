import React, { useEffect, useMemo, useState } from 'react';
import { clientManagementMessages } from 'texts/routes/issuer/clientManagement';
import { IUser, UserType } from 'User';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import Select from 'uiComponents/Select';
import { userSelector } from 'features/user/user.store';

interface IProps {
  readonly className?: string;
  readonly id?: string;
  readonly label?: string;
  readonly name?: string;
  readonly onChange?: (newValue: string) => void;
  readonly placeholder?: string;
  readonly required?: boolean;
}

const UserTypes: React.FC<IProps> = ({
  label,
  className,
  placeholder,
  onChange,
  required,
}: IProps) => {
  const intl = useIntl();
  const user = useSelector(userSelector) as IUser;

  const clientTypeOptions = useMemo(() => {
    const typeOptions = [
      {
        label: intl.formatMessage(clientManagementMessages.filterAll),
        value: '',
      },
      {
        label: intl.formatMessage(clientManagementMessages.filterInvestor),
        value: '["INVESTOR"]',
      },
      {
        label: intl.formatMessage(clientManagementMessages.filterUnderwriter),
        value: '["UNDERWRITER"]',
      },
      {
        label: intl.formatMessage(clientManagementMessages.filterVerifier),
        value: '["VERIFIER"]',
      },
      {
        label: intl.formatMessage(clientManagementMessages.filterNavManager),
        value: '["NAV_MANAGER"]',
      },
    ];
    if (user?.userType === UserType.ADMIN)
      typeOptions.push({
        label: intl.formatMessage(clientManagementMessages.filterIssuer),
        value: '["ISSUER"]',
      });
    return typeOptions;
  }, [intl, user]);

  return (
    <Select
      placeholder={placeholder}
      label={label}
      className={className}
      options={clientTypeOptions}
      onChange={onChange}
      required={required}
    />
  );
};

export default UserTypes;
