import { defineMessages } from 'react-intl';

export const clientManagementMessages = defineMessages({
  title: {
    id: 'assets.clientManagementTexts.title',
    description: 'Title of client management page',
    defaultMessage: 'Client management',
  },
  createNew: {
    id: 'assets.clientManagementTexts.createNew',
    description: 'Create client call to action button',
    defaultMessage: 'Create new client',
  },
  statusFilter: {
    id: 'assets.clientManagement.client.filter.status',
    description: 'Client list status filter',
    defaultMessage: 'Status',
  },
  typeFilter: {
    id: 'assets.clientManagement.client.filter.type',
    description: 'Client list type filter',
    defaultMessage: 'Type',
  },
  emptyClientsTitle: {
    id: 'assets.clientManagement.client.emptyClients.title',
    description: 'Title for empty list',
    defaultMessage: 'No client created yet',
  },
  emptyClientsMessage: {
    id: 'assets.clientManagement.client.emptyClients.message',
    description: 'Message for empty list',
    defaultMessage: 'Get started by creating a client',
  },
  filterIssuer: {
    id: 'assets.clientManagement.client.filter.issuer',
    description: 'Label for user type issuer',
    defaultMessage: 'Issuer',
  },
  filterInvestor: {
    id: 'assets.clientManagement.client.filter.investor',
    description: 'Label for user type investor',
    defaultMessage: 'Investor',
  },
  filterUnderwriter: {
    id: 'assets.clientManagement.client.filter.underwriter',
    description: 'Label for user type underwriter',
    defaultMessage: 'Underwriter',
  },
  filterVerifier: {
    id: 'assets.clientManagement.client.filter.verifier',
    description: 'Label for user type verifier',
    defaultMessage: 'Verifier',
  },
  filterNavManager: {
    id: 'assets.clientManagement.client.filter.navManager',
    description: 'Label for user type nav manager',
    defaultMessage: 'NAV manager',
  },
  filterHasAccess: {
    id: 'assets.clientManagement.client.filter.hasAccess',
    description: 'Label for status type Has Access',
    defaultMessage: 'Has Access',
  },
  filterHasNoAccess: {
    id: 'assets.clientManagement.client.filter.hasNoAccess',
    description: 'Label for status type Has No Access',
    defaultMessage: 'Has No Access',
  },
  filterVerificationPending: {
    id: 'assets.clientManagement.client.filter.verificationPending',
    description: 'Label for status type Verification Pending',
    defaultMessage: 'Verification Pending',
  },
  filterSubmissionPending: {
    id: 'assets.clientManagement.client.filter.submissionPending',
    description: 'Label for status type Submission Pending',
    defaultMessage: 'Submission Pending',
  },
  filterCreated: {
    id: 'assets.clientManagement.client.filter.created',
    description: 'Label for status type Created',
    defaultMessage: 'Created',
  },
  filterAll: {
    id: 'assets.clientManagement.client.filter.all',
    description: 'Label for all types',
    defaultMessage: 'All',
  },
  listOptions: {
    id: 'assets.clientManagement.client.listOptions',
    description: 'Label for list size options',
    defaultMessage: `Showing {current} of {total} users`,
  },
  tooltipHasNoAccessPlatform: {
    id: 'assets.clientManagement.client.filter.tooltipHasNoAccessPlatform',
    description: 'Text for platform Has No Access tooltip',
    defaultMessage: 'Has no access to the whole platform',
  },
  tooltipHasNoAccessIssuer: {
    id: 'assets.clientManagement.client.filter.tooltipHasNoAccessIssuer',
    description: 'Text for issuer Has No Access tooltip',
    defaultMessage: "Has no access to to the issuer's space",
  },
});
