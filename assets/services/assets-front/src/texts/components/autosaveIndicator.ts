import { defineMessages } from 'react-intl';

export const autosaveIndicatorTexts = defineMessages({
  savedLabel: {
    id: 'assets.autosaveIndicator.savedLabel',
    description: 'Auto save indicatior text - saved',
    defaultMessage: 'Saved',
  },
  savingLabel: {
    id: 'assets.autosaveIndicator.savingLabel',
    description: 'Auto save indicatior text - saving',
    defaultMessage: 'Saving...',
  },
  savingFailedLabel: {
    id: 'assets.autosaveIndicator.savingFailedLabel',
    description: 'Auto save indicatior text - saving failed',
    defaultMessage: 'Saving failed',
  },
  savingAgainLabel: {
    id: 'assets.autosaveIndicator.savingAgainLabel',
    description: 'Auto save indicatior text - saving again',
    defaultMessage: 'Save',
  },
});
