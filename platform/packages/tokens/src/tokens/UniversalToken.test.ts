import { ContractManager } from '@codefi-assets-and-payments/nestjs-orchestrate'
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
  contractAddressMock,
  dateMock,
  recipientAddressMock,
} from '../../test/mock'
import { CertificateValidation, UniversalToken } from './UniversalToken'

describe('UniversalToken', () => {
  let token: UniversalToken
  let contractManagerMock: jest.Mocked<ContractManager>

  beforeEach(() => {
    contractManagerMock = createMockInstance(ContractManager)

    contractManagerMock.deploy.mockImplementationOnce(async () => uuidMock)
    contractManagerMock.exec.mockImplementationOnce(async () => uuidMock)

    token = new UniversalToken(contractManagerMock)
  })

  describe('create token', () => {
    it('success', async () => {
      const response = await token.create(
        tokenNameMock,
        tokenSymbolMock,
        '5',
        [],
        [],
        contractAddressMock,
        addressMock,
        contractAddressMock,
        CertificateValidation.None,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.deploy).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.deploy).toHaveBeenCalledWith(
        UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
        transactionConfigMock,
        [
          tokenNameMock,
          tokenSymbolMock,
          '5',
          [],
          [],
          contractAddressMock,
          addressMock,
          contractAddressMock,
          CertificateValidation.None,
        ],
        'constructor(string,string,uint256,address[],bytes32[],address,address,address,CertificateValidation)',
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('setTokenExtension', () => {
    it('success', async () => {
      const response = await token.setTokenExtension(
        contractAddressMock,
        '',
        true,
        true,
        true,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
        'setTokenExtension(address, string, bool, bool, bool)',
        transactionConfigMock,
        [contractAddressMock, '', true, true, true],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('issueByPartition', () => {
    it('success', async () => {
      const response = await token.issueByPartition(
        contractAddressMock,
        addressMock,
        '100',
        dateMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
        'issueByPartition(bytes32 , address, uint256, bytes)',
        transactionConfigMock,
        [contractAddressMock, addressMock, '100', dateMock],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('issueByPartition', () => {
    it('success', async () => {
      const response = await token.issueByPartition(
        contractAddressMock,
        addressMock,
        '100',
        dateMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
        'issueByPartition(bytes32 , address, uint256, bytes)',
        transactionConfigMock,
        [contractAddressMock, addressMock, '100', dateMock],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('transferByPartition', () => {
    it('success', async () => {
      const response = await token.transferByPartition(
        contractAddressMock,
        addressMock,
        '100',
        dateMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
        'transferByPartition(bytes32,address,uint256,bytes)',
        transactionConfigMock,
        [contractAddressMock, addressMock, '100', dateMock],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('redeemByPartition', () => {
    it('success', async () => {
      const response = await token.redeemByPartition(
        contractAddressMock,
        '100',
        dateMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
        'redeemByPartition(bytes32,uint256,bytes)',
        transactionConfigMock,
        [contractAddressMock, '100', dateMock],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('operatorTransferByPartition', () => {
    it('success', async () => {
      const response = await token.operatorTransferByPartition(
        contractAddressMock,
        addressMock,
        recipientAddressMock,
        '100',
        dateMock,
        dateMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
        'operatorTransferByPartition(bytes32,address,address,uint256,bytes,bytes)',
        transactionConfigMock,
        [
          contractAddressMock,
          addressMock,
          recipientAddressMock,
          '100',
          dateMock,
          dateMock,
        ],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('operatorRedeemByPartition', () => {
    it('success', async () => {
      const response = await token.operatorRedeemByPartition(
        contractAddressMock,
        addressMock,
        '100',
        dateMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
        'operatorRedeemByPartition(bytes32,address,uint256,bytes)',
        transactionConfigMock,
        [contractAddressMock, addressMock, '100', expect.any(String)],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('transferOwnership', () => {
    it('success', async () => {
      const response = await token.transferOwnership(
        addressMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
        'transferOwnership(address)',
        transactionConfigMock,
        [addressMock],
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('view functions', () => {
    it('controllers - success', async () => {
      contractManagerMock.call.mockImplementationOnce(
        async () => initialSupplyMock,
      )

      const response = await token.controllers(
        contractAddressMock,
        transactionConfigMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.call).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.call).toHaveBeenCalledWith(
        UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
        transactionConfigMock,
        'controllers()',
        contractAddressMock,
        [],
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual('1000')
    })
  })
})
