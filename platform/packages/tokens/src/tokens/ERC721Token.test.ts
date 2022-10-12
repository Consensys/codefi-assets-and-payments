import { ContractManager } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { ApmService } from '@codefi-assets-and-payments/observability'
import { createMockInstance } from 'jest-create-mock-instance'
import {
  idemPotencyKeyMock,
  authTokenMock,
  headersMock,
  addressMock,
  initialSupplyMock,
  tokenNameMock,
  tokenSymbolMock,
  transactionConfigMock,
  uuidMock,
  senderAddressMock,
  contractAddressMock,
  tokenIdMock,
  labelsMock,
  apmTraceParentMock,
} from '../../test/mock'
import { ERC721Token } from './ERC721Token'

describe('ERC721Token', () => {
  let token: ERC721Token
  let contractManagerMock: jest.Mocked<ContractManager>
  let apmServiceMock: jest.Mocked<ApmService>

  beforeEach(() => {
    contractManagerMock = createMockInstance(ContractManager)
    apmServiceMock = createMockInstance(ApmService)

    contractManagerMock.deploy.mockImplementationOnce(async () => uuidMock)
    contractManagerMock.exec.mockImplementationOnce(async () => uuidMock)

    apmServiceMock.getCurrentTraceparent.mockReturnValue(apmTraceParentMock)

    token = new ERC721Token(contractManagerMock, apmServiceMock)
  })

  describe('create token', () => {
    it('success', async () => {
      const response = await token.create(
        tokenNameMock,
        tokenSymbolMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.deploy).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.deploy).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        transactionConfigMock,
        [tokenNameMock, tokenSymbolMock],
        'constructor(string,string)',
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

  describe('mint token', () => {
    it('success', async () => {
      const response = await token.mint(
        addressMock,
        tokenIdMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        'mint(address,uint256)',
        transactionConfigMock,
        [addressMock, tokenIdMock],
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

  describe('safeMint token', () => {
    it('success', async () => {
      const response = await token.safeMint(
        addressMock,
        tokenIdMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        'safeMint(address,uint256)',
        transactionConfigMock,
        [addressMock, tokenIdMock],
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

  describe('safe mint with data token', () => {
    it('success', async () => {
      const response = await token.safeMintWithData(
        addressMock,
        tokenIdMock,
        '123',
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        'safeMint(address,uint256,bytes)',
        transactionConfigMock,
        [addressMock, tokenIdMock, '123'],
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
        tokenIdMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        'approve(address,uint256)',
        transactionConfigMock,
        [addressMock, tokenIdMock],
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

  describe('setApproveForAll', () => {
    it('success', async () => {
      const response = await token.setApprovalForAll(
        addressMock,
        true,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        'setApprovalForAll(address,bool)',
        transactionConfigMock,
        [addressMock, true],
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
        tokenIdMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        'transferFrom(address,address,uint256)',
        transactionConfigMock,
        [senderAddressMock, addressMock, tokenIdMock],
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

  describe('safeTransferFrom', () => {
    it('success', async () => {
      const response = await token.safeTransferFrom(
        senderAddressMock,
        addressMock,
        tokenIdMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        'safeTransferFrom(address,address,uint256)',
        transactionConfigMock,
        [senderAddressMock, addressMock, tokenIdMock],
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

  describe('safeTransferWithData', () => {
    it('success', async () => {
      const response = await token.safeTransferFromWithData(
        senderAddressMock,
        addressMock,
        tokenIdMock,
        '123',
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        'safeTransferFrom(address,address,uint256,bytes)',
        transactionConfigMock,
        [senderAddressMock, addressMock, tokenIdMock, '123'],
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
        ERC721Token.ERC721_CONTRACT_NAME,
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
        ERC721Token.ERC721_CONTRACT_NAME,
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

  describe('setTokenURI', () => {
    it('success', async () => {
      const response = await token.setTokenURI(
        '500',
        'testURI',
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
        labelsMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        'setTokenURI(uint256,string)',
        transactionConfigMock,
        ['500', 'testURI'],
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
        ERC721Token.ERC721_CONTRACT_NAME,
        transactionConfigMock,
        'balanceOf(address)',
        contractAddressMock,
        [senderAddressMock],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual('1000')
    })

    it('ownerOf - success', async () => {
      contractManagerMock.call.mockImplementationOnce(async () => addressMock)

      const response = await token.ownerOf(
        tokenIdMock,
        contractAddressMock,
        transactionConfigMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.call).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.call).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        transactionConfigMock,
        'ownerOf(uint256)',
        contractAddressMock,
        [tokenIdMock],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(addressMock)
    })

    it('gteApproved - success', async () => {
      contractManagerMock.call.mockImplementationOnce(async () => addressMock)

      const response = await token.getApproved(
        tokenIdMock,
        contractAddressMock,
        transactionConfigMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.call).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.call).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        transactionConfigMock,
        'getApproved(uint256)',
        contractAddressMock,
        [tokenIdMock],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(addressMock)
    })

    it('isApprovedForAll - success', async () => {
      contractManagerMock.call.mockImplementationOnce(async () => true)

      const response = await token.isApprovedForAll(
        senderAddressMock,
        addressMock,
        contractAddressMock,
        transactionConfigMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.call).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.call).toHaveBeenCalledWith(
        ERC721Token.ERC721_CONTRACT_NAME,
        transactionConfigMock,
        'isApprovedForAll(address,address)',
        contractAddressMock,
        [senderAddressMock, addressMock],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(true)
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
        ERC721Token.ERC721_CONTRACT_NAME,
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
        ERC721Token.ERC721_CONTRACT_NAME,
        transactionConfigMock,
        'symbol()',
        contractAddressMock,
        [],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual('TMD')
    })
  })
})
