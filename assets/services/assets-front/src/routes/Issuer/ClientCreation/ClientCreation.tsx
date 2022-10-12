import React, { useState, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { mdiAlertOctagon, mdiCheckCircle } from '@mdi/js';

import PageTitle from 'uiComponents/PageTitle';
import Input from 'uiComponents/Input';
import InputGroup from 'uiComponents/InputGroup';
import Radio from 'uiComponents/Radio';
import Button from 'uiComponents/Button';
import Select from 'uiComponents/Select';

import { useIntl } from 'react-intl';
import { clientManagementMessages } from 'texts/routes/issuer/clientManagement';
import { clientCreationMessages } from 'texts/routes/issuer/clientCreation';
import StyledClientCreation from './StyledClientCreation';

import { IUser, UserType } from 'User';
import {
  API_CREATE_CLIENT,
  API_INVITE_CLIENT_FOR_KYC,
  API_SEND_INVITATION_EMAIL,
  API_ADD_KYC_VERIFIER,
  API_ADD_NAV_MANAGER,
  API_ALLOWLIST_CLIENT_KYC,
} from 'constants/apiRoutes';
import { DataCall } from 'utils/dataLayer';
import { IWorkflowInstance } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { CLIENT_ROUTE_ACCOUNT_SETTINGS_CLIENT_MANAGEMENT } from 'routesList';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { colors } from 'constants/styles';
import { clientListMessages } from 'texts/routes/issuer/clientList';
import { getConfig } from 'utils/configUtils';
import { userSelector, userSpaceSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

/**
 * This UI Component is used by both issuer and admin
 */

const ClientCreation: React.FC = () => {
  const intl = useIntl();
  const history = useHistory();
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>('');
  const [clientType, setClientType] = useState<UserType>();
  const [adminFirstName, setAdminFirstName] = useState<string>('');
  const [adminLastName, setAdminLastName] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [isOnboarding, setIsOnboarding] = useState<boolean>(true);
  const user = useSelector(userSelector) as IUser;
  const space = useSelector(userSpaceSelector) as IWorkflowInstance;
  const config = getConfig();

  const createClient = useCallback(async (): Promise<IUser> => {
    const { user: newUser } = await DataCall({
      method: API_CREATE_CLIENT.method,
      path: API_CREATE_CLIENT.path(),
      body: {
        email: adminEmail,
        firstName: adminFirstName,
        lastName: adminLastName,
        userType: clientType,
        data: {
          userType: clientType,
          clientName,
        },
      },
    });
    return newUser;
  }, [adminEmail, adminFirstName, adminLastName, clientName, clientType]);

  const sendEmail = useCallback(async (userId) => {
    await DataCall({
      method: API_SEND_INVITATION_EMAIL.method,
      path: API_SEND_INVITATION_EMAIL.path(),
      body: {
        recipientId: userId,
      },
    });
  }, []);

  const addUserToEntity = useCallback(
    async (userId): Promise<boolean> => {
      switch (clientType) {
        case UserType.VERIFIER: {
          const { newLink } = await DataCall({
            method: API_ADD_KYC_VERIFIER.method,
            path: API_ADD_KYC_VERIFIER.path(user.id),
            body: {
              verifierId: userId,
            },
          });
          return newLink;
        }
        case UserType.NAV_MANAGER: {
          const { newLink } = await DataCall({
            method: API_ADD_NAV_MANAGER.method,
            path: API_ADD_NAV_MANAGER.path(user.id),
            body: {
              navManagerId: userId,
            },
          });
          return newLink;
        }
        case UserType.INVESTOR:
        case UserType.UNDERWRITER: {
          const { newLink } = await DataCall({
            method: API_INVITE_CLIENT_FOR_KYC.method,
            path: API_INVITE_CLIENT_FOR_KYC.path(user.userType),
            body: {
              submitterId: userId,
              issuerId: space?.entityId,
            },
          });
          return newLink;
        }
        default:
          return true;
      }
    },
    [user, clientType, space?.entityId],
  );

  const allowListUser = useCallback(
    async (client) => {
      try {
        const body = {
          clientCategory: undefined,
          riskProfile: undefined,
          submitterId: client.id,
          sendNotification: isOnboarding,
          issuerId: space?.entityId,
        };
        await DataCall({
          method: API_ALLOWLIST_CLIENT_KYC.method,
          path: API_ALLOWLIST_CLIENT_KYC.path(user.userType),
          body,
        });
      } catch (error) {
        EventEmitter.dispatch(
          Events.EVENT_APP_MESSAGE,
          appMessageData({
            message: intl.formatMessage(clientListMessages.grantAccessError),
            icon: mdiAlertOctagon,
            color: colors.error,
            isDark: true,
          }),
        );
      }
    },
    [intl, user, isOnboarding, space?.entityId],
  );

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      setIsInviting(true);

      try {
        const newUser = await createClient();
        const newUserId = newUser.id;
        const isNotExistingUser = await addUserToEntity(newUserId);
        if (!isNotExistingUser) {
          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                clientCreationMessages.emailAlreadyInUse,
              ),
              icon: mdiAlertOctagon,
              color: colors.error,
              isDark: true,
            }),
          );
          setIsInviting(false);
          return;
        }
        if (isOnboarding) {
          await sendEmail(newUserId);
          EventEmitter.dispatch(
            Events.EVENT_APP_MESSAGE,
            appMessageData({
              message: intl.formatMessage(
                clientCreationMessages.inviteSuccess,
                {
                  clientName: newUser.data.clientName,
                },
              ),
              icon: mdiCheckCircle,
              color: colors.success,
            }),
          );
        } else {
          await allowListUser(newUser);
        }
        setIsInviting(false);
        history.push(CLIENT_ROUTE_ACCOUNT_SETTINGS_CLIENT_MANAGEMENT);
      } catch (error) {
        setIsInviting(false);
      }
    },
    [
      createClient,
      isOnboarding,
      addUserToEntity,
      intl,
      history,
      sendEmail,
      allowListUser,
    ],
  );

  const clientTypeOptions = useMemo(() => {
    if (user?.userType === UserType.ADMIN) {
      return [
        {
          label: intl.formatMessage(clientManagementMessages.filterIssuer),
          value: UserType.ISSUER,
        },
      ];
    } else {
      const typeOptions = [
        {
          label: intl.formatMessage(clientManagementMessages.filterInvestor),
          value: UserType.INVESTOR,
        },
        {
          label: intl.formatMessage(clientManagementMessages.filterUnderwriter),
          value: UserType.UNDERWRITER,
        },
        {
          label: intl.formatMessage(clientManagementMessages.filterVerifier),
          value: UserType.VERIFIER,
        },
        {
          label: intl.formatMessage(clientManagementMessages.filterNavManager),
          value: UserType.NAV_MANAGER,
        },
      ];
      const restrictedUserTypes = config.restrictedUserTypes || [];
      if (restrictedUserTypes.length > 0) {
        return typeOptions.filter(
          ({ value }) => restrictedUserTypes.indexOf(value) > -1,
        );
      }
      return typeOptions;
    }
  }, [intl, user, config]);

  return (
    <StyledClientCreation>
      <PageTitle title={intl.formatMessage(clientCreationMessages.title)} />
      <form onSubmit={(e) => onSubmit(e)}>
        <h2 className="client-title">
          {intl.formatMessage(clientCreationMessages.clientInformationTitle)}
        </h2>
        <Input
          label={intl.formatMessage(clientCreationMessages.clientName)}
          onChange={(_, newValue) => setClientName(newValue || '')}
          data-test-id="clientName"
          required
        />
        <Select
          label={intl.formatMessage(clientCreationMessages.clientType)}
          className="select-client-type"
          data-test-id="clientType"
          placeholder={intl.formatMessage(
            clientCreationMessages.placeholderClientType,
          )}
          options={clientTypeOptions}
          onChange={(e) => setClientType(e as UserType)}
          required
        />

        <h2>
          {intl.formatMessage(clientCreationMessages.clientAdminInformation)}
        </h2>
        <p>
          {intl.formatMessage(clientCreationMessages.clientAdminDescription)}
        </p>
        <InputGroup className="admin-name">
          <Input
            label={intl.formatMessage(clientCreationMessages.adminFirstName)}
            onChange={(_, newValue) => setAdminFirstName(newValue || '')}
            data-test-id="adminFirstName"
            required
          />
          <Input
            label={intl.formatMessage(clientCreationMessages.adminLastName)}
            onChange={(_, newValue) => setAdminLastName(newValue || '')}
            data-test-id="adminLastName"
            required
          />
        </InputGroup>
        <Input
          label={intl.formatMessage(clientCreationMessages.adminEmail)}
          onChange={(_, newValue) => setAdminEmail(newValue || '')}
          data-test-id="adminEmail"
          required
        />

        <h2>{intl.formatMessage(clientCreationMessages.onboardingTitle)}</h2>
        <p>
          {intl.formatMessage(clientCreationMessages.onboardingDescription)}
        </p>
        <Radio
          label={intl.formatMessage(clientCreationMessages.onboardingYes)}
          name="onboarding"
          onChange={() => setIsOnboarding(true)}
          checked
        />
        <Radio
          label={intl.formatMessage(clientCreationMessages.onboardingNo)}
          name="onboarding"
          onChange={() => setIsOnboarding(false)}
        />
        <footer>
          <Button
            label={intl.formatMessage(
              clientCreationMessages.createClientButton,
            )}
            isLoading={isInviting}
            type="submit"
          />
          <Button
            label={intl.formatMessage(clientCreationMessages.cancelButton)}
            href={CLIENT_ROUTE_ACCOUNT_SETTINGS_CLIENT_MANAGEMENT}
            tertiary
            color="#333"
          />
        </footer>
      </form>
    </StyledClientCreation>
  );
};

export default ClientCreation;
