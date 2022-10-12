import { User, UserNature, keys as UserKeys, UserType } from 'src/types/user';
import { WalletType } from 'src/types/wallet';
import { WalletType as EntityApiWalletType } from '@codefi-assets-and-payments/ts-types';

export const generateUser = ({
  overrideUser,
  overrideUserData,
}: {
  overrideUser?: Partial<User>;
  overrideUserData?: Partial<User[UserKeys.DATA]>;
}): User => {
  return {
    tenantId: 'fakeTenantId',
    createdAt: new Date('2022-01-10T14:23:00.108Z'),
    updatedAt: new Date('2022-01-10T15:37:17.708Z'),
    authId: 'auth0|fakeAuthId',
    firstConnectionCode: 'code?WhatCode?',
    superUserId: null,
    id: 'fakeInvestorId',
    firstName: 'Mr. Investor',
    lastName: 'Vitalik',
    email: 'investor@codefi.net',
    userType: UserType.INVESTOR,
    defaultWallet: '0x3D05d31EDf286D93ae78DdC6E0Ee0163f3aA8206',
    wallets: [
      {
        address: '0x3D05d31EDf286D93ae78DdC6E0Ee0163f3aA8206',
        type: WalletType.VAULT,
        newType: EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        data: {},
      },
    ],
    userNature: UserNature.NATURAL,
    data: {
      clientName: 'fakeClientName',
      userType: UserType.INVESTOR,
      registrationEmailSent: true,
      ...(overrideUserData || {}),
    },
    ...(overrideUser || {}),
  };
};
