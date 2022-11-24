import { ContractManager } from '@consensys/nestjs-orchestrate'
import { createMockInstance } from 'jest-create-mock-instance'
import {
  idemPotencyKeyMock,
  authTokenMock,
  headersMock,
  addressMock,
  initialSupplyMock,
  transactionConfigMock,
  uuidMock,
  recipientAddressMock,
  contractAddressMock,
} from '../../test/mock'
import { DVPToken, Standard } from './DVP'

describe('DVP', () => {
  let token: DVPToken
  let contractManagerMock: jest.Mocked<ContractManager>

  beforeEach(() => {
    contractManagerMock = createMockInstance(ContractManager)

    contractManagerMock.deploy.mockImplementationOnce(async () => uuidMock)
    contractManagerMock.exec.mockImplementationOnce(async () => uuidMock)

    token = new DVPToken(contractManagerMock)
  })

  describe('create token', () => {
    it('success', async () => {
      const response = await token.create(
        true,
        true,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.deploy).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.deploy).toHaveBeenCalledWith(
        DVPToken.DVP_CONTRACT_NAME,
        transactionConfigMock,
        [true, true],
        'constructor(bool,bool)',
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )
      expect(response).toEqual(uuidMock)
    })
  })

  describe('transfer tokens', () => {
    it('success', async () => {
      const response = await token.executeHolds(
        addressMock,
        'tokenOne',
        Standard.HoldableERC20,
        addressMock,
        'tokenTwo',
        Standard.HoldableERC20,
        '500',
        recipientAddressMock,
        recipientAddressMock,
        transactionConfigMock,
        idemPotencyKeyMock,
        authTokenMock,
        headersMock,
      )

      expect(contractManagerMock.exec).toHaveBeenCalledTimes(1)
      expect(contractManagerMock.exec).toHaveBeenCalledWith(
        DVPToken.DVP_CONTRACT_NAME,
        'executeHolds(address, bytes32, Standard, address, bytes32, Standard, bytes32, address, address)',
        transactionConfigMock,
        [
          addressMock,
          'tokenOne',
          Standard.HoldableERC20,
          addressMock,
          'tokenTwo',
          Standard.HoldableERC20,
          '500',
          recipientAddressMock,
          recipientAddressMock,
        ],
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
        DVPToken.DVP_CONTRACT_NAME,
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
