import { v4 as uuidv4 } from 'uuid';
import {
  Config,
  Region,
  TenantType,
} from 'src/modules/MetadataModule/constants';

export const metadataApiRetrieveConfigMock: Config = {
  id: uuidv4(),
  tenantId: 'fakeTenantId',
  userId: 'tenant',
  name: 'Fake Tenant Functional test',
  logo: '',
  mainColor: '#3d73fa',
  mainColorLight: '#2c56dd',
  mainColorLighter: '#2c56dd',
  mainColorDark: '#2c56dd',
  mainColorDarker: '#2c56dd',
  language: 'en',
  region: 'en-UK',
  data: {
    aliases: '["fake-aliases.net"]',
    tenantName: 'Default - Dev',
    region: Region.EU,
    tenantType: TenantType.PLATFORM_MULTI_ISSUER,
    kycTemplateId: uuidv4(),
    bypassKycChecks: false,
    defaultAlias: 'fake-aliases.net',
    createdAt: new Date('2022-06-01T13:30:02.598Z'),
    firstUserId: uuidv4(),
    onfidoApiToken: 'fakeApiToken',
    codefiUsersIds: `{"ADMIN":"${uuidv4()}","ISSUER":"${uuidv4()}","VERIFIER":"${uuidv4()}","INVESTOR":"${uuidv4()}"}`,
  },
  preferences: {},
};
