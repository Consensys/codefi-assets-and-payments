import {
  IToken,
  IWorkflowInstance,
} from '../src/routes/Issuer/AssetIssuance/templatesTypes';
import { Network } from '../src/types/Network';
import { IUser, UserNature, UserType } from '../src/User';
import { Hold, HoldStatusCode } from '../src/types/Trades.d';
import { generateCode } from '../src/utils/commonUtils';

export const craftTokenStub = (overrideValues?: any): IToken => {
  return {
    id: generateCode(),
    tenantId: generateCode(),
    issuerId: generateCode(),
    name: 'Token Name',
    creatorId: generateCode(),
    reviewerId: undefined,
    symbol: 'TOK',
    standard: 'ERC1400HoldableCertificateToken',
    defaultDeployment: '0xF4Ff1641383226Ea68F623D3FD51Ae855E1b9665',
    defaultChainId: '10',
    defaultNetworkKey: null,
    deployments: [],
    description: null,
    picture: null,
    bankAccount: null,
    assetClasses: ['classa'],
    behaviours: null,
    assetTemplateId: 'assetTemplateId',
    data: {
      assetCreationFlow: 'SINGLE_PARTY',
      kycTemplateId: 12345,
      bypassKycChecks: true,
      certificateActivated: false,
    },
    ...overrideValues,
  };
};

export const craftUserStub = (overrideValues?: any): IUser => {
  return {
    id: generateCode(),
    firstConnectionCode: generateCode(),
    superUserId: generateCode(),
    userType: UserType.INVESTOR,
    userNature: UserNature.NATURAL,
    email: 'test@test.com',
    firstName: 'John',
    lastName: 'Doe',
    defaultWallet: '0xD7A4F9873bcEf7dd7B740BA8DA6caC05ea7A0347',
    wallets: [
      {
        walletAddress: '0xD7A4F9873bcEf7dd7B740BA8DA6caC05ea7A0347',
        walletType: '',
      },
    ],
    data: {
      registrationLink: '',
    },
    createdAt: Date.now(),
    ...overrideValues,
  };
};

export const craftNetworkStub = (overrideValues?: any): Network => {
  return {
    tenantId: generateCode(),
    name: 'Test Network',
    key: 'testnet',
    chainId: '543210',
    type: 'pos',
    description: 'Test Network',
    ethRequired: true,
    kaleido: false,
    ace: '0x6f143F72f1214ade68d2edC7aC8fE876C8f86B7C',
    faucetMinEthValue: '300000000000000000',
    symbol: 'ETH',
    rpcEndpoint:
      'https://polygon-mumbai.infura.io/v3/7203f9a4d3af4664890c64b0ddf02a3d',
    ...overrideValues,
  };
};

export const craftHoldStub = (overrideValues?: any): Hold => {
  return {
    id: '0x2abc237c5c169b403611b8163cdbeeed1848456a98b9489a4556a70a994722b8',
    partition:
      '0x697373756564000000000000636c617373610000000000000000000000000000',
    sender: '0xD7A4F9873bcEf7dd7B740BA8DA6caC05ea7A0347',
    recipient: '0xb0018D75DBa502484e65b1B8804765cabAe2A835',
    notary: '0xDa1392b462A9469454F43a3f4cc714998f831212',
    value: '10000000000000000000',
    expiration: String(new Date().getTime() / 1000 + 864000), // expires in 10 days
    secretHash:
      '0x353c05bb58b1d677cce3c8f16904f346f741d862c22df09ff496b16b69eee990',
    secret:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    status: '1',
    statusReadable: HoldStatusCode.ORDERED,
    valueReadable: 10,
    ...overrideValues,
  };
};

export const craftWorkflowInstanceStub = (
  overrideValues?: any,
): IWorkflowInstance => {
  return {
    id: 427099,
    tenantId: '3f3lZL9aZlUOCPwIKEEBqaBhhCziZcB7',
    brokerId: null,
    idempotencyKey: 'l8vUCtPS-iBuVbphE-rk4kIgWx-pmQADmaz',
    name: 'forceCreateAcceptedTradeOrder',
    workflowType: 'ORDER',
    objectId: null,
    state: 'accepted',
    role: 'ISSUER',
    workflowTemplateId: 139,
    userId: 'dcfdbf91-77e9-4163-b878-7f26aeeac454',
    recipientId: 'a330eb39-1819-4996-9960-241bb6af8a67',
    entityId: 'fa4d25db-7157-4be7-aa38-643960555293',
    entityType: 'TOKEN',
    wallet: '0xD7A4F9873bcEf7dd7B740BA8DA6caC05ea7A0347',
    date: '2022-04-06T18:21:40.722Z',
    assetClassKey: 'classa',
    quantity: 100,
    price: 10,
    documentId: null,
    paymentId: 'HTX8TMS3',
    offerId: null,
    orderSide: 'SELL',
    data: {
      type: 'QUANTITY',
      paymentAccountAddress: '0x22069582FF12B9F977EAe8741689eD7480339D38',
      dvp: {
        type: 'ATOMIC',
        dvpAddress: '0x578aD8058F76Cd8f24e7450f7BdD7FE0227d3992',
        recipient: {
          id: 'a330eb39-1819-4996-9960-241bb6af8a67',
        },
        delivery: {
          tokenAddress: '0xF4Ff1641383226Ea68F623D3FD51Ae855E1b9665',
          tokenStandard: 'ERC1400HoldableCertificateToken',
          holdId:
            '0xefa26218f0dbdcde9be033a96057e90db77c11fd0954c877ce57a4bf43f08ff1',
        },
        payment: {
          tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          holdId:
            '0x2abc237c5c169b403611b8163cdbeeed1848456a98b9489a4556a70a994722b8',
          tokenStandard: 'ERC1400HoldableCertificateToken',
        },
        htlcSecret: {
          owner: '0928bdef-0164-4a4b-b4eb-8c4ae1c83ddf',
          secretEncrypted:
            '397c68108b9a007c54a64f702751bb7af66642a3721e5d0be97fd1d036b4ef7f2df7a740377ddb7a5273ad909404c23131828f6c5b5b4c35d4204c3e44a72834f091',
          secretHash:
            '0xce64fcb786b58de2ee2e6bce89f117f615def530e1d9b6346253217673c31a1f',
        },
      },
      stateUpdatedTimestamps: {
        '1649269300723': 'accepted',
      },
      txSignerId: '0928bdef-0164-4a4b-b4eb-8c4ae1c83ddf',
      walletUsed: {
        address: '0x7315D7C1B535e6BaB8CFf90149B29aA7743e9ad8',
        newType: 'INTERNAL_CODEFI_HASHICORP_VAULT',
        data: {},
      },
      nextStatus: 'outstanding',
      transaction: {
        outstanding: {
          status: 'pending',
          transactionId: '069c3732-4643-4994-a1d4-68a26f151a70',
        },
      },
      isLedgerTx: false,
    },
    createdAt: '2022-04-06T18:21:40.837Z',
    updatedAt: '2022-04-06T18:21:44.748Z',
    ...overrideValues,
  };
};

export const craftTokensStub = (
  length: number,
  overrideValues?: any,
): IToken[] => {
  const tokens = [];
  for (let x = 0; x < length; x++)
    tokens.push(
      craftTokenStub({
        name: `Token ${x}`,
        symbol: `TOK${x}`,
        ...overrideValues,
      }),
    );
  return tokens;
};

export const craftNetworksStub = (
  length: number,
  overrideValues?: any,
): Network[] => {
  const networks = [];
  for (let x = 0; x < length; x++)
    networks.push(
      craftNetworkStub({
        key: `testnet${x}`,
        name: `Test Network ${x}`,
        chainId: x,
        ...overrideValues,
      }),
    );
  return networks;
};

export const craftUsersStub = (
  length: number,
  overrideValues?: any,
): IUser[] => {
  const users = [];
  for (let x = 0; x < length; x++)
    users.push(
      craftUserStub({
        firstName: `John`,
        lastName: `Doe ${x}`,
        email: `test-${x}@test.com`,
        ...overrideValues,
      }),
    );
  return users;
};
