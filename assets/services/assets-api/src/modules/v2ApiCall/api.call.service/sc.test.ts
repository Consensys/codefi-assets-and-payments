import createMockInstance from 'jest-create-mock-instance';
import { ApiCallHelperService } from '.';

import RedisCache from 'ioredis-cache';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import { of } from 'rxjs';

import { HttpService } from '@nestjs/axios';
import { ApiSCCallService } from './sc';
import { SmartContract } from 'src/types/smartContract';

import { keys as NetworkKeys } from 'src/types/network';
import { EthServiceType, keys as EthServiceKeys } from 'src/types/ethService';
import web3Utils from 'web3-utils';
import { ApiEntityCallService } from './entity';
import config from 'src/config';

// Mock Redis client
jest.mock('ioredis');
// Mock Redis cache client
jest.mock('ioredis-cache');

const RedisCacheMock = RedisCache as jest.Mocked<typeof RedisCache>;

const SC_HOST: string = config().smartContractApi.url;
const FUNDER_ADDRESS: string = process.env.FUNDER_ADDRESS;

const mockCallerId = '6f7d2148-50ba-4068-9947-8a4b1801e57f';
const mockTokenAddresses = [
  '0xFDeda15e2922C5ed41fc1fdF36DA2FB2623666b3',
  '0xD19e38c05Ec58817DD2545E65DF24955327109E6',
];
const mockTokenHolders = [
  '0x5eB2bb51575073C41A71332141d729eA0D3D499d',
  '0x2240Be135A442Cb6EfbD95459e48354FcE14b595',
];
const mockAddresses = {
  [SmartContract.BATCH_READER]: '0x3Cfe91640c1F158019B7D75A72e55b4BC52B15a7',
};
const mockContractsDeployed = {
  [SmartContract.BATCH_READER]: {
    deployed: true,
    address: mockAddresses[SmartContract.BATCH_READER],
  },
};
const mockDeployerAddresses = [
  {
    key: 'codefi_assets_dev_network',
    deployer: '0xf24339a4451510a461563f5044260b22d6dadead',
  },
  {
    key: 'mainnet',
    deployer: '0xf24339a4451510a461563f5044260b22d6dadead',
  },
  {
    key: 'rinkeby',
    deployer: '0xf24339a4451510a461563f5044260b22d6dadead',
  },
  {
    key: 'codefi_assets_bot_dev_network_2',
    deployer: '0xf24339a4451510a461563f5044260b22d6dadead',
  },
];
const mockEthService = {
  type: EthServiceType.WEB3,
  data: {
    tenantId: 'codefi',
    name: 'Codefi Assets Dev Network',
    key: 'codefi_assets_dev_network',
    chainId: '118174032',
    type: 'poa',
    urls: undefined,
    description:
      'Codefi Assets Dev, is a private Kaleido network setup for development',
    ethRequired: false,
    kaleido: true,
    ace: '0x8cec219d10fe2617d207d686df46f0c5b43bc5fd',
    rpcEndpoint:
      'https://e0bwzpx1vh:85Fhl87PZbBHlKSWFecxCu3j89RlOulIEJACDHZzM_U@e0yt00jvmm-e0rlauwjnb-rpc.de0-aws.kaleido.io',
    faucetMnemonic: undefined,
    symbol: 'ETH',
    faucetMinEthValue: '300000000000000000',
  },
};

const mockBatchReaderContract = {
  deployed: true,
  address: '0x3Cfe91640c1F158019B7D75A72e55b4BC52B15a7',
};

const urls = {
  batchERC1400Balances: `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchERC1400Balances`,
  batchERC20Balances: `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchERC20Balances`,
  batchTokenExtensionSetup: `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchTokenExtensionSetup`,
  batchTokenRolesInfos: `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchTokenRolesInfos`,
  batchTokenSuppliesInfos: `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchTokenSuppliesInfos`,
  batchValidations: `${SC_HOST}/call/${SmartContract.BATCH_READER}/batchValidations`,
  getDeployerAddress: `${SC_HOST}/generic/get-deployer-address`,
  getInterfaceImplementer: `${SC_HOST}/call/ERC1820Registry/getInterfaceImplementer`,
};

const mockBatchTokenSuppliesInfos = {
  ['0']: ['11111000000000000000000', '10000000000000000000000'],
  ['1']: ['1', '1'],
  ['2']: [
    '0x697373756564000000000000636c617373610000000000000000000000000000',
    '0x697373756564000000000000636c617373610000000000000000000000000000',
  ],
  ['3']: ['11111000000000000000000', '10000000000000000000000'],
  ['4']: ['0', '0'],
  ['5']: [],
};

const mockBatchTokenRolesInfos = {
  ['0']: [
    '0x14458D14dfc6a048D91C91a01988b0E5d8C66167',
    '0x14458D14dfc6a048D91C91a01988b0E5d8C66167',
  ],
  ['1']: ['1', '1'],
  ['2']: [
    '0x14458D14dfc6a048D91C91a01988b0E5d8C66167',
    '0x14458D14dfc6a048D91C91a01988b0E5d8C66167',
  ],
  ['3']: ['1', '1'],
  ['4']: [
    '0x14458D14dfc6a048D91C91a01988b0E5d8C66167',
    '0x14458D14dfc6a048D91C91a01988b0E5d8C66167',
  ],
};

const mockBatchTokenExtensionSetup = {
  ['0']: [
    '0x0b0b350C14A443FC8a75459F5B9637f7D7897186',
    '0x0b0b350C14A443FC8a75459F5B9637f7D7897186',
  ],
  ['1']: ['2', '2'],
  ['2']: [true, true],
  ['3']: [true, true],
  ['4']: [true, true],
  ['5']: [true, true],
};

const mockBatchERC20Balances = {
  ['0']: ['0'],
  ['1']: ['11111000000000000000000', '10000000000000000000000'],
};

const mockBatchERC1400Balances = {
  ['0']: ['0'],
  ['1']: ['11111000000000000000000', '10000000000000000000000'],
  ['2']: ['1', '1'],
  ['3']: [
    '0x697373756564000000000000636c617373610000000000000000000000000000',
    '0x697373756564000000000000636c617373610000000000000000000000000000',
  ],
  ['4']: ['11111000000000000000000', '10000000000000000000000'],
  ['5']: ['11111000000000000000000', '9000000000000000000000'],
};

const mockBatchValidations = { ['0']: [true, false], ['1']: [false, false] };

const getHttpResponse = (url, paramObject) => {
  const params = paramObject.params;

  if (url === urls.batchERC1400Balances) {
    return mockBatchERC1400Balances;
  } else if (url === urls.batchERC20Balances) {
    return mockBatchERC20Balances;
  } else if (url === urls.batchTokenExtensionSetup) {
    return mockBatchTokenExtensionSetup;
  } else if (url === urls.batchTokenRolesInfos) {
    return mockBatchTokenRolesInfos;
  } else if (url === urls.batchTokenSuppliesInfos) {
    return mockBatchTokenSuppliesInfos;
  } else if (url === urls.batchValidations) {
    return mockBatchValidations;
  } else if (url === urls.getDeployerAddress) {
    return mockDeployerAddresses;
  } else if (url === urls.getInterfaceImplementer) {
    let mockInterfaceImplementer;

    if (
      params._interfaceHash ===
      web3Utils.soliditySha3(SmartContract.BATCH_READER)
    ) {
      mockInterfaceImplementer = mockAddresses[SmartContract.BATCH_READER];
    } else {
      throw new Error('crash');
    }
    return mockInterfaceImplementer;
  } else {
    throw new Error('crash');
  }
};

const redisGetResponse = {
  '4d3b801c21fcec03a382e2555226a81a': {
    value: mockDeployerAddresses,
  },
  '1b581e3b93dff6d1e30a34b0facf22a5': {
    value: mockAddresses[SmartContract.BATCH_READER],
  },
  '858e5bcdc0bbd969e6cf9c03c5ddb1ec': {
    value: mockBatchTokenSuppliesInfos,
  },
};

describe('ApiSCCallService', () => {
  let service: ApiSCCallService;
  let loggerMock: NestJSPinoLogger;
  let httpServiceMock: jest.Mocked<HttpService>;
  let apiCallHelperServiceMock: ApiCallHelperService;
  let apiEntityCallServiceMock: ApiEntityCallService;

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger);
    httpServiceMock = createMockInstance(HttpService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);
    Object.defineProperty(httpServiceMock, 'axiosRef', {
      value: {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      },
    });

    apiCallHelperServiceMock = new ApiCallHelperService();

    service = new ApiSCCallService(
      loggerMock,
      httpServiceMock,
      apiCallHelperServiceMock,
      apiEntityCallServiceMock,
    );

    httpServiceMock.get.mockImplementation((url, paramsObject) =>
      of({
        data: getHttpResponse(url, paramsObject),
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      }),
    );

    (RedisCacheMock.prototype.getCache as jest.Mock).mockImplementation(() =>
      Promise.resolve(redisGetResponse),
    );
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('batchTokenSuppliesInfos', () => {
    it('returns batch token supplies info (from request)', async () => {
      (RedisCacheMock.prototype.getCache as jest.Mock).mockImplementation(() =>
        Promise.resolve(),
      );
      await expect(
        service.batchTokenSuppliesInfos(
          mockCallerId,
          mockTokenAddresses,
          mockEthService,
        ),
      ).resolves.toEqual(mockBatchTokenSuppliesInfos);

      expect(httpServiceMock.get).toBeCalledTimes(3);

      expect(httpServiceMock.get).toHaveBeenCalledWith(
        urls.batchTokenSuppliesInfos,
        {
          params: {
            tokens: mockTokenAddresses,
            contractAddress:
              mockContractsDeployed[SmartContract.BATCH_READER].address,
            signerAddress: FUNDER_ADDRESS,
            chain: mockEthService[EthServiceKeys.DATA][NetworkKeys.KEY],
          },
        },
      );
    });
    it('returns batch token supplies info (from cache)', async () => {
      await expect(
        service.batchTokenSuppliesInfos(
          mockCallerId,
          mockTokenAddresses,
          mockEthService,
        ),
      ).resolves.toEqual(mockBatchTokenSuppliesInfos);

      expect(httpServiceMock.get).toBeCalledTimes(0);
    });
  });

  describe('batchTokenRolesInfos', () => {
    it('returns batch token roles info (from request)', async () => {
      await expect(
        service.batchTokenRolesInfos(
          mockCallerId,
          mockTokenAddresses,
          mockEthService,
        ),
      ).resolves.toEqual(mockBatchTokenRolesInfos);

      expect(httpServiceMock.get).toBeCalledTimes(1);

      expect(httpServiceMock.get).toHaveBeenCalledWith(
        urls.batchTokenRolesInfos,
        {
          params: {
            tokens: mockTokenAddresses,
            contractAddress:
              mockContractsDeployed[SmartContract.BATCH_READER].address,
            signerAddress: FUNDER_ADDRESS,
            chain: mockEthService[EthServiceKeys.DATA][NetworkKeys.KEY],
          },
        },
      );
    });
    it('returns batch token roles info (from cache)', async () => {
      await expect(
        service.batchTokenRolesInfos(
          mockCallerId,
          mockTokenAddresses,
          mockEthService,
        ),
      ).resolves.toEqual(mockBatchTokenRolesInfos);

      expect(httpServiceMock.get).toBeCalledTimes(0);
    });
  });

  describe('batchTokenExtensionSetup', () => {
    it('returns batch token extensions setup (from request)', async () => {
      await expect(
        service.batchTokenExtensionSetup(
          mockCallerId,
          mockTokenAddresses,
          mockEthService,
        ),
      ).resolves.toEqual(mockBatchTokenExtensionSetup);

      expect(httpServiceMock.get).toBeCalledTimes(1);

      expect(httpServiceMock.get).toHaveBeenCalledWith(
        urls.batchTokenExtensionSetup,
        {
          params: {
            tokens: mockTokenAddresses,
            contractAddress:
              mockContractsDeployed[SmartContract.BATCH_READER].address,
            signerAddress: FUNDER_ADDRESS,
            chain: mockEthService[EthServiceKeys.DATA][NetworkKeys.KEY],
          },
        },
      );
    });
    it('returns batch token extensions setup (from cache)', async () => {
      await expect(
        service.batchTokenExtensionSetup(
          mockCallerId,
          mockTokenAddresses,
          mockEthService,
        ),
      ).resolves.toEqual(mockBatchTokenExtensionSetup);

      expect(httpServiceMock.get).toBeCalledTimes(0);
    });
  });

  describe('subBatchERC20Balances', () => {
    it('returns batch ERC20 balances (from request)', async () => {
      await expect(
        service.subBatchERC20Balances(
          mockCallerId,
          mockTokenAddresses,
          mockTokenHolders,
          mockEthService,
          mockBatchReaderContract,
          1,
          1,
        ),
      ).resolves.toEqual(mockBatchERC20Balances);

      expect(httpServiceMock.get).toBeCalledTimes(1);

      expect(httpServiceMock.get).toHaveBeenCalledWith(
        urls.batchERC20Balances,
        {
          params: {
            tokens: mockTokenAddresses,
            tokenHolders: mockTokenHolders,
            contractAddress:
              mockContractsDeployed[SmartContract.BATCH_READER].address,
            signerAddress: FUNDER_ADDRESS,
            chain: mockEthService[EthServiceKeys.DATA][NetworkKeys.KEY],
          },
        },
      );
    });
    it('returns batch ERC20 balances (from cache)', async () => {
      await expect(
        service.subBatchERC20Balances(
          mockCallerId,
          mockTokenAddresses,
          mockTokenHolders,
          mockEthService,
          mockBatchReaderContract,
          1,
          1,
        ),
      ).resolves.toEqual(mockBatchERC20Balances);

      expect(httpServiceMock.get).toBeCalledTimes(0);
    });
  });

  describe('subBatchERC1400Balances', () => {
    it('returns batch ERC1400 balances (from request)', async () => {
      await expect(
        service.subBatchERC1400Balances(
          mockCallerId,
          mockTokenAddresses,
          mockTokenHolders,
          mockEthService,
          mockBatchReaderContract,
          1,
          1,
        ),
      ).resolves.toEqual(mockBatchERC1400Balances);

      expect(httpServiceMock.get).toBeCalledTimes(1);

      expect(httpServiceMock.get).toHaveBeenCalledWith(
        urls.batchERC1400Balances,
        {
          params: {
            tokens: mockTokenAddresses,
            tokenHolders: mockTokenHolders,
            contractAddress:
              mockContractsDeployed[SmartContract.BATCH_READER].address,
            signerAddress: FUNDER_ADDRESS,
            chain: mockEthService[EthServiceKeys.DATA][NetworkKeys.KEY],
          },
        },
      );
    });
    it('returns batch ERC1400 balances (from cache)', async () => {
      await expect(
        service.subBatchERC1400Balances(
          mockCallerId,
          mockTokenAddresses,
          mockTokenHolders,
          mockEthService,
          mockBatchReaderContract,
          1,
          1,
        ),
      ).resolves.toEqual(mockBatchERC1400Balances);

      expect(httpServiceMock.get).toBeCalledTimes(0);
    });
  });

  describe('subBatchValidations', () => {
    it('returns batch validations (from request)', async () => {
      await expect(
        service.subBatchValidations(
          mockCallerId,
          mockTokenAddresses,
          mockTokenHolders,
          mockEthService,
          mockBatchReaderContract,
          1,
          1,
        ),
      ).resolves.toEqual(mockBatchValidations);

      expect(httpServiceMock.get).toBeCalledTimes(1);

      expect(httpServiceMock.get).toHaveBeenCalledWith(urls.batchValidations, {
        params: {
          tokens: mockTokenAddresses,
          tokenHolders: mockTokenHolders,
          contractAddress:
            mockContractsDeployed[SmartContract.BATCH_READER].address,
          signerAddress: FUNDER_ADDRESS,
          chain: mockEthService[EthServiceKeys.DATA][NetworkKeys.KEY],
        },
      });
    });
    it('returns batch validations (from cache)', async () => {
      await expect(
        service.subBatchValidations(
          mockCallerId,
          mockTokenAddresses,
          mockTokenHolders,
          mockEthService,
          mockBatchReaderContract,
          1,
          1,
        ),
      ).resolves.toEqual(mockBatchValidations);

      expect(httpServiceMock.get).toBeCalledTimes(0);
    });
  });
});
