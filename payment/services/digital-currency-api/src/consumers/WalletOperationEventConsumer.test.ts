import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import {
  addressMock2,
  ethereumAddressEntityMock,
  legalEntityMock,
  walletOperationEventMock,
  walletsMock,
} from '../../test/mocks'
import createMockInstance from 'jest-create-mock-instance'
import { LegalEntityService } from '../services/LegalEntityService'
import { MessageDataOperation } from '@codefi-assets-and-payments/messaging-events'
import { WalletOperationEventConsumer } from './WalletOperationEventConsumer'
import { EthereumAddressService } from '../services/EthereumAddressService'
import Web3 from 'web3'

describe('WalletOperationEventConsumer', () => {
  let walletOperationEventConsumer: WalletOperationEventConsumer
  let logger: jest.Mocked<NestJSPinoLogger>
  let legalEntityServiceMock: jest.Mocked<LegalEntityService>
  let ethereumAddressServiceMock: jest.Mocked<EthereumAddressService>

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    legalEntityServiceMock = createMockInstance(LegalEntityService)
    ethereumAddressServiceMock = createMockInstance(EthereumAddressService)

    walletOperationEventConsumer = new WalletOperationEventConsumer(
      logger,
      legalEntityServiceMock,
      ethereumAddressServiceMock,
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('CREATE', () => {
    it('(OK) on event wallet created', async () => {
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )

      await walletOperationEventConsumer.onMessage(walletOperationEventMock)

      expect(legalEntityServiceMock.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityServiceMock.findOne).toHaveBeenCalledWith({
        id: walletOperationEventMock.entityId,
      })

      expect(legalEntityServiceMock.update).toHaveBeenCalledTimes(0)
      expect(ethereumAddressServiceMock.create).toHaveBeenCalledTimes(1)
      expect(ethereumAddressServiceMock.create).toHaveBeenCalledWith(
        walletOperationEventMock.entityId,
        Web3.utils.toChecksumAddress(walletOperationEventMock.address),
        walletOperationEventMock.type,
        walletOperationEventMock.metadata,
      )
    })

    it('(OK) on event entity already exists. Skipping...', async () => {
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )

      ethereumAddressServiceMock.findOne.mockImplementationOnce(
        async () => ethereumAddressEntityMock,
      )

      await walletOperationEventConsumer.onMessage(walletOperationEventMock)

      expect(legalEntityServiceMock.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityServiceMock.findOne).toHaveBeenCalledWith({
        id: walletOperationEventMock.entityId,
      })

      expect(legalEntityServiceMock.create).toHaveBeenCalledTimes(0)
    })
  })
  describe('UPDATE', () => {
    it('(OK) on event cache wallet updated', async () => {
      const newLegalEntityMocked = { ...legalEntityMock, wallets: walletsMock }
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => newLegalEntityMocked,
      )

      await walletOperationEventConsumer.onMessage({
        ...walletOperationEventMock,
        operation: MessageDataOperation.UPDATE,
      })

      expect(ethereumAddressServiceMock.findAndUpdate).toHaveBeenCalledTimes(1)
      expect(ethereumAddressServiceMock.findAndUpdate).toHaveBeenCalledWith(
        {
          address: Web3.utils.toChecksumAddress(
            walletOperationEventMock.address,
          ),
          entityId: walletOperationEventMock.entityId,
        },

        walletOperationEventMock.metadata,
      )
    })

    it('(OK) on event entity does not have account to update. Skipping...', async () => {
      legalEntityServiceMock.findOne.mockReset()
      const newLegalEntityMocked = { ...legalEntityMock, wallets: walletsMock }
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => newLegalEntityMocked,
      )

      await walletOperationEventConsumer.onMessage({
        ...walletOperationEventMock,
        operation: MessageDataOperation.UPDATE,
        address: addressMock2,
      })

      expect(legalEntityServiceMock.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityServiceMock.findOne).toHaveBeenCalledWith({
        id: walletOperationEventMock.entityId,
      })

      expect(legalEntityServiceMock.update).toHaveBeenCalledTimes(0)
    })
  })

  describe('DELETE', () => {
    it('(OK) on event delete entity', async () => {
      const newLegalEntityMocked = { ...legalEntityMock, wallets: walletsMock }
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => newLegalEntityMocked,
      )

      await walletOperationEventConsumer.onMessage({
        ...walletOperationEventMock,
        operation: MessageDataOperation.DELETE,
      })

      expect(legalEntityServiceMock.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityServiceMock.findOne).toHaveBeenCalledWith({
        id: walletOperationEventMock.entityId,
      })

      expect(ethereumAddressServiceMock.delete).toHaveBeenCalledTimes(1)
      expect(ethereumAddressServiceMock.delete).toHaveBeenCalledWith({
        entityId: walletOperationEventMock.entityId,
        address: walletOperationEventMock.address,
      })
    })

    it('(OK) on event wallet does not exists. Skipping...', async () => {
      legalEntityServiceMock.findOne.mockReset()
      const newLegalEntityMocked = { ...legalEntityMock, wallets: walletsMock }
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => newLegalEntityMocked,
      )

      await walletOperationEventConsumer.onMessage({
        ...walletOperationEventMock,
        operation: MessageDataOperation.DELETE,
        address: addressMock2,
      })

      expect(legalEntityServiceMock.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityServiceMock.findOne).toHaveBeenCalledWith({
        id: walletOperationEventMock.entityId,
      })

      expect(legalEntityServiceMock.delete).toHaveBeenCalledTimes(0)
    })
  })
  it('(OK) unknown operation', async () => {
    legalEntityServiceMock.findOne.mockImplementationOnce(
      async () => legalEntityMock,
    )

    await walletOperationEventConsumer.onMessage({
      ...walletOperationEventMock,
      operation: undefined,
    })

    expect(legalEntityServiceMock.findOne).toHaveBeenCalledTimes(1)
    expect(legalEntityServiceMock.update).toHaveBeenCalledTimes(0)
  })
})
