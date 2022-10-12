// export default {
//   title: {
//     en: "Review information",
//     fr: "Vérification des données",
//   },
//   aboutText: {
//     en: "Review the data that your investor submited for the KYC process.",
//     fr:
//       "Vérifiez les informations soumises par votre investisseur pour le processus de KYC.",
//   },
//   prospect: {
//     en: "Prospect",
//     fr: "Prospect",
//   },
//   itemsActions: {
//     approve: {
//       en: "Approve",
//       fr: "Approuver",
//     },
//     reject: {
//       en: "Reject",
//       fr: "Rejeter",
//     },
//   },
// };

import { defineMessages } from 'react-intl';

export const kycReviewTexts = defineMessages({
  title: {
    id: 'assets.kycReviewTexts.title',
    description: 'KYC reiew title',
    defaultMessage: 'Review information',
  },
  aboutText: {
    id: 'assets.kycReviewTexts.aboutText',
    description: 'KYC review about text',
    defaultMessage:
      'Review the data that your investor submited for the KYC process.',
  },
  prospect: {
    id: 'assets.kycReviewTexts.prospect',
    description: 'Prospect',
    defaultMessage: 'Prospect',
  },
  itemsActionsApprove: {
    id: 'assets.kycReviewTexts.itemsActions.approve',
    description: 'Items approve action text',
    defaultMessage: 'Approve',
  },
  itemsActionsReject: {
    id: 'assets.kycReviewTexts.itemsActions.reject',
    description: 'Items reject action text',
    defaultMessage: 'Reject',
  },
});
