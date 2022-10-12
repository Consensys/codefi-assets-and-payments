import { defineMessages } from 'react-intl';

export const clientManagementMessages = defineMessages({
  title: {
    id: 'assets.clientManagement.title',
    description: 'Title of client management the page',
    defaultMessage: 'Client management',
  },
  //  menu
  investorLabel: {
    id: 'assets.clientManagement.tabs.investorLabel',
    description: 'Investors label in the tab',
    defaultMessage: 'Investors',
  },
  prospectLabel: {
    id: 'assets.clientManagement.tabs.prospectLabel',
    description: 'Prospects label in the tab',
    defaultMessage: 'Prospects',
  },
  underwritersLabel: {
    id: 'assets.clientManagement.tabs.underwritersLabel',
    description: 'Lead arrangers label in the tab',
    defaultMessage: 'Lead arrangers',
  },
  // global actions
  createProspect: {
    id: 'assets.clientManagement.actions.createProspect',
    description: 'Create prospect call to action button',
    defaultMessage: 'Create prospect',
  },
});

export const prospectsMessages = defineMessages({
  // headers
  companyHeader: {
    id: 'assets.clientManagement.prospects.headers.company',
    description: 'Prospect list header company',
    defaultMessage: 'Prospects',
  },
  statusHeader: {
    id: 'assets.clientManagement.prospects.headers.status',
    description: 'Prospect list header status',
    defaultMessage: 'Status',
  },
  invitationDateHeader: {
    id: 'assets.clientManagement.prospects.headers.invitationDate',
    description: 'Prospect list header invitation date',
    defaultMessage: 'Invitation sent',
  },
  emailHeader: {
    id: 'assets.clientManagement.prospects.headers.email',
    description: 'Prospect list header invitation email',
    defaultMessage: 'Email',
  },
  // actions
  reviewInformation: {
    id: 'assets.clientManagement.prospects.actions.reviewInformation',
    description: 'Prospect action review information',
    defaultMessage: 'Review information',
  },
  continueReview: {
    id: 'assets.clientManagement.prospects.actions.continueInformation',
    description: 'Prospect action continue information',
    defaultMessage: 'Continue review',
  },
  view: {
    id: 'assets.clientManagement.prospects.actions.view',
    description: 'Prospect action view prospect',
    defaultMessage: 'View',
  },
  verify: {
    id: 'assets.clientManagement.prospects.actions.verify',
    description: 'Prospect action verify prospect',
    defaultMessage: 'Verify prospect',
  },
  confirmVerify: {
    id: 'assets.clientManagement.prospects.actions.confirmVerify',
    description: 'Prospect action verify prospect',
    defaultMessage:
      'Are you sure you want to verify {firstName} {lastName} ? By doing this, the onboarding process will be skipped',
  },
  // status
  toBeReviewed: {
    id: 'assets.clientManagement.prospects.status.toBeReviewed',
    description: 'Prospect status to be reviewed',
    defaultMessage: 'To be reviewed',
  },
  reviewInProgress: {
    id: 'assets.clientManagement.prospects.status.inProgress',
    description: 'Prospect status in progress',
    defaultMessage: 'Review in progress',
  },
  onboardingDenied: {
    id: 'assets.clientManagement.prospects.status.onboardingDenied',
    description: 'Prospect status onboarding denied',
    defaultMessage: 'Onboarding denied',
  },
  pendingSubmission: {
    id: 'assets.clientManagement.prospects.status.pendingSubmission',
    description: 'Prospect status pending submission',
    defaultMessage: 'Pending submission',
  },
  rejected: {
    id: 'assets.clientManagement.prospects.status.pendingSubmission',
    description: 'Prospect status pending submission',
    defaultMessage: 'Pending submission',
  },
  validated: {
    id: 'assets.clientManagement.prospects.status.validated',
    description: 'Prospect status validated',
    defaultMessage: 'Onboarded',
  },
  // messages
  emptyProspectsTitle: {
    id: 'assets.clientManagement.prospects.emptyState.title',
    description: 'No prospect title',
    defaultMessage: 'No prospect',
  },
  emptyProspectsMessage: {
    id: 'assets.clientManagement.prospects.emptyState.body',
    description: 'No prospect body',
    defaultMessage: 'Prospects will be listed here.',
  },
});
export const investorMessages = defineMessages({
  // headers
  investorHeader: {
    id: 'assets.clientManagement.investors.headers.investor',
    description: 'Investor list header company',
    defaultMessage: 'Investor',
  },
  invitationDateHeader: {
    id: 'assets.clientManagement.investors.headers.invitationDate',
    description: 'Investor list header invitation date',
    defaultMessage: 'Invitation sent',
  },
  emailHeader: {
    id: 'assets.clientManagement.investors.headers.email',
    description: 'Investor list header invitation email',
    defaultMessage: 'Email',
  },
  // actions
  view: {
    id: 'assets.clientManagement.investors.actions.view',
    description: 'Investor action View',
    defaultMessage: 'View',
  },
  // messages
  emptyInvestorsTitle: {
    id: 'assets.clientManagement.investors.emptyState.title',
    description: 'No prospect title',
    defaultMessage: 'No investors',
  },
  emptyInvestorsMessage: {
    id: 'assets.clientManagement.investors.emptyState.body',
    description: 'No investor body',
    defaultMessage:
      'Investors will be listed here once a prospect has been granted access to the platform.',
  },
});
