// export default {
//   formTitle: {
//     en: "Welcome",
//     fr: "Bienvenue",
//   },
//   formBaseline: {
//     en: "Sign in to CodeFi Assets",
//     fr: "Connection à CodeFi Assets",
//   },
//   formContents: {
//     email: {
//       label: {
//         en: "Email",
//         fr: "Email",
//       },
//       placeholder: {
//         en: "ex: grace.hopper@mail.com",
//         fr: "ex : grace.hopper@mail.com",
//       },
//     },
//     password: {
//       label: {
//         en: "Password",
//         fr: "Password",
//       },
//       placeholder: {
//         en: "your password",
//         fr: "your password",
//       },
//     },
//     signInLabel: {
//       en: "Sign in",
//       fr: "Connexion",
//     },
//   },
// };

import { defineMessages } from 'react-intl';

export const loginTexts = defineMessages({
  formTitle: {
    id: 'assets.login.formTitle',
    description: 'Title of login from',
    defaultMessage: 'Welcome',
  },
  formBaseline: {
    id: 'assets.login.formBaseline',
    description: 'From baseline text',
    defaultMessage: 'Sign in to CodeFi Assets',
  },
  formContentsEmail: {
    id: 'assets.login.formContents.email',
    description: 'Email field label',
    defaultMessage: 'Email',
  },
  formContentsEmailPlaceholder: {
    id: 'assets.login.formContents.email.placeholder',
    description: 'Email field placeholder',
    defaultMessage: 'ex: grace.hopper@mail.com',
  },
  formContentsPassword: {
    id: 'assets.login.formContents.password',
    description: 'Password field label',
    defaultMessage: 'Password',
  },
  formContentsPasswordPlaceholder: {
    id: 'assets.login.formContents.password.placeholder',
    description: 'Password field placeholder',
    defaultMessage: 'Your password',
  },
  signInLabel: {
    id: 'assets.login.signInLabel',
    description: 'Sign in button label',
    defaultMessage: 'Login',
  },
  signUpLabel: {
    id: 'assets.login.signUpLabel',
    description: 'Sign up button label',
    defaultMessage: 'Sign up',
  },
  unActivatedAccount: {
    id: 'assets.login.unActivatedAccount',
    description:
      'Your account is not activated. Please follow the link in the invitation email to complete your account setup.',
    defaultMessage:
      'Your account is not activated. Please follow the link in the invitation email to complete your account setup.',
  },
  rejectedAccount: {
    id: 'assets.login.rejectedAccount',
    description: 'Your access has been rejected.',
    defaultMessage: 'Your access has been rejected.',
  },
  logout: {
    id: 'assets.login.logout',
    description: 'Logout',
    defaultMessage: 'Logout',
  },
  unauthorizedUser: {
    id: 'assets.login.unauthorizedUser',
    description: 'Unauthorized User message',
    defaultMessage:
      '{userName} your user type {userType} is not yet allowed to use the platform. Please contact support team for further details.',
  },
});
