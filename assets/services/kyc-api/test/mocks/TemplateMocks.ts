import { TemplateRequest } from 'src/modules/TemplateModule/TemplateRequest';

export const templateCreateRequestMock: TemplateRequest = {
  issuerId: 'Fake Issuer',
  name: 'Codefi test fake template',
  topSections: [
    {
      label: {
        en: 'Natural Person',
        fr: 'Personne physique',
      },
      key: 'naturalPersonSection',
      sections: [
        {
          key: 'one',
          label: {
            en: 'Part 1',
            fr: 'Partie 1',
          },
          elements: [
            'firstName_natural',
            'lastName_natural',
            'adress_natural',
            'email_natural',
            'phoneNumber_natural',
          ],
        },
        {
          key: 'two',
          label: {
            en: 'Part 2',
            fr: 'Partie 2',
          },
          elements: [
            'ID_natural',
            'selfie_natural',
            'incomeStatement_natural',
            'countryOfResidence_natural',
            'proofOfResidence_natural',
          ],
        },
      ],
    },
    {
      label: {
        en: 'Legal Person',
        fr: 'Personne morale',
      },
      key: 'legalPersonSection',
      sections: [
        {
          key: 'one',
          label: {
            en: 'Part 1',
            fr: 'Partie 1',
          },
          elements: [
            'nameOfTheEntity_legal',
            'typeOfTheEntity_legal',
            'countryOfIncorporation_legal',
            'incorporationCertificate_legal',
            'proofOfLicensing_legal',
          ],
        },
        {
          key: 'two',
          label: {
            en: 'Part 2',
            fr: 'Partie 2',
          },
          elements: [
            'headquarterAdress_legal',
            'presidentFirstName_legal',
            'presidentLastName_legal',
            'presidentEmail_legal',
            'ID_legal',
            'holds25_legal',
            'mandatesOfAuthority_legal',
            'delegationOfAuthority_legal',
            'certificateBeneficialOwners_legal',
            'taxReport_legal',
          ],
        },
        {
          key: 'three',
          label: {
            en: 'Part 3',
            fr: 'Partie 3',
          },
          elements: [
            'beneficialOwnerID_legal',
            'legalJustificationForBeneficialOwner_legal',
          ],
        },
      ],
    },
  ],
  data: {},
};

export const templateUpdateRequestMock: TemplateRequest = {
  issuerId: 'Fake Issuer',
  name: 'Codefi test fake template',
  topSections: [
    {
      label: {
        en: 'Natural Person Updated',
        fr: 'Personne physique Updated',
      },
      key: 'naturalPersonSectionUpdated',
      sections: [
        {
          key: 'one',
          label: {
            en: 'Part 1',
            fr: 'Partie 1',
          },
          elements: [
            'firstName_natural',
            'lastName_natural',
            'adress_natural',
            'email_natural',
            'phoneNumber_natural',
            'countryOfResidence_natural',
            'proofOfResidence_natural',
          ],
        },
      ],
    },
  ],
  data: {},
};
