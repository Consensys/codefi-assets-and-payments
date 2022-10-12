import { defineMessages } from 'react-intl';

export const clientCreationMessages = defineMessages({
  title: {
    id: 'assets.clientCreationTexts.pageTitle',
    description: 'Title for new client page',
    defaultMessage: 'New client',
  },
  clientInformationTitle: {
    id: 'assets.clientCreationTexts.clientInformationTitle',
    description: 'Title for client information',
    defaultMessage: 'Client information',
  },
  clientName: {
    id: 'assets.clientCreationTexts.clientName',
    description: 'Label for client name',
    defaultMessage: 'Client name',
  },
  clientType: {
    id: 'assets.clientCreationTexts.clientType',
    description: 'Label for client type',
    defaultMessage: 'Client type',
  },
  placeholderClientType: {
    id: 'assets.clientCreationTexts.placeholderClientType',
    description: 'Placeholder for client type',
    defaultMessage: 'Select type',
  },
  clientAdminInformation: {
    id: 'assets.clientCreationTexts.clientAdminInformation',
    description: "Label for client's admin information",
    defaultMessage: "Client's admin information",
  },
  clientAdminDescription: {
    id: 'assets.clientCreationTexts.clientAdminDescription',
    description: "Description for client's admin information",
    defaultMessage:
      "This information will be used to create the client's admin profile on the platform",
  },
  adminFirstName: {
    id: 'assets.clientCreationTexts.adminFirstName',
    description: 'Label for admin first name',
    defaultMessage: 'Admin first name',
  },
  adminLastName: {
    id: 'assets.clientCreationTexts.adminLastName',
    description: 'Label for admin last name',
    defaultMessage: 'Admin last name',
  },
  adminEmail: {
    id: 'assets.clientCreationTexts.adminEmail',
    description: 'Label for admin email',
    defaultMessage: 'Admin email address',
  },
  onboardingTitle: {
    id: 'assets.clientCreationTexts.onboardingTitle',
    description: 'Label for onboarding',
    defaultMessage: 'Onboarding',
  },
  onboardingDescription: {
    id: 'assets.clientCreationTexts.onboardingDescription',
    description: 'Description for onboarding',
    defaultMessage:
      'Do you want to send an invitation to the client to complete their onboarding form?',
  },
  onboardingYes: {
    id: 'assets.clientCreationTexts.onboardingYes',
    description: 'Label for Yes',
    defaultMessage: 'Yes',
  },
  onboardingNo: {
    id: 'assets.clientCreationTexts.onboardingNo',
    description: 'Label for No',
    defaultMessage: 'No',
  },
  createClientButton: {
    id: 'assets.clientCreationTexts.createClientButton',
    description: 'Label for button Create client',
    defaultMessage: 'Create client',
  },
  cancelButton: {
    id: 'assets.clientCreationTexts.cancelButton',
    description: 'Label for button Cancel',
    defaultMessage: 'Cancel',
  },
  inviteSuccess: {
    id: 'assets.clientCreationTexts.inviteSuccess',
    description: 'Invite success',
    defaultMessage: '{clientName} invited to complete onboarding form.',
  },
  emailAlreadyInUse: {
    id: 'assets.clientCreationTexts.emailAlreadyInUse',
    description: 'Message when email already in use',
    defaultMessage: 'This email is already in use. Please use another one.',
  },
});
