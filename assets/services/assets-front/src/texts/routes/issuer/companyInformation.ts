import { defineMessages } from 'react-intl';

export const companyInformationTexts = defineMessages({
  successTitle: {
    id: 'assets.companyInformationTexts.success.title',
    description: 'Success message title on update admin settings',
    defaultMessage: 'Success',
  },
  successDescription: {
    id: 'assets.companyInformationTexts.success.description',
    description: 'Success message description on update admin settings',
    defaultMessage: 'Your changes have been saved',
  },
  errorTitle: {
    id: 'assets.companyInformationTexts.error.title',
    description: 'Error message title on update admin settings',
    defaultMessage: 'Error',
  },
  errorDescription: {
    id: 'assets.companyInformationTexts.error.description',
    description: 'Error message description on update admin settings',
    defaultMessage: 'Failed to update admin address',
  },
  confirmChangesTitle: {
    id: 'assets.companyInformationTexts.confirmChanges.title',
    description: 'Confirm changes title',
    defaultMessage: 'Confirm changes',
  },
  confirmChangesDescription: {
    id: 'assets.companyInformationTexts.confirmChanges.description',
    description: 'Confirm changes description',
    defaultMessage:
      'Are you sure that you want to change your admin address. This address is used to deploy and control smart contracts representing your product on the blockchain.',
  },
  confirmChangesInput: {
    id: 'assets.companyInformationTexts.confirmChanges.input',
    description: 'Confirm changes input',
    defaultMessage: 'New Admin Key',
  },
  changeAdminAddressTitle: {
    id: 'assets.companyInformationTexts.changeAdminAddress.title',
    description: 'Confirm admin address title',
    defaultMessage: 'Admin address',
  },
  changeAdminAddressDescription: {
    id: 'assets.companyInformationTexts.changeAdminAddress.description',
    description: 'Confirm admin address description',
    defaultMessage:
      'Copy and paste your Ethereum admin address here. This address is used to deploy and control smart contracts representing your product on the blockchain. Please ensure that your admin key is correct.',
  },
  changeAdminAddressInput: {
    id: 'assets.companyInformationTexts.changeAdminAddress.input',
    description: 'Confirm admin address input',
    defaultMessage: 'Admin address',
  },
  changeAdminAddressSave: {
    id: 'assets.companyInformationTexts.changeAdminAddress.save',
    description: 'Confirm admin address save button',
    defaultMessage: 'Save changes',
  },
  changeAdminAddressCancel: {
    id: 'assets.companyInformationTexts.changeAdminAddress.cancel',
    description: 'Confirm admin address cancel button',
    defaultMessage: 'Cancel',
  },
});
