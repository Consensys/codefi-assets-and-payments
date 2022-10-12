import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import PageTitle from 'uiComponents/PageTitle';
import PageError from 'uiComponents/PageError';

import { superAdminClientsTexts } from 'texts/routes/superAdmin/clients';
import { superAdminInviteClientTexts } from 'texts/routes/superAdmin/inviteClient';

import { IUser } from 'User';
import { DataCall } from 'utils/dataLayer';
import { API_FETCH_TENANTS, API_FETCH_TENANT } from 'constants/apiRoutes';
import StyledClientManagement from 'routes/Issuer/ClientManagement/StyledClientManagement';
import { ITenant } from 'types/Tenant';
import { TenantKeys } from 'constants/tenantKeys';
import {
  CLIENT_ROUTE_SUPERADMIN_TENANT_CREATION,
  CLIENT_ROUTE_SUPERADMIN_TENANT_PROFILE,
} from 'routesList';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { IConfig } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import { getTenantMetadataFromConfig, getTenantTypePill } from '../utils/utils';
import Button from 'uiComponents/Button';
import { CommonTexts } from 'texts/commun/commonTexts';
import { useCallback } from 'react';

interface IState {
  hasLoadingError?: Error;
  tenantsList: Array<ITenant>;
  configsList: Array<IConfig>;
  isLoadingClients: boolean;
  adminsMap: Map<string, IUser>;
  offset: number;
  total: number;
  limit: number;
}

type IProps = RouteComponentProps & WrappedComponentProps;

const Clients: React.FC<IProps> = ({ intl, match }) => {
  const [state, setState] = useState<IState>({
    tenantsList: [],
    configsList: [],
    adminsMap: new Map(),
    isLoadingClients: true,
    offset: 0,
    total: 0,
    limit: 10,
  });

  const loadData = useCallback(async (): Promise<void> => {
    /**
     * Call to the api to load the issuers list
     */
    setState((s) => ({
      ...s,
      isLoadingClients: true,
    }));
    try {
      const { tenants, total }: { tenants: Array<ITenant>; total: number } =
        await DataCall({
          method: API_FETCH_TENANTS.method,
          path: API_FETCH_TENANTS.path(),
          urlParams: {
            offset: state.offset,
            limit: state.limit,
          },
        });

      const adminsMap = new Map();
      const configsList: IConfig[] = [];
      await Promise.all(
        tenants.map(async (tenant) => {
          try {
            const tenantId =
              tenant[TenantKeys.CLIENT_METADATA]?.[
                TenantKeys.CLIENT_METADATA_TENANT_ID
              ] || tenant[TenantKeys.CLIENT_ID];
            const { firstUser, config } = await DataCall({
              method: API_FETCH_TENANT.method,
              path: API_FETCH_TENANT.path(tenantId),
            });
            adminsMap.set(tenantId, firstUser);
            configsList.push(config);
          } catch (error) {
            // console.log(error);
          }
        }),
      );

      setState((s) => ({
        ...s,
        tenantsList: tenants,
        total,
        isLoadingClients: false,
        adminsMap,
        configsList,
      }));
    } catch (error: any) {
      setState((s) => ({
        ...s,
        hasLoadingError: error,
        isLoadingClients: false,
      }));
    }
  }, [state.limit, state.offset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (state.hasLoadingError) {
    return <PageError />;
  }

  return (
    <StyledClientManagement>
      <PageTitle
        title={intl.formatMessage(superAdminClientsTexts.title)}
        tabActions={[
          {
            label: intl.formatMessage(superAdminInviteClientTexts.title),
            href: CLIENT_ROUTE_SUPERADMIN_TENANT_CREATION,
          },
        ]}
      />
      <main>
        <TablePaginated
          serverSidePagination={{
            totalRows: state.total,
            pageSize: state.limit,
            currentPage: state.offset / state.limit,
          }}
          tableSettingsId="orderManagement"
          isLoading={state.isLoadingClients}
          defaultColumnsHidden={[]}
          columns={[
            {
              Header: intl.formatMessage(
                superAdminClientsTexts.clientsListHeaderLabelsClientName,
              ),
              accessor: (config: IConfig) =>
                getTenantMetadataFromConfig(config).tenantName,
              disableSortBy: false,
            },
            {
              Header: intl.formatMessage(
                superAdminClientsTexts.clientsListHeaderLabelsCreationDate,
              ),
              accessor: (config: IConfig) =>
                getTenantMetadataFromConfig(config).createdAt,
              disableSortBy: false,
            },
            {
              Header: intl.formatMessage(
                superAdminClientsTexts.clientsListHeaderLabelsTenantType,
              ),
              accessor: (config: IConfig) =>
                getTenantTypePill(
                  getTenantMetadataFromConfig(config).tenantType,
                ),
              disableSortBy: false,
            },
            {
              Header: intl.formatMessage(
                superAdminClientsTexts.clientsListHeaderLabelsEmail,
              ),
              accessor: (config: IConfig) =>
                (state.adminsMap.get(config.tenantId) || {}).email,
              disableSortBy: false,
            },
            {
              Header: intl.formatMessage(
                superAdminClientsTexts.clientsListHeaderLabelsUrl,
              ),
              accessor: (config: IConfig) =>
                getTenantMetadataFromConfig(config).platformUrl,
              disableSortBy: false,
            },
            {
              Header: '',
              accessor: 'view',
              Cell: ({ row: { original } }: { row: { original: IConfig } }) => (
                <div
                  style={{
                    height: 65,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}
                >
                  <Button
                    /* eslint-disable-next-line */
                    label={intl.formatMessage(CommonTexts.view)}
                    size="small"
                    href={CLIENT_ROUTE_SUPERADMIN_TENANT_PROFILE.pathBuilder({
                      tenantId: original.tenantId,
                    })}
                    tertiary
                  />
                </div>
              ),
              disableReorder: true,
              disableResizing: true,
              disableSortBy: true,
              noPadding: true,
              disableExport: true,
              width: 70,
            },
          ]}
          data={state.configsList}
          fetchData={(data) => {
            const newFilters: Record<string, string> = {};
            data.filters.forEach((el) => {
              newFilters[el.id] =
                el.value.length > 0
                  ? JSON.stringify(
                      el.value.reduce((acc: string[], el: string) => {
                        return [...acc, ...el.split(',')];
                      }, []),
                    )
                  : '';
            });
            setState((s) => ({
              ...s,
              offset: data.pageSize * data.pageIndex,
              limit: data.pageSize,
            }));
            loadData();
          }}
        />
      </main>
    </StyledClientManagement>
  );
};

export default injectIntl(Clients);
