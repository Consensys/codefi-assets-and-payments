import React, { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { mdiAlertOctagon, mdiCheckCircle, mdiDownload } from '@mdi/js';

import { DataCall } from 'utils/dataLayer';
import {
  API_FETCH_TENANT,
  API_DELETE_TENANT,
  API_SEND_INVITATION_EMAIL,
  API_FETCH_POSTMAN_CREDENTIALS,
  API_FETCH_USERS,
  API_ASSET_ALL_GET,
  API_FETCH_TRANSACTIONS,
  // API_FETCH_AUM,
} from 'constants/apiRoutes';
import { CLIENT_ROUTE_SUPERADMIN_HOME, CLIENT_ROUTE_ASSETS } from 'routesList';
import { colors } from 'constants/styles';
import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { TenantKeys, tenantTypeMapping } from 'constants/tenantKeys';
import { ITenant } from 'types/Tenant';
import { getTenantMetadataFromConfig } from '../utils/utils';
import { IUser, UserType } from 'User';
import {
  getClientName,
  download,
  convertJsonToBlob,
  constructFileUrlFromBlob,
} from 'utils/commonUtils';
import Button from 'uiComponents/Button';
import { Card } from 'uiComponents/Card';
import { IConfig, IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { CommonTexts } from 'texts/commun/commonTexts';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';
import {
  userSelector,
  setUser,
  setSuperadmin,
  setAppModal,
} from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import { useCallback } from 'react';

interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  tenant: ITenant;
  firstUser: IUser;
  totalInvestors: number;
  totalAssets: number;
  totalTransactions: number;
  // aum: number;
  firstToken: IToken;
  config: IConfig;
}

const TenantProfileContainer: React.FC<
  RouteComponentProps<{ tenantId: string }> & WrappedComponentProps
> = ({ intl, history, match }) => {
  const [state, setState] = useState<IState>({
    isLoading: false,
    hasLoadingError: false,
    tenant: null as unknown as ITenant,
    firstUser: null as unknown as IUser,
    totalInvestors: null as unknown as number,
    totalAssets: null as unknown as number,
    totalTransactions: null as unknown as number,
    // aum: (null as unknown) as number,
    firstToken: null as unknown as IToken,
    config: null as unknown as IConfig,
  });
  const superAdmin: IUser = useSelector(userSelector) as IUser;
  const dispatch = useDispatch();

  const setFirstUserAsApplicationUser = (firstUser: IUser) => {
    dispatch(setSuperadmin(superAdmin));
    dispatch(setUser(firstUser));
  };

  const loadData = useCallback(async () => {
    try {
      setState((s) => ({
        ...s,
        isLoading: true,
      }));

      const {
        params: { tenantId },
      } = match;

      const user = superAdmin;

      if (user.userType === UserType.SUPERADMIN) {
        const { clientApplications, firstUser, config } = await DataCall({
          method: API_FETCH_TENANT.method,
          path: API_FETCH_TENANT.path(tenantId),
        });
        const tenant =
          clientApplications && clientApplications.length > 0
            ? clientApplications[0]
            : undefined;

        setState((s) => ({ ...s, tenant, firstUser, config }));
      }

      const { total: totalInvestors } = await DataCall({
        method: API_FETCH_USERS.method,
        path: API_FETCH_USERS.path(),
        urlParams: {
          tenantId,
          userType: UserType.INVESTOR,
        },
      });

      const { tokens, total: totalAssets } = await DataCall({
        method: API_ASSET_ALL_GET.method,
        path: API_ASSET_ALL_GET.path(),
        urlParams: {
          tenantId,
        },
      });

      const { total: totalTransactions } = await DataCall({
        method: API_FETCH_TRANSACTIONS.method,
        path: API_FETCH_TRANSACTIONS.path(),
        urlParams: {
          tenantId,
        },
      });

      setState((s) => ({
        ...s,
        isLoading: false,
        totalInvestors,
        totalAssets,
        totalTransactions,
        // aum,
        firstToken: tokens[0],
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        hasLoadingError: true,
      }));
    }
  }, [match, superAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const {
    tenant,
    isLoading,
    hasLoadingError,
    firstUser,
    totalInvestors,
    totalAssets,
    totalTransactions,
    config,
  } = state;

  if (isLoading) {
    return <PageLoader />;
  }

  if (hasLoadingError || !tenant) {
    return <PageError />;
  }

  const tenantName = tenant.name;

  const { platformUrl, tenantType, region } =
    getTenantMetadataFromConfig(config);

  const { enableMarketplace, usecase } = config.data;

  const userTypeStr =
    firstUser && firstUser.userType === UserType.ADMIN ? 'Admin' : 'Issuer';

  return (
    <>
      <PageTitle
        title={tenantName || 'Tenant information'}
        backLink={{
          label: 'All tenants',
          to: CLIENT_ROUTE_SUPERADMIN_HOME,
        }}
        tabActions={[
          {
            label: `View as ${userTypeStr}`,
            action: () => {
              setFirstUserAsApplicationUser(firstUser);
              history.push(CLIENT_ROUTE_ASSETS);
            },
            disabled: true,
          },
          {
            label: 'Send invitation',
            secondary: true,
            action: async () => {
              setState((s) => ({ ...s, isLoading: true }));
              try {
                await DataCall({
                  method: API_SEND_INVITATION_EMAIL.method,
                  path: API_SEND_INVITATION_EMAIL.path(),
                  body: {
                    recipientId: firstUser.id,
                    tenantId: tenant[TenantKeys.CLIENT_ID],
                    tenantType,
                    tenantName,
                  },
                });
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
              }
              setState((s) => ({ ...s, isLoading: false }));
            },
          },
          {
            label: 'Delete Tenant',
            color: colors.errorDark,
            action: () => {
              dispatch(
                setAppModal(
                  appModalData({
                    title: 'Delete Tenant',
                    content:
                      'This will remove the following tenant from Codefi Assets. Make sure you have already contacted the client to inform them of the action.',
                    confirmColor: colors.errorDark,
                    confirmLabel: {
                      en: `Delete ${tenantName || 'Tenant'}`,
                    },
                    confirmAction: async () => {
                      try {
                        await DataCall({
                          method: API_DELETE_TENANT.method,
                          path: API_DELETE_TENANT.path(
                            tenant[TenantKeys.CLIENT_ID],
                          ),
                        });
                        EventEmitter.dispatch(
                          Events.EVENT_APP_MESSAGE,
                          appMessageData({
                            message: 'Tenant deleted',
                            icon: mdiCheckCircle,
                            color: colors.errorDark,
                            isDark: true,
                          }),
                        );
                        history.push(CLIENT_ROUTE_SUPERADMIN_HOME);
                      } catch (error) {
                        EventEmitter.dispatch(
                          Events.EVENT_APP_MESSAGE,
                          appMessageData({
                            message: 'Tenant Delete Error',
                            secondaryMessage: String(error),
                            icon: mdiAlertOctagon,
                            color: colors.error,
                            isDark: true,
                          }),
                        );
                      }
                    },
                  }),
                ),
              );
            },
          },
        ]}
      />
      <div
        style={{
          textAlign: 'justify',
          margin: '0 auto',
          width: '30em',
        }}
      >
        <div
          style={{
            fontSize: '1.5em',
            marginTop: '40px',
          }}
        >
          Tenant information
        </div>
        <h2
          style={{
            fontSize: '1em',
            marginTop: '16px',
            fontWeight: 'bold',
          }}
        >
          Tenant name
        </h2>
        <p>{tenantName}</p>
        <h2
          style={{
            fontSize: '1em',
            marginTop: '24px',
            fontWeight: 'bold',
          }}
        >
          Platform URL
        </h2>
        <Link
          to={{
            pathname: `//${platformUrl}`,
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          {platformUrl}
        </Link>
        <h2
          style={{
            fontSize: '1em',
            marginTop: '24px',
            fontWeight: 'bold',
          }}
        >
          Data location
        </h2>
        <p>{region}</p>
        <h2
          style={{
            fontSize: '1em',
            marginTop: '24px',
            fontWeight: 'bold',
          }}
        >
          Type
        </h2>
        <p>{tenantTypeMapping().get(tenantType)}</p>

        <h2
          style={{
            fontSize: '1em',
            marginTop: '24px',
            fontWeight: 'bold',
          }}
        >
          Includes Marketplace?
        </h2>
        <p>{enableMarketplace ? 'Yes' : 'No'}</p>

        <h2
          style={{
            fontSize: '1em',
            marginTop: '24px',
            fontWeight: 'bold',
          }}
        >
          Usecase
        </h2>
        <p>{usecase}</p>

        <hr
          style={{
            marginTop: '40px',
          }}
        />
        <>
          <div
            style={{
              fontSize: '1.5em',
              marginTop: '24px',
            }}
          >
            API credentials
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              marginTop: '24px',
            }}
          >
            <div style={{ width: '90%' }}>Postman credentials</div>
            <Button
              size="small"
              iconLeft={mdiDownload}
              tertiary
              onClick={async () => {
                const { postmanCredentials } = await DataCall({
                  method: API_FETCH_POSTMAN_CREDENTIALS.method,
                  path: API_FETCH_POSTMAN_CREDENTIALS.path(
                    tenant[TenantKeys.CLIENT_ID],
                  ),
                });
                const blob = convertJsonToBlob(postmanCredentials);
                const url = await constructFileUrlFromBlob(blob, 'json');
                download(url, 'postman_credentials.json');
              }}
            />
          </div>
          <hr
            style={{
              marginTop: '40px',
            }}
          />
        </>
        {firstUser && (
          <>
            <div
              style={{
                fontSize: '1.5em',
                marginTop: '24px',
              }}
            >
              {`${userTypeStr} information`}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                marginTop: '24px',
              }}
            >
              <div style={{ width: '30%', textAlign: 'left' }}>
                {getClientName(firstUser)}
              </div>
              <div style={{ width: '70%', textAlign: 'right' }}>
                {firstUser.email}
              </div>
            </div>
            <hr
              style={{
                marginTop: '40px',
              }}
            />
          </>
        )}
        <>
          <div
            style={{
              fontSize: '1.5em',
              marginTop: '24px',
            }}
          >
            Billing
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              marginTop: '24px',
            }}
          >
            <Card
              style={{
                padding: '30px',
                width: '250px',
                height: '109px',
                marginRight: '16px',
              }}
            >
              <h2>Number of investors</h2>
              <div>{totalInvestors}</div>
            </Card>
            <Card
              style={{
                padding: '30px',
                width: '250px',
                height: '109px',
              }}
            >
              <h2>Total assets</h2>
              <div>{totalAssets}</div>
            </Card>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              marginTop: '24px',
            }}
          >
            <Card
              style={{
                padding: '30px',
                width: '250px',
                height: '109px',
                marginRight: '16px',
              }}
            >
              <h2>AuM</h2>
              <div>-</div>
            </Card>
            <Card
              style={{
                padding: '30px',
                width: '250px',
                height: '109px',
              }}
            >
              <h2>Transactions</h2>
              <div>{totalTransactions}</div>
            </Card>
          </div>
          <hr
            style={{
              marginTop: '40px',
            }}
          />
        </>
      </div>
    </>
  );
};

export const TenantProfile = injectIntl(TenantProfileContainer);
