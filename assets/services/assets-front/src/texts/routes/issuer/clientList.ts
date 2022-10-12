import { defineMessages } from 'react-intl';

export const clientListMessages = defineMessages({
  name: {
    id: 'assets.clientList.tableHeader.name',
    description: 'Label Name in table header',
    defaultMessage: 'Name',
  },
  status: {
    id: 'assets.clientList.tableHeader.status',
    description: 'Label Status in table header',
    defaultMessage: 'Status',
  },
  type: {
    id: 'assets.clientList.tableHeader.type',
    description: 'Label Type in table header',
    defaultMessage: 'Type',
  },
  lastActivity: {
    id: 'assets.clientList.tableHeader.lastActivity',
    description: 'Label Last activity in table header',
    defaultMessage: 'Last Activity',
  },
  view: {
    id: 'assets.clientList.tableOptions.view',
    description: 'Label view in table options',
    defaultMessage: 'View',
  },
  grantAccess: {
    id: 'assets.clientList.tableOptions.grantAccess',
    description: 'Label grant access in table options',
    defaultMessage: 'Grant access',
  },
  resendInvitation: {
    id: 'assets.clientList.tableOptions.resendInvitation',
    description: 'Label resend invitation in table options',
    defaultMessage: 'Resend invitation',
  },
  sendInvitation: {
    id: 'assets.clientList.tableOptions.sendInvitation',
    description: 'Label send invitation in table options',
    defaultMessage: 'Send invitation',
  },
  verify: {
    id: 'assets.clientList.tableOptions.verify',
    description: 'Label verify in table options',
    defaultMessage: 'Verify',
  },
  grantAccessContent: {
    id: 'assets.clientList.tableOptions.grantAccess.content',
    description: 'Content for grant access',
    defaultMessage:
      'Are you sure you want to grant {clientName} access to the platform?',
  },
  grantAccessInvitationContent: {
    id: 'assets.clientList.tableOptions.grantAccess.invitationContent',
    description: 'Send invitation content for grant access',
    defaultMessage:
      'Do you want to notify the client by email that they have access to the platform?',
  },
  grantAccessInvitationConfirmation: {
    id: 'assets.clientList.tableOptions.grantAccess.invitationConfirmation',
    description: 'Invitation confirmation for grant access',
    defaultMessage: 'Yes, send invitation email',
  },
  grantAccessInvitationDecline: {
    id: 'assets.clientList.tableOptions.grantAccess.invitationDecline',
    description: 'Invitation decline for grant access',
    defaultMessage: 'No, do this later',
  },
  accessGranted: {
    id: 'assets.clientList.accessGranted',
    description: 'Access granted',
    defaultMessage: 'Access granted{clientName}',
  },
  accessGrantedWithInvitation: {
    id: 'assets.clientList.accessGranted',
    description: 'Access granted and email sent',
    defaultMessage: 'Access granted and email sent to {clientName}',
  },
  grantAccessError: {
    id: 'assets.clientList.grantAccess.error',
    description: 'Error message',
    defaultMessage: 'Error while granting access',
  },
  sendEmailError: {
    id: 'assets.clientList.sendEmail.error',
    description: 'Error message',
    defaultMessage: 'Error while sending invitation email',
  },
  notSent: {
    id: 'assets.clientList.sendEmail.notSent',
    description: 'Invitation not sent',
    defaultMessage: 'Invitation not sent',
  },
  sendInvitationContent: {
    id: 'assets.clientList.tableOptions.sendInvitationContent',
    description: 'Content for send invitation',
    defaultMessage:
      'Are you sure you want to notify the client by email that they have access to the platform?',
  },
});
