import { ContractManager } from '@codefi-assets-and-payments/nestjs-orchestrate'

import { ERC20Token } from './ERC20Token'
import { createMockInstance } from 'jest-create-mock-instance'
import {
  idemPotencyKeyMock,
  authTokenMock,
  headersMock,
  addressMock,
  initialSupplyMock,
  tokenDecimalsMock,
  tokenNameMock,
  tokenSymbolMock,
  transactionConfigMock,
  uuidMock,
  senderAddressMock,
  contractAddressMock,
  labelsMock,
  apmTraceParentMock,
} from '../../test/mock'
import { ApmService } from '@codefi-assets-and-payments/observability'

describe('ERC20Token', () => {
  let token: ERC20Token
  let contractManagerMock: jest.Mocked<ContractManager>
  let apmServiceMock: jest.Mocked<ApmService>

  beforeEach(() => {
    contractManagerMock = createMockInstance(ContractManager)
    apmServiceMock = createMockInstance(ApmService)

    contractManagerMock.deploy.mockImplementationOnce(async () => uuidMock)
    contractManagerMock.exec.mockImplementationOnce(async () => uuidMock)

    apmServiceMock.getCurrentTraceparent.mockReturnValue(apmTraceParentMock)

    token = new ERC20Token(contractManagerMock, apmServiceMock)
  })

  describe('create token', () => {
    it('success', async () => {
      const response = await token.create(
        'tokenMocked',
        'TMD',
        5,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.deploy).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.deploy).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        transactionConfigMock,
        [tokenNameMock, tokenSymbolMock, tokenDecimalsMock],
        'constructor(string,string,uint8)',
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        {
          apmTraceParent: apmTraceParentMock,
          ...labelsMock,
        },
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('transfer tokens', () => {
    it('success', async () => {
      const response = await token.transfer(
        addressMock,
        '500',
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        'transfer(address,uint256)',
        transactionConfigMock,
        [addressMock, '500'],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        {
          apmTraceParent: apmTraceParentMock,
          ...labelsMock,
        },
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('approve', () => {
    it('success', async () => {
      const response = await token.approve(
        addressMock,
        '500',
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        'approve(address,uint256)',
        transactionConfigMock,
        [addressMock, '500'],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        {
          apmTraceParent: apmTraceParentMock,
          ...labelsMock,
        },
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('transferFrom', () => {
    it('success', async () => {
      const response = await token.transferFrom(
        senderAddressMock,
        addressMock,
        '500',
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        'transferFrom(address,address,uint256)',
        transactionConfigMock,
        [senderAddressMock, addressMock, '500'],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        {
          apmTraceParent: apmTraceParentMock,
          ...labelsMock,
        },
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('mint', () => {
    it('success', async () => {
      const response = await token.mint(
        senderAddressMock,
        '500',
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        'mint(address,uint256)',
        transactionConfigMock,
        [senderAddressMock, '500'],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        {
          apmTraceParent: apmTraceParentMock,
          ...labelsMock,
        },
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('transferOwnership', () => {
    it('success', async () => {
      const response = await token.transferOwnership(
        senderAddressMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        'transferOwnership(address)',
        transactionConfigMock,
        [senderAddressMock],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        {
          apmTraceParent: apmTraceParentMock,
          ...labelsMock,
        },
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('burn', () => {
    it('success', async () => {
      const response = await token.burn(
        '500',
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        'burn(uint256)',
        transactionConfigMock,
        ['500'],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        {
          apmTraceParent: apmTraceParentMock,
          ...labelsMock,
        },
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('view functions', () => {
    it('balanceOf - success', async () => {
      contractManagerMock.call.mockImplementationOnce(
        async () => initialSupplyMock,
      )

      const response = await token.balanceOf(
        senderAddressMock,
        contractAddressMock,
        transactionConfigMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.call).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.call).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        transactionConfigMock,
        'balanceOf(address)',
        contractAddressMock,
        [senderAddressMock],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual('1000')
    })

    it('totalSupply - success', async () => {
      contractManagerMock.call.mockImplementationOnce(
        async () => initialSupplyMock,
      )

      const response = await token.totalSupply(
        contractAddressMock,
        transactionConfigMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.call).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.call).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        transactionConfigMock,
        'totalSupply()',
        contractAddressMock,
        [],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual('1000')
    })

    it('name - success', async () => {
      contractManagerMock.call.mockImplementationOnce(async () => tokenNameMock)

      const response = await token.name(
        contractAddressMock,
        transactionConfigMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.call).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.call).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        transactionConfigMock,
        'name()',
        contractAddressMock,
        [],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual('tokenMocked')
    })

    it('symbol - success', async () => {
      contractManagerMock.call.mockImplementationOnce(
        async () => tokenSymbolMock,
      )

      const response = await token.symbol(
        contractAddressMock,
        transactionConfigMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.call).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.call).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        transactionConfigMock,
        'symbol()',
        contractAddressMock,
        [],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual('TMD')
    })

    it('decimals - success', async () => {
      contractManagerMock.call.mockImplementationOnce(
        async () => tokenDecimalsMock,
      )

      const response = await token.decimals(
        contractAddressMock,
        transactionConfigMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.call).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.call).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        transactionConfigMock,
        'decimals()',
        contractAddressMock,
        [],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(5)
    })
    it('allowance - success', async () => {
      contractManagerMock.call.mockImplementationOnce(async () => 100)

      const response = await token.allowance(
        '0x',
        senderAddressMock,
        contractAddressMock,
        transactionConfigMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.call).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.call).toHaveBeenCalledWith(
        ERC20Token.ERC20_CONTRACT_NAME,
        transactionConfigMock,
        'allowance(address,address)',
        contractAddressMock,
        ['0x', senderAddressMock],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(100)
    })
  })
})
