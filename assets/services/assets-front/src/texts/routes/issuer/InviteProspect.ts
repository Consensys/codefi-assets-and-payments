import { defineMessages } from 'react-intl';

export const inviteProspectMessages = defineMessages({
  // fields
  firstNameLabel: {
    id: 'assets.clientManagement.inviteProspect.fields.firstName.label',
    description: 'First name field label',
    defaultMessage: 'First Name',
  },
  firstNamePlaceholder: {
    id: 'assets.clientManagement.inviteProspect.fields.firstName.placeholder',
    description: 'First name place holder',
    defaultMessage: 'John',
  },
  lastNameLabel: {
    id: 'assets.clientManagement.inviteProspect.fields.lastName.label',
    description: 'Last name field label',
    defaultMessage: 'Last Name',
  },
  lastNamePlaceholder: {
    id: 'assets.clientManagement.inviteProspect.fields.lastName.placeholder',
    description: 'Last name place holder',
    defaultMessage: 'Doe',
  },
  emailLabel: {
    id: 'assets.clientManagement.inviteProspect.fields.email.label',
    description: 'Email field label',
    defaultMessage: 'Email',
  },
  emailPlaceholder: {
    id: 'assets.clientManagement.inviteProspect.fields.email.placeholder',
    description: 'Email place holder',
    defaultMessage: 'jean-doe@mail.com',
  },
  typeLabel: {
    id: 'assets.clientManagement.inviteProspect.fields.type.label',
    description: 'Type field label',
    defaultMessage: 'Type',
  },
  investorLabel: {
    id: 'assets.clientManagement.inviteProspect.fields.type.investor.label',
    description: 'Investor type label',
    defaultMessage: 'Investor',
  },
  underwriterLabel: {
    id: 'assets.clientManagement.inviteProspect.fields.type.underwriter.label',
    description: 'Underwriter type label',
    defaultMessage: 'Underwriter',
  },
  natureLabel: {
    id: 'assets.clientManagement.inviteProspect.fields.nature.label',
    description: 'Nature field label',
    defaultMessage: 'Type',
  },
  companyNatureLabel: {
    id: 'assets.clientManagement.inviteProspect.fields.nature.company.label',
    description: 'Company nature label',
    defaultMessage: 'Company',
  },
  companyFieldLabel: {
    id: 'assets.clientManagement.inviteProspect.fields.company.label',
    description: 'Company field label',
    defaultMessage: 'Company',
  },
  companyFieldPlaceholder: {
    id: 'assets.clientManagement.inviteProspect.fields.company.placeholder',
    description: 'Company field placeholder',
    defaultMessage: 'Acme corp.',
  },
  individualNatureLabel: {
    id: 'assets.clientManagement.inviteProspect.fields.nature.individual.label',
    description: 'Individual nature label',
    defaultMessage: 'Individual',
  },
  // messages
  inviteSuccessTitle: {
    id: 'assets.clientManagement.inviteProspect.inviteSuccess.title',
    description: 'Invite success title',
    defaultMessage: 'Prospect created',
  },
  inviteSuccessBody: {
    id: 'assets.clientManagement.inviteProspect.inviteSuccess.body',
    description: 'Invite success body',
    defaultMessage:
      '{firstName} {lastName} has been onboarded. Send them their invite to the platform.',
  },
  verifySuccessTitle: {
    id: 'assets.clientManagement.inviteProspect.verifySuccess.title',
    description: 'Verify success title',
    defaultMessage: 'Prospect {firstName} {lastName} verified',
  },
  verifyErrorTitle: {
    id: 'assets.clientManagement.inviteProspect.verifyError.title',
    description: 'Verify error title',
    defaultMessage: 'Prospect allowlisting error',
  },
  inviteErrorTitle: {
    id: 'assets.clientManagement.inviteProspect.inviteError.title',
    description: 'Invite failure title',
    defaultMessage: 'Error while inviting your prospect',
  },
  invitationSuccessTitle: {
    id: 'assets.clientManagement.inviteProspect.invitationSuccess.title',
    description: 'Prospect invitation success',
    defaultMessage: 'Invitation sent to {username}',
  },
  invitationErrorTitle: {
    id: 'assets.clientManagement.inviteProspect.invitationError.title',
    description: 'Prospect invitation error',
    defaultMessage: 'Prospect invitation error',
  },
  confirmDelete: {
    id: 'assets.clientManagement.inviteProspect.confirmDelete.title',
    description: 'Confirm prospect deletion',
    defaultMessage: 'Are you sure you want to delete this prospect?',
  },
  deleteSuccessTitle: {
    id: 'assets.clientManagement.inviteProspect.deleteSuccess.title',
    description: 'Delete prospect successful',
    defaultMessage: 'Prospect deleted',
  },
  deleteErrorTitle: {
    id: 'assets.clientManagement.inviteProspect.deleteError.title',
    description: 'Delete prospect failed',
    defaultMessage: 'Prospect delete error',
  },
  // actions
  cancel: {
    id: 'assets.clientManagement.inviteProspect.actions.cancel',
    description: 'Cancel prospect button',
    defaultMessage: 'Cancel',
  },
  create: {
    id: 'assets.clientManagement.inviteProspect.actions.create',
    description: 'Create prospect button',
    defaultMessage: 'Create Prospect',
  },
  sendInvitation: {
    id: 'assets.clientManagement.inviteProspect.actions.sendInvitation',
    description: 'Invite prospect button',
    defaultMessage: 'Send Invitation',
  },
  resendInvitation: {
    id: 'assets.clientManagement.inviteProspect.actions.resendInvitation',
    description: 'Invite prospect button',
    defaultMessage: 'Resend Invitation',
  },
  delete: {
    id: 'assets.clientManagement.inviteProspect.actions.delete',
    description: 'Delete prospect button',
    defaultMessage: 'Delete prospect',
  },
});
