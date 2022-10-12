import { ConfigsDto } from 'src/model/dto/ConfigsDto';
import { AssetType, UserType } from 'src/utils/constants';

export const mockedConfig: ConfigsDto = {
  data: {},
  language: 'en',
  logo: 'logo',
  mailColor: 'red',
  mailLogo: 'logo',
  mainColor: 'red',
  mainColorDark: 'red',
  mainColorDarker: 'red',
  mainColorLight: 'red',
  mainColorLighter: 'red',
  name: 'config',
  preferences: {},
  region: 'region',
  restrictedAssetTypes: [AssetType.CURRENCY],
  restrictedUserTypes: [UserType.ISSUER],
};
