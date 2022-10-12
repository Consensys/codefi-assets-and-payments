import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import PageTitle from 'uiComponents/PageTitle';
import PageError from 'uiComponents/PageError';

import { CLIENT_ROUTE_ACCOUNT_SETTINGS_CREATE_CLIENT } from 'routesList';
import { DataCall } from 'utils/dataLayer';
import { API_FETCH_USERS } from 'constants/apiRoutes';
import { IUser, UserType } from 'User';
import { clientManagementMessages } from 'texts/routes/issuer/clientManagement';
import { useIntl } from 'react-intl';

import StyledClientManagement from './StyledClientManagement';
import ClientsList from './components/ClientsList';
import { getConfig } from 'utils/configUtils';
import { userSelector } from 'features/user/user.store';

const ClientManagement: React.FC = () => {
  const intl = useIntl();
  const user = useSelector(userSelector) as IUser;
  const [isLoadingClients, setIsLoadingClients] = useState<boolean>(true);
  const [hasLoadingError, setHasLoadingError] = useState<Error>();
  const [linkStates, setLinkStates] = useState<string>('');
  const [userTypes, setUserTypes] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [clientList, setClientList] = useState<Array<IUser>>([]);
  const config = getConfig();

  const loadUsers = useCallback(async (): Promise<void> => {
    setIsLoadingClients(true);
    let userTypesToSend;
    if (user.userType === UserType.ADMIN) {
      userTypesToSend = JSON.stringify([UserType.ISSUER]);
    } else {
      userTypesToSend =
        userTypes === '' && config.restrictedUserTypes.length > 0
          ? JSON.stringify(config.restrictedUserTypes)
          : userTypes;
    }
    try {
      const { users, total }: { users: Array<IUser>; total: number } =
        await DataCall({
          method: API_FETCH_USERS.method,
          path: API_FETCH_USERS.path(),
          urlParams: {
            withLinks: true,
            linkStates,
            userTypes: userTypesToSend,
            offset,
            limit,
          },
        });

      setClientList(users);
      setTotal(total);
      setIsLoadingClients(false);
    } catch (error: any) {
      setIsLoadingClients(false);
      setHasLoadingError(error);
    }
  }, [linkStates, userTypes, offset, limit, config.restrictedUserTypes, user]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, offset, limit, linkStates, userTypes, user]);

  const renderLoadingError = useMemo(() => <PageError />, []);

  return (
    <StyledClientManagement>
      <PageTitle
        title={intl.formatMessage(clientManagementMessages.title)}
        tabActions={[
          {
            label: intl.formatMessage(clientManagementMessages.createNew),
            href: CLIENT_ROUTE_ACCOUNT_SETTINGS_CREATE_CLIENT,
            size: 'big',
          },
        ]}
      />
      {hasLoadingError && renderLoadingError}
      <main>
        <ClientsList
          clients={clientList}
          user={user}
          onSubmit={loadUsers}
          manualPagination={{
            totalRows: total,
            pageSize: limit,
            currentPage: offset / limit,
          }}
          loading={isLoadingClients}
          fetchData={(newParams) => {
            const newFilters: Record<string, string> = {};
            newParams.filters.forEach((el) => {
              newFilters[el.id] =
                el.value.length > 0 ? JSON.stringify(el.value) : '';
            });
            setOffset(newParams.pageIndex * newParams.pageSize);

            setLinkStates(newFilters.status || '');
            setUserTypes(newFilters.type || '');
            setLimit(newParams.pageSize);
          }}
        />
      </main>
    </StyledClientManagement>
  );
};

export default ClientManagement;
