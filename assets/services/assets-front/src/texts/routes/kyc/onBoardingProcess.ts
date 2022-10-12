// export default {
//   steps: {
//     review: {
//       title: {
//         fr: "Vérification",
//         en: "Review",
//       },
//       description: {
//         fr:
//           "Vérifiez les informations fournies pour vous assurer qu'elles sont correctes avant de soumettre le formulaire.",
//         en:
//           "Review the information provided to ensure it is correct prior to submitting the form.",
//       },
//     },
//   },
// };

import { defineMessages } from 'react-intl';

export const onBoardingProcessTexts = defineMessages({
  stepsReviewTitle: {
    id: 'assets.onBoardingProcessTexts.stepsReviewTitle',
    description: 'Onboarding process steps review title',
    defaultMessage: 'Review',
  },
  stepsReviewDescription: {
    id: 'assets.onBoardingProcessTexts.stepsReviewDescription',
    description: 'Onboarding process steps review description',
    defaultMessage:
      'Review the information provided to ensure it is correct prior to submitting the form.',
  },
});
