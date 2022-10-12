import { AssetTemplatesDto } from 'src/model/dto/AssetTemplatesDto';
import { AssetType, TokenCategory } from 'src/utils/constants';

export const mockedTemplate: AssetTemplatesDto = {
  tenantId: 'fakeTenantId',
  data: {},
  title: { en: '', fr: '', ja: '' },
  category: TokenCategory.HYBRID,
  name: 'TEST_TEMPLATE',
  type: AssetType.CURRENCY,
  label: {
    en: 'New Currency',
    fr: 'New Currency',
    ja: '',
  },
  description: {
    en: 'Create a medium of exchange for goods and services.',
    fr: 'Create a medium of exchange for goods and services.',
    ja: '',
  },
  topSections: [
    {
      key: 'asset',
      multiple: false,
      legend: { en: '', fr: '', ja: '' },
      label: {
        en: 'Currency information',
        fr: 'Currency information',
        ja: '',
      },
      sections: [
        {
          label: {
            en: 'General',
            fr: 'General',
            ja: '',
          },
          key: '',
          title: { en: '', fr: '', ja: '' },
          description: { en: '', fr: '', ja: '' },
          elements: [
            'currency_name',
            'currency_symbol',
            'borrowerInformation_reviewer_select',
            'currency_description',
          ],
        },
        {
          key: 'asset_bankInformation',
          label: {
            en: 'Bank information',
            fr: 'Bank information',
            ja: '',
          },
          title: { en: '', fr: '', ja: '' },
          description: { en: '', fr: '', ja: '' },
          elements: ['currency_bankInformation'],
        },
      ],
    },
  ],
};

export const sectionWithWrongKey = [
  {
    key: 'asset',
    multiple: false,
    legend: { en: '', fr: '', ja: '' },
    label: {
      en: 'Currency information',
      fr: 'Currency information',
      ja: '',
    },
    sections: [
      {
        key: 'wrong_key',
        label: {
          en: 'Wrong key',
          fr: 'Wrong key',
          ja: '',
        },
        title: { en: '', fr: '', ja: '' },
        description: { en: '', fr: '', ja: '' },
        elements: ['wrong_key'],
      },
    ],
  },
];
