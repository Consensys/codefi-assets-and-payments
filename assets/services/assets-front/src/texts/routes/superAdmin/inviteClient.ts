// export default {
//   title: {
//     en: "Create new tenant",
//     fr: "Ajouter un tenant",
//   },
//   messages: {
//     inviteSuccess: {
//       en: "Client created",
//       fr: "Client créé",
//     },
//     inviteSuccessSubMessage: {
//       en: "has been onboarded. Send them their invite to the platform.",
//       fr: "has been onboarded. Send them their invite to the platform.",
//     },
//     inviteError: {
//       en: "Error while inviting your client",
//       fr: "Erreur lors de l‘invitation de votre client",
//     },
//   },
//   fields: {
//     firstName: {
//       label: {
//         en: "Admin first name",
//         fr: "Prénom de l'administrateur",
//       },
//       placeholder: {
//         en: "John",
//         fr: "Jean",
//       },
//     },
//     lastName: {
//       label: {
//         en: "Admin last name",
//         fr: "Nom de l'administrateur",
//       },
//       placeholder: {
//         en: "Doe",
//         fr: "Doe",
//       },
//     },
//     email: {
//       label: {
//         en: "Admin email address",
//         fr: "Adresse email de l'administrateur",
//       },
//       placeholder: {
//         en: "john-doe@mail.com",
//         fr: "jean-doe@mail.com",
//       },
//     },
//     type: {
//       label: {
//         en: "Type",
//         fr: "Type",
//       },
//       platform: {
//         en: "Platform",
//         fr: "Plateforme",
//       },
//       api: {
//         en: "API",
//         fr: "API",
//       },
//     },
//     companyField: {
//       label: {
//         en: "Company name",
//         fr: "Nom de la société",
//       },
//       placeholder: {
//         en: "Acme corp.",
//         fr: "Acme corp.",
//       },
//     },
//   },
//   actions: {
//     cancel: {
//       en: "Cancel",
//       fr: "Annuler",
//     },
//     invite: {
//       en: "Send Link",
//       fr: "Envoyer le lien",
//     },
//     reInvite: {
//       en: "Resend Link",
//       fr: "Renvoyer le lien",
//     },
//     create: {
//       en: "Add client",
//       fr: "Ajouter un client",
//     },
//   },
// };

import { defineMessages } from 'react-intl';

export const superAdminInviteClientTexts = defineMessages({
  title: {
    id: 'assets.superAdminInviteClientTexts.title',
    description: 'Super admin invite client title',
    defaultMessage: 'Create new tenant',
  },
  info: {
    id: 'assets.superAdminInviteClientTexts.info',
    description: 'Super admin invite client Tenant information',
    defaultMessage: 'Tenant information',
  },
  inviteSuccess: {
    id: 'assets.superAdminInviteClientTexts.inviteSuccess',
    description: 'Super admin invite client success',
    defaultMessage: 'Client created',
  },
  inviteSuccessSubMessage: {
    id: 'assets.superAdminInviteClientTexts.inviteSuccessSubMessage',
    description: 'Super admin invite client success subtitle message',
    defaultMessage:
      'has been onboarded. Send them their invite to the platform.',
  },
  inviteError: {
    id: 'assets.superAdminInviteClientTexts.inviteError',
    description: 'Super admin invite client errir',
    defaultMessage: 'Error while inviting your client',
  },
});

export const superAdminInviteClientFields = defineMessages({
  firstNameLabel: {
    id: 'assets.superAdminInviteClientFields.firstName.label',
    description: 'Super admin invite client fields - first name - label',
    defaultMessage: 'Admin first name',
  },
  firstNamePlaceholder: {
    id: 'assets.superAdminInviteClientFields.firstName.placeholder',
    description: 'Super admin invite client fields - first name - placeholder',
    defaultMessage: 'John',
  },
  lastNameLabel: {
    id: 'assets.superAdminInviteClientFields.lastName.label',
    description: 'Super admin invite client fields - last name - label',
    defaultMessage: 'Admin last name',
  },
  lastNamePlaceholder: {
    id: 'assets.superAdminInviteClientFields.lastName.placeholder',
    description: 'Super admin invite client fields - last name - placeholder',
    defaultMessage: 'Doe',
  },
  emailLabel: {
    id: 'assets.superAdminInviteClientFields.email.label',
    description: 'Super admin invite client fields - email - label',
    defaultMessage: 'Admin email address',
  },
  emailPlaceholder: {
    id: 'assets.superAdminInviteClientFields.email.placeholder',
    description: 'Super admin invite client fields - email - placeholder',
    defaultMessage: 'john-doe@mail.com',
  },
  typeLabel: {
    id: 'assets.superAdminInviteClientFields.type.label',
    description: 'Super admin invite client fields - type - label',
    defaultMessage: 'Type',
  },
  typePlaceholder: {
    id: 'assets.superAdminInviteClientFields.type.placeholder',
    description: 'Super admin invite client fields - type - placeholder',
    defaultMessage: 'Platform',
  },
  typeApi: {
    id: 'assets.superAdminInviteClientFields.type.api',
    description: 'Super admin invite client fields - type - api',
    defaultMessage: 'API',
  },
  companyFieldLabel: {
    id: 'assets.superAdminInviteClientFields.companyField.label',
    description: 'Super admin invite client fields - company field - label',
    defaultMessage: 'Company name',
  },
  companyFieldPlaceholder: {
    id: 'assets.superAdminInviteClientFields.companyField.placeholder',
    description:
      'Super admin invite client fields - company field - placeholder',
    defaultMessage: 'Acme corp.',
  },
});

export const superAdminInviteClientAction = defineMessages({
  cancel: {
    id: 'assets.superAdminInviteClientAction.cancel',
    description: 'Super admin invite client actions - cancel',
    defaultMessage: 'Cancel',
  },
  invite: {
    id: 'assets.superAdminInviteClientAction.invite',
    description: 'Super admin invite client actions - invite',
    defaultMessage: 'Invite',
  },
  reInvite: {
    id: 'assets.superAdminInviteClientAction.reInvite',
    description: 'Super admin invite client actions - reInvite',
    defaultMessage: 'Resend Link',
  },
  create: {
    id: 'assets.superAdminInviteClientAction.create',
    description: 'Super admin invite client actions - create',
    defaultMessage: 'Add client',
  },
});
