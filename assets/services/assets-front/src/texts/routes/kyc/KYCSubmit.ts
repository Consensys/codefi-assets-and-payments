import { defineMessages } from 'react-intl';

export const KYCSubmitTexts = defineMessages({
  welcomeMessage: {
    id: 'assets.KYCSubmitTexts.welcomeMessage',
    description: 'Welcome Message',
    defaultMessage: 'Welcome to Codefi Assets',
  },
  onBoardingProgressTitle: {
    id: 'assets.KYCSubmitTexts.onBoardingProgressTitle',
    description: 'Investor onboarding progress title',
    defaultMessage: 'Investor onboarding',
  },
  onBoardingProgressDescription: {
    id: 'assets.KYCSubmitTexts.onBoardingProgressDescription',
    description: 'Investor onboarding progress description',
    defaultMessage:
      'Complete the investor onboarding to gain access to the platform and to view assets.',
  },
  onboardingSteps: {
    id: 'assets.KYCSubmitTexts.onboardingSteps',
    description: 'Follow onboarding steps text',
    defaultMessage: 'Follow our onboarding to get access to the system.',
  },
  startOnboardingButton: {
    id: 'assets.KYCSubmitTexts.startOnboardingButton',
    description: 'Start onboarding button text',
    defaultMessage: 'Start',
  },
  continueOnboardingButton: {
    id: 'assets.KYCSubmitTexts.continueOnboardingButton',
    description: 'Continue onboarding button text',
    defaultMessage: 'Continue',
  },
  identification: {
    id: 'assets.KYCSubmitTexts.identification',
    description: 'Enter identification information',
    defaultMessage: 'Enter identification information',
  },
  investmentEntity: {
    id: 'assets.KYCSubmitTexts.investmentEntity',
    description: 'Enter investment entity information',
    defaultMessage: 'Enter investment entity information',
  },
  riskProfile: {
    id: 'assets.KYCSubmitTexts.riskProfile',
    description: 'Answer risk profile questions',
    defaultMessage: 'Answer risk profile questions',
  },
  documents: {
    id: 'assets.KYCSubmitTexts.documents',
    description: 'Upload documents',
    defaultMessage: 'Upload documents',
  },
});

export const KYCProgressTexts = defineMessages({
  informationSentForApproval: {
    id: 'assets.KYCProgressTexts.informationSentForApproval',
    description: 'Information sent for approval.',
    defaultMessage: 'Information sent for approval.',
  },
  informationApproved: {
    id: 'assets.KYCProgressTexts.informationApproved',
    description: 'Information approved.',
    defaultMessage: 'Information approved.',
  },
  informationSubmittedText: {
    id: 'assets.KYCProgressTexts.informationSubmittedText',
    description: 'You will receive an email when there is an update.',
    defaultMessage: 'You will receive an email when there is an update.',
  },
  informationSubmittedError: {
    id: 'assets.KYCProgressTexts.informationSubmittedError',
    description: ' Some provided Information needs your attention.',
    defaultMessage: ' Some provided Information needs your attention.',
  },
  informationSubmittedErrorMessage: {
    id: 'assets.KYCProgressTexts.informationSubmittedErrorMessage',
    description:
      "You'll need to change rejected information and resubmit the form.",
    defaultMessage:
      "You'll need to change rejected information and resubmit the form.",
  },
  reviewInformation: {
    id: 'assets.KYCProgressTexts.reviewInformation',
    description: 'Review information',
    defaultMessage: 'Review information',
  },
  informationUpdateRequired: {
    id: 'assets.KYCProgressTexts.informationUpdateRequired',
    description: ' Information update required',
    defaultMessage: ' Information update required',
  },
});

export const KYCElementTexts = defineMessages({
  documentsSubmitted: {
    id: 'assets.KYCElementTexts.documentsSubmitted',
    description: 'Documents submitted',
    defaultMessage: 'Documents submitted',
  },
  documentsValidated: {
    id: 'assets.KYCElementTexts.documentsValidated',
    description: 'Documents validated',
    defaultMessage: 'Documents validated',
  },
  agreedToTerms: {
    id: 'assets.KYCElementTexts.agreedToTerms',
    description: 'Agreed to terms and conditions.',
    defaultMessage: 'Agreed to terms and conditions.',
  },
  paymentPerformed: {
    id: 'assets.KYCElementTexts.paymentPerformed',
    description: 'Payment performed.',
    defaultMessage: 'Payment performed.',
  },
  informationUpdateRequired: {
    id: 'assets.KYCElementTexts.informationUpdateRequired',
    description: 'Information update required.',
    defaultMessage: 'Information update required.',
  },
  postcodeUKInvalid: {
    id: 'assets.KYCElementTexts.postcodeUKInvalid',
    description: 'This UK postcode does not follow the right format.',
    defaultMessage: 'This UK postcode does not follow the right format.',
  },
  emailValidationError: {
    id: 'assets.KYCElementTexts.emailValidationError',
    description: 'This email address does not follow the right format.',
    defaultMessage: 'This email address does not follow the right format.',
  },
  terms: {
    id: 'assets.KYCElementTexts.terms',
    description: 'Terms and Conditions',
    defaultMessage: 'Terms and Conditions',
  },
  documentExpired: {
    id: 'assets.KYCElementTexts.documentExpired',
    description: 'Document expired.',
    defaultMessage: 'Document expired.',
  },
});

export const KYCOnfidoTexts = defineMessages({
  verifyTitle: {
    id: 'assets.KYCOnfidoTexts.verify.title',
    description: 'Verify yourself with {templateName}',
    defaultMessage: 'Verify yourself with {templateName}',
  },
  verifyDescription: {
    id: 'assets.KYCOnfidoTexts.verify.description',
    description: 'To start using {templateName}, we must verify your identity.',
    defaultMessage:
      'To start using {templateName}, we must verify your identity.',
  },
  verifyIdentity: {
    id: 'assets.KYCOnfidoTexts.verify.verifyIdentity',
    description: 'Verify identity',
    defaultMessage: 'Verify identity',
  },
  onfidoLoadError: {
    id: 'assets.KYCOnfidoTexts.onfidoLoadError',
    description:
      'Onfido component fails at loading because of this error: {onfidoError}. Please go back to the previous page to edit the data accordingly.',
    defaultMessage:
      'Onfido component fails at loading because of this error: {onfidoError}. Please go back to the previous page to edit the data accordingly.',
  },
});
