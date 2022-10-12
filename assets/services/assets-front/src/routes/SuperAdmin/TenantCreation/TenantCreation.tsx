import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { API_CREATE_TENANT, API_LIST_USECASES } from 'constants/apiRoutes';
import {
  TenantNature,
  PlatformType,
  TenantType,
  AppUrl,
  getRegionFromAppUrl,
  TenantMarketplace,
} from 'constants/tenantKeys';
import { DataCall } from 'utils/dataLayer';
import { CLIENT_ROUTE_SUPERADMIN_HOME } from 'routesList';
import { mdiAlertOctagon, mdiCheckCircle } from '@mdi/js';

import { colors, spacing } from 'constants/styles';
import { superAdminInviteClientTexts } from 'texts/routes/superAdmin/inviteClient';

import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import Input from 'uiComponents/Input';
import Select from 'uiComponents/Select';
import Radio from 'uiComponents/Radio';
import InputGroup, { Column } from 'uiComponents/InputGroup/InputGroup';
import Button from 'uiComponents/Button';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { slugify } from 'utils/slugify';
import { getConfigs, isLocalHost } from 'utils/configs';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  tenantNature: TenantNature;
  sendInvitation: boolean;
  isCreatingTenant: boolean;
  tenantName: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  platformUrl: string;
  tenantType: TenantType;
  userTypeStr: string;
  enableMarketplace: TenantMarketplace;
  usecase: string;
  usecases: any;
}

type IProps = RouteComponentProps & WrappedComponentProps;

const TenantCreationClass: React.FC<IProps> = ({ intl, history }) => {
  const [state, setState] = useState<IState>({
    isLoading: false,
    hasLoadingError: false,
    sendInvitation: false,
    isCreatingTenant: false,
    tenantNature: TenantNature.API,
    tenantName: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    platformUrl: '',
    tenantType: TenantType.PLATFORM_SINGLE_ISSUER,
    userTypeStr: 'Admin',
    enableMarketplace: TenantMarketplace.NO,
    usecase: '',
    usecases: [],
  });

  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const caseList = await DataCall({
        method: API_LIST_USECASES.method,
        path: API_LIST_USECASES.path(),
      });
      setState((s) => ({
        ...s,
        usecases: caseList,
        usecase: caseList[0].name,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const setTenantNameAndPlatformUrl = (tenantName: string): void => {
    const appUrl = getConfigs().appUrl;
    const isLocalHostApp = isLocalHost(appUrl);

    let domainName;
    if (appUrl.startsWith('https') || isLocalHostApp) {
      domainName = isLocalHostApp
        ? AppUrl.LOCAL_EU.split('//')[1]
        : appUrl.split('//')[1];
    } else {
      throw new Error(
        `Env variable REACT_APP_APP_URL should start with https. Current value: '${appUrl}'`,
      );
    }
    const platformUrl = `${slugify(tenantName)}.${domainName}`;
    setState((s) => ({ ...s, tenantName, platformUrl }));
  };

  const setTenantType = (tenantType: TenantType): void => {
    setState((s) => ({ ...s, tenantType }));
    if (tenantType === TenantType.PLATFORM_SINGLE_ISSUER) {
      setState((s) => ({ ...s, userTypeStr: 'Issuer' }));
    } else {
      setState((s) => ({ ...s, userTypeStr: 'Admin' }));
    }
  };

  const setTenantNature = (tenantNature: TenantNature): void => {
    setState((s) => ({ ...s, tenantNature }));
  };

  const setTenantMarketplace = (enableMarketplace: TenantMarketplace): void => {
    setState((s) => ({ ...s, enableMarketplace }));
  };

  const setSendInvitation = (sendInvitation: boolean): void => {
    setState((s) => ({ ...s, sendInvitation }));
  };

  const createTenant = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();

      setState((s) => ({ ...s, isCreatingTenant: true }));
      const {
        tenantName,
        adminEmail,
        adminFirstName,
        adminLastName,
        platformUrl,
        tenantType,
        sendInvitation,
        enableMarketplace,
        usecase,
      } = state;
      // get region from app url
      const appUrl = getConfigs().appUrl;
      const region = getRegionFromAppUrl(appUrl as AppUrl);

      await DataCall({
        method: API_CREATE_TENANT.method,
        path: API_CREATE_TENANT.path(),
        body: {
          tenantName,
          usecase,
          email: adminEmail,
          firstName: adminFirstName,
          lastName: adminLastName,
          defaultAlias: platformUrl,
          aliases: [platformUrl],
          region,
          tenantType,
          sendNotification: sendInvitation,
          enableMarketplace: !!(enableMarketplace === TenantMarketplace.YES),
        },
      });

      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: `Tenant ${tenantName} has been successfully created`,
          icon: mdiCheckCircle,
          color: colors.success,
          isDark: true,
        }),
      );

      setState((s) => ({
        ...s,
        isCreatingTenant: false,
      }));
      history.push(CLIENT_ROUTE_SUPERADMIN_HOME);
    } catch (error) {
      setState((s) => ({ ...s, isCreatingTenant: false }));
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: 'Tenant Creation Error',
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
  };

  if (state.isLoading) {
    return <PageLoader />;
  }

  if (state.hasLoadingError) {
    return <PageError />;
  }

  return (
    <form onSubmit={(e) => createTenant(e)}>
      <PageTitle
        title={intl.formatMessage(superAdminInviteClientTexts.title)}
      />
      <div
        style={{
          textAlign: 'justify',
          margin: '0 auto',
          marginTop: '40px',
          width: '30em',
        }}>
        <div style={{ fontSize: '1.5em' }}>
          {intl.formatMessage(superAdminInviteClientTexts.info)}
        </div>
        <Input
          style={{
            marginTop: spacing.tight,
            marginBottom: spacing.small,
          }}
          label="Tenant name"
          sublabel="Only use letters, numbers and spaces."
          required
          maxLength={30}
          onChange={(event) =>
            setTenantNameAndPlatformUrl(event.currentTarget.value)
          }
        />
        <Input
          style={{
            marginTop: spacing.tightLooser,
            marginBottom: spacing.small,
          }}
          label="Platform URL"
          required
          defaultValue={state.platformUrl}
          disabled
        />
        <InputGroup
          title="Type"
          required
          style={{
            marginTop: '24px',
          }}>
          <Column>
            <Radio
              label={TenantNature.PLATFORM}
              name="tenant-nature"
              onChange={() => setTenantNature(TenantNature.PLATFORM)}
            />

            {state.tenantNature &&
              state.tenantNature === TenantNature.PLATFORM && (
                <Column
                  style={{
                    marginLeft: '6px',
                    borderLeft: `2px solid ${colors.main}`,
                    paddingLeft: '10px',
                  }}>
                  <Radio
                    label={PlatformType.SINGLE_ISSUER}
                    name="platform-type"
                    onChange={() =>
                      setTenantType(TenantType.PLATFORM_SINGLE_ISSUER)
                    }
                  />
                  <Radio
                    label={PlatformType.MULTI_ISSUER}
                    name="platform-type"
                    onChange={() =>
                      setTenantType(TenantType.PLATFORM_MULTI_ISSUER)
                    }
                  />
                </Column>
              )}

            <Radio
              label={TenantNature.API}
              name="tenant-nature"
              onChange={() => {
                setTenantNature(TenantNature.API);
                setTenantType(TenantType.API);
              }}
            />
          </Column>
        </InputGroup>

        <InputGroup
          title="Enable Marketplace?"
          required
          style={{
            marginTop: '24px',
          }}>
          <Column>
            <Radio
              label={TenantMarketplace.NO}
              name="tenant-marketplace"
              onChange={() => setTenantMarketplace(TenantMarketplace.NO)}
            />

            <Radio
              label={TenantMarketplace.YES}
              name="tenant-marketplace"
              onChange={() => setTenantMarketplace(TenantMarketplace.YES)}
            />
          </Column>
        </InputGroup>

        <InputGroup
          title="Select a usecase"
          required
          style={{
            marginTop: '24px',
          }}>
          <Select
            required
            options={state.usecases.map((usecase: any) => ({
              label: usecase.name,
              value: usecase.name,
            }))}
            onChange={(usecase) => setState((s) => ({ ...s, usecase }))}
          />
        </InputGroup>

        <div style={{ fontSize: '1.5em', marginTop: '40px' }}>
          {`${state.userTypeStr} information`}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
          }}>
          <Input
            style={{ width: '50%', marginBottom: spacing.small }}
            label={`${state.userTypeStr} first name`}
            required
            onChange={(event) => {
              const adminFirstName = event.currentTarget.value;
              setState((s) => ({
                ...s,
                adminFirstName,
              }));
            }}
          />
          <Input
            style={{
              marginLeft: '10px',
              width: '50%',
              marginBottom: spacing.small,
            }}
            label={`${state.userTypeStr} last name`}
            required
            onChange={(event) => {
              const adminLastName = event.currentTarget.value;
              setState((s) => ({
                ...s,
                adminLastName,
              }));
            }}
          />
        </div>
        <Input
          label={`${state.userTypeStr} email address`}
          required
          style={{
            marginBottom: spacing.small,
          }}
          type="email"
          onChange={(event) => {
            const adminEmail = event.currentTarget.value;
            setState((s) => ({
              ...s,
              adminEmail,
            }));
          }}
        />
        <div style={{ fontSize: '1.5em', marginTop: '40px' }}>
          Send invitation
        </div>
        <div style={{ marginTop: '8px' }}>
          {`Do you want to send an invitation email to the ${state.userTypeStr}'s email address inviting them to create their account on the platform?`}
        </div>
        <InputGroup
          title="Type"
          required
          style={{
            marginTop: '8px',
          }}>
          <Column>
            <Radio
              label={'Yes'}
              name="send-invitation"
              onChange={() => setSendInvitation(true)}
            />
            <Radio
              label={'No'}
              name="send-invitation"
              onChange={() => setSendInvitation(false)}
            />
          </Column>
        </InputGroup>
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'row',
            marginBottom: '40px',
          }}>
          <Button
            size="small"
            label="Create Tenant"
            type="submit"
            isLoading={state.isCreatingTenant}
          />
          <Button
            style={{ marginLeft: '10px' }}
            size="small"
            label="Cancel"
            href={CLIENT_ROUTE_SUPERADMIN_HOME}
            tertiary
          />
        </div>
      </div>
    </form>
  );
};

export const TenantCreation = injectIntl(TenantCreationClass);
