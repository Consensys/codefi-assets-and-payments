import { ElementRequest } from 'src/modules/ElementModule/ElementRequest';

export const elementCreateRequestMock: ElementRequest = {
  key: 'fake_key_element_created',
  type: 'check',
  status: 'mandatory',
  label: {
    en: 'What are your main investment objectives',
    fr: "Quels sont vos principaux objectifs d'investissement",
  },
  placeholder: {
    en: 'Ex: Performance',
    fr: 'Ex: Performance',
  },
  inputs: [
    {
      label: {
        en: 'Cross currency hedging',
        fr: 'Couverture de change',
      },
    },
    {
      label: {
        en: 'Performance',
        fr: 'Performance',
      },
    },
  ],
  data: {},
};

export const elementUpdateRequestMock: ElementRequest = {
  key: 'fake_key_element_created',
  type: 'check',
  status: 'optional',
  label: {
    en: 'What are your main investment objectives',
    fr: "Quels sont vos principaux objectifs d'investissement",
  },
  placeholder: {
    en: 'Ex: Great Perfomance',
    fr: 'Ex: Super Performance',
  },
  inputs: [
    {
      label: {
        en: 'Cross currency hedging',
        fr: 'Couverture de change',
      },
    },
    {
      label: {
        en: 'Performance',
        fr: 'Performance',
      },
    },
  ],
  data: {},
};
