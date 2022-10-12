import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { mdiAlertOctagon, mdiCheckCircle, mdiDotsHorizontal } from '@mdi/js';

import Dropdown from 'uiComponents/Dropdown';
import Pill from 'uiComponents/Pill';

import { IPillInfo } from 'uiComponents/Pill/Pill';
import { IUser, LinkStatus, UserType } from 'User';
import {
  capitalizeFirstLetter,
  formatDate,
  getClientName,
} from 'utils/commonUtils';

import './ClientsList.scss';
import { useIntl } from 'react-intl';
import { clientListMessages } from 'texts/routes/issuer/clientList';
import { clientManagementMessages } from 'texts/routes/issuer/clientManagement';
import { DataCall } from 'utils/dataLayer';
import { API_SEND_INVITATION_EMAIL } from 'constants/apiRoutes';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { colors } from 'constants/styles';
import { useHistory } from 'react-router-dom';
import {
  CLIENT_ROUTE_INVESTOR_PROFILE,
  CLIENT_ROUTE_KYC_REVIEW,
} from 'routesList';
import { inviteProspectMessages } from 'texts/routes/issuer/InviteProspect';

import {
  TableFetchDataType,
  ManualPagination,
  tableFilterOptions,
} from 'uiComponents/Table';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import { CommonTexts } from 'texts/commun/commonTexts';
import { getConfig } from 'utils/configUtils';
import Address from 'uiComponents/Address';
import { WorkflowStates } from 'texts/routes/common/workflow';
import { setAppModal, userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps {
  readonly clients: Array<IUser>;
  user: IUser;
  manualPagination: ManualPagination;
  loading: boolean;
  onSubmit: () => Promise<void>;
  fetchData: (newProps: TableFetchDataType) => void;
}

interface IOptions {
  label: string | ((data: any) => string);
  readonly iconLeft?: string;
  href?: string;
  onClick?: (data: any) => void;
  color?: string;
}

const ClientsList: React.FC<IProps> = ({
  clients,
  manualPagination,
  loading,
  onSubmit,
  fetchData,
}: IProps) => {
  const user = useSelector(userSelector) as IUser;
  const dispatch = useDispatch();

  const intl = useIntl();
  const { push } = useHistory();
  const config = getConfig();
  const allTypeFilterOptions = [
    {
      title: intl.formatMessage(clientManagementMessages.filterInvestor),
      value: UserType.INVESTOR,
    },
    {
      title: intl.formatMessage(clientManagementMessages.filterUnderwriter),
      value: UserType.UNDERWRITER,
    },
    {
      title: intl.formatMessage(clientManagementMessages.filterVerifier),
      value: UserType.VERIFIER,
    },
    {
      title: intl.formatMessage(clientManagementMessages.filterNavManager),
      value: UserType.NAV_MANAGER,
    },
    {
      title: intl.formatMessage(clientManagementMessages.filterIssuer),
      value: UserType.ISSUER,
    },
  ];

  const i18nClientType = (label: string) => {
    if (!label) {
      return '';
    }
    switch (label) {
      case UserType.INVESTOR:
        return intl.formatMessage(clientManagementMessages.filterInvestor);
      case UserType.UNDERWRITER:
        return intl.formatMessage(clientManagementMessages.filterUnderwriter);
      case UserType.VERIFIER:
        return intl.formatMessage(clientManagementMessages.filterVerifier);
      case UserType.NAV_MANAGER:
        return intl.formatMessage(clientManagementMessages.filterNavManager);
      case UserType.ISSUER:
        return intl.formatMessage(clientManagementMessages.filterIssuer);
      default:
        return capitalizeFirstLetter(label);
    }
  };

  const selectedTypeFilterOptions =
    config.restrictedUserTypes.length > 0
      ? allTypeFilterOptions.filter((el) =>
          config.restrictedUserTypes.includes(el.value),
        )
      : allTypeFilterOptions;
  const clientStatus = new Map<LinkStatus, IPillInfo>([
    [
      LinkStatus.NO_LINK_ADMIN,
      {
        color: 'warning',
        label: intl
          .formatMessage(clientManagementMessages.filterHasNoAccess)
          .toUpperCase(),
        tooltip: intl.formatMessage(
          clientManagementMessages.tooltipHasNoAccessPlatform,
        ),
      },
    ],
    [
      LinkStatus.NO_LINK_ISSUER,
      {
        color: 'warning',
        label: intl
          .formatMessage(clientManagementMessages.filterHasNoAccess)
          .toUpperCase(),
        tooltip: intl.formatMessage(
          clientManagementMessages.tooltipHasNoAccessIssuer,
        ),
      },
    ],
    [
      LinkStatus.VALIDATED,
      {
        color: 'success',
        label: intl
          .formatMessage(clientManagementMessages.filterHasAccess)
          .toUpperCase(),
      },
    ],
    [
      LinkStatus.KYCSUBMITTED,
      {
        color: 'accent2',
        label: intl
          .formatMessage(clientManagementMessages.filterVerificationPending)
          .toUpperCase(),
      },
    ],
    [
      LinkStatus.INVITED,
      {
        color: 'accent3',
        label: intl
          .formatMessage(clientManagementMessages.filterSubmissionPending)
          .toUpperCase(),
      },
    ],
    [
      LinkStatus.REJECTED,
      {
        color: 'warning',
        label: intl.formatMessage(WorkflowStates.rejected).toUpperCase(),
      },
    ],
  ]);

  const sendEmail = useCallback(
    async (client) => {
      try {
        await DataCall({
          method: API_SEND_INVITATION_EMAIL.method,
          path: API_SEND_INVITATION_EMAIL.path(),
          body: {
            recipientId: client.id,
          },
        });

        EventEmitter.dispatch(
          Events.EVENT_APP_MESSAGE,
          appMessageData({
            message: intl.formatMessage(
              inviteProspectMessages.invitationSuccessTitle,
              {
                username: client.data.clientName,
              },
            ),
            icon: mdiCheckCircle,
            color: colors.success,
          }),
        );
      } catch (error) {
        EventEmitter.dispatch(
          Events.EVENT_APP_MESSAGE,
          appMessageData({
            message: intl.formatMessage(clientListMessages.sendEmailError),
            icon: mdiAlertOctagon,
            color: colors.error,
            isDark: true,
          }),
        );
      }
    },
    [intl],
  );

  const showSendInvitation = (client: IUser) => {
    dispatch(
      setAppModal(
        appModalData({
          title: intl.formatMessage(clientListMessages.sendInvitation),
          content: (
            <p>
              {intl.formatMessage(clientListMessages.sendInvitationContent)}
            </p>
          ),
          confirmAction: async () => {
            await sendEmail(client);
            onSubmit();
          },
          confirmColor: colors.main,
          confirmLabel: intl.formatMessage(clientListMessages.sendInvitation),
        }),
      ),
    );
  };

  const clientOptions = new Map<LinkStatus, Array<IOptions>>([
    [
      LinkStatus.VALIDATED,
      [
        {
          label: intl.formatMessage(clientListMessages.view),
          onClick: (client) =>
            push(
              CLIENT_ROUTE_INVESTOR_PROFILE.pathBuilder({
                investorId: client.id,
              }),
            ),
        },
        {
          label: (client: IUser) => {
            return !client.data.registrationEmailSent
              ? intl.formatMessage(clientListMessages.sendInvitation)
              : intl.formatMessage(clientListMessages.resendInvitation);
          },
          onClick: (client: IUser) => {
            showSendInvitation(client);
          },
        },
      ],
    ],
    [
      LinkStatus.KYCSUBMITTED,
      [
        {
          label: intl.formatMessage(clientListMessages.verify),
          onClick: (client: IUser) =>
            push(
              CLIENT_ROUTE_KYC_REVIEW.pathBuilder({
                investorId: client.id,
              }),
            ),
        },
      ],
    ],
    [
      LinkStatus.INVITED,
      [
        {
          label: (client: IUser) => {
            return !client.data.registrationEmailSent
              ? intl.formatMessage(clientListMessages.sendInvitation)
              : intl.formatMessage(clientListMessages.resendInvitation);
          },
          onClick: (client: IUser) => {
            showSendInvitation(client);
          },
        },
      ],
    ],
  ]);

  const renderActions = ({ row: { original } }: any) => {
    const userState = original.link?.state;

    const options =
      clientOptions.get(userState as LinkStatus) ||
      clientOptions.get(LinkStatus.VALIDATED);

    return (
      <div
        data-test-id={`actions-${getClientName(original)}`}
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'flex-end',
        }}
      >
        <Dropdown
          size="small"
          iconLeft={mdiDotsHorizontal}
          data={original}
          options={options as Array<IOptions>}
        />
      </div>
    );
  };

  return (
    <TablePaginated
      serverSidePagination={manualPagination}
      tableSettingsId="clientManagement"
      isLoading={loading}
      defaultColumnsHidden={[
        'firstName',
        'lastName',
        'creationDate',
        'email',
        'phone',
        'defaultWallet',
      ]}
      columns={[
        {
          Header: intl.formatMessage(clientListMessages.name),
          accessor: 'clientName',
          disableSortBy: true,
          Cell: ({ row: { original } }: any) => getClientName(original),
          getCellExportValue: ({ original }: any) => getClientName(original),
        },

        {
          accessor: 'defaultWallet',
          Header: intl.formatMessage(CommonTexts.walletAddress),
          width: 185,
          // eslint-disable-next-line react/display-name
          Cell: ({ row: { original } }: any) =>
            original.defaultWallet ? (
              <Address address={original.defaultWallet} />
            ) : null,
        },
        {
          Header: intl.formatMessage(clientListMessages.status),
          accessor: 'status',
          width: 180,
          disableSortBy: true,
          noPadding: true,
          // eslint-disable-next-line react/display-name
          Cell: ({ row: { original } }: any) => {
            const status =
              clientStatus.get(original.link?.state as LinkStatus) ||
              clientStatus.get(LinkStatus.VALIDATED);
            return (
              <div
                title={status?.tooltip}
                className="_route_clientManagement_clientList"
                style={{ padding: '6px 16px' }}
              >
                <Pill color={status?.color} label={status?.label} />
                {!original.data.registrationEmailSent &&
                  original.link?.state === LinkStatus.VALIDATED && (
                    <p>{intl.formatMessage(clientListMessages.notSent)}</p>
                  )}
              </div>
            );
          },
          getCellExportValue: (row: any) => {
            const status =
              clientStatus.get(row.original.link?.state as LinkStatus) ||
              clientStatus.get(LinkStatus.VALIDATED);
            return `${status?.label}`;
          },
          ...(user.userType === UserType.ADMIN
            ? {}
            : {
                filter: tableFilterOptions,
                filterValues: [
                  {
                    title: intl.formatMessage(
                      clientManagementMessages.filterHasAccess,
                    ),
                    value: 'validated',
                  },
                  {
                    title: intl.formatMessage(
                      clientManagementMessages.filterVerificationPending,
                    ),
                    value: 'kycSubmitted',
                  },
                  {
                    title: intl.formatMessage(
                      clientManagementMessages.filterSubmissionPending,
                    ),
                    value: 'invited',
                  },
                ],
              }),
        },
        {
          Header: intl.formatMessage(clientListMessages.type),
          accessor: 'type',
          disableSortBy: true,
          ...(user.userType === UserType.ADMIN
            ? {}
            : {
                filter: tableFilterOptions,
                filterValues: selectedTypeFilterOptions,
              }),

          Cell: ({ row }: any) =>
            i18nClientType((row.original as IUser).userType),
          getCellExportValue: (row: any) =>
            i18nClientType((row.original as IUser).userType),
        },
        {
          Header: intl.formatMessage(clientListMessages.lastActivity),
          accessor: 'lastActivity',
          disableSortBy: true,
          Cell: ({ row }: any) =>
            formatDate(new Date((row.original as IUser).updatedAt || '')),
          getCellExportValue: (row: any) =>
            formatDate(new Date((row.original as IUser).updatedAt || '')),
        },
        {
          Header: intl.formatMessage(CommonTexts.firstName),
          accessor: 'firstName',
          disableSortBy: true,
          Cell: ({ row }: any) => (row.original as IUser).firstName,
          getCellExportValue: (row: any) => (row.original as IUser).firstName,
        },
        {
          Header: intl.formatMessage(CommonTexts.lastName),
          accessor: 'lastName',
          disableSortBy: true,
          Cell: ({ row }: any) => (row.original as IUser).lastName,
          getCellExportValue: (row: any) => (row.original as IUser).lastName,
        },
        {
          Header: intl.formatMessage(CommonTexts.creationDate),
          accessor: 'creationDate',
          disableSortBy: true,
          Cell: ({ row }: any) =>
            formatDate(new Date((row.original as IUser).createdAt || '')),
          getCellExportValue: (row: any) =>
            formatDate(new Date((row.original as IUser).createdAt || '')),
        },
        {
          Header: intl.formatMessage(CommonTexts.email),
          accessor: 'email',
          disableSortBy: true,
          Cell: ({ row }: any) => (row.original as IUser).email,
          getCellExportValue: (row: any) => (row.original as IUser).email,
        },
        {
          Header: intl.formatMessage(CommonTexts.phone),
          accessor: 'phone',
          disableSortBy: true,
          Cell: ({ row }: any) => (row.original as IUser).phone,
          getCellExportValue: (row: any) => (row.original as IUser).phone,
        },
        {
          Header: '',
          reorderName: intl.formatMessage(CommonTexts.actions),
          disableReorder: true,
          accessor: 'actions',
          width: 40,
          disableResizing: true,
          disableSortBy: true,
          noPadding: true,
          disableExport: true,
          Cell: renderActions,
        },
      ]}
      data={clients}
      fetchData={fetchData}
      translations={{
        emptyTitle: intl.formatMessage(
          clientManagementMessages.emptyClientsTitle,
        ),
        emptyDescription: intl.formatMessage(
          clientManagementMessages.emptyClientsMessage,
        ),
      }}
    />
  );
};

export default ClientsList;
