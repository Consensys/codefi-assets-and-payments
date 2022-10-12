import { EventsService } from './EventsService'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import createMockInstance from 'jest-create-mock-instance'
import cfg from '../config'
import config from '../config'
import {
  addressMock,
  addressMock2,
  addressMock3,
  digitalCurrencyEntityMock,
  entityIdMock,
  operationMock,
  subjectMock,
  tenantIdMock,
  uuidMock,
} from '../../test/mocks'
import {
  Commands,
  DeployTokenCommandBuilder,
  IDeployTokenCommand,
  IMintTokenCommand,
  ITransactionConfig,
  MintTokenCommandBuilder,
  TransactionConfigBuilder,
  ITransferTokenCommand,
  TransferTokenCommandBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { TokenType } from '@codefi-assets-and-payments/ts-types'
import {
  BurnTokenCommandBuilder,
  IBurnTokenCommand,
} from '@codefi-assets-and-payments/messaging-events/dist/messages/commands/BurnTokenCommand'

describe('EventsService', () => {
  let service: EventsService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let producerMock: jest.Mocked<KafkaProducer>

  beforeEach(() => {
    config().kafka.enabled = true
    loggerMock = createMockInstance(NestJSPinoLogger)
    producerMock = createMockInstance(KafkaProducer)
    service = new EventsService(loggerMock, producerMock)
  })

  describe('transfer', () => {
    const amount = '0x64'
    it('it should emit Transfer event - success', async () => {
      await service.emitTransferTokenCommand(
        addressMock2,
        amount,
        addressMock3,
        operationMock.id,
        addressMock,
        digitalCurrencyEntityMock.chainName,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .to(addressMock2)
        .chainName(digitalCurrencyEntityMock.chainName)
        .build()

      const transferCommand: ITransferTokenCommand =
        TransferTokenCommandBuilder.get(
          TokenType.ERC20,
          operationMock.id,
          subjectMock,
          tenantIdMock,
          entityIdMock,
        )
          .idempotencyKey(uuidMock)
          .amount(amount)
          .txConfig(txConfig)
          .recipient(addressMock3)
          .tenantId(tenantIdMock)
          .subject(subjectMock)
          .build()
      expect(producerMock.send).toHaveBeenCalledTimes(1)
      expect(producerMock.send).toHaveBeenCalledWith(
        Commands.transferTokenCommand,
        transferCommand,
      )
    })

    it('it should not emit, kafka disable', async () => {
      config().kafka.enabled = false
      await service.emitTransferTokenCommand(
        addressMock2,
        amount,
        addressMock3,
        operationMock.id,
        addressMock,
        digitalCurrencyEntityMock.chainName,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )

      expect(producerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('emitAsyncOperationResultEvent', () => {
    it('success', async () => {
      await service.emitDeployTokenCommand(
        'name',
        'symbol',
        2,
        uuidMock,
        addressMock,
        'chainName',
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
      const command: IDeployTokenCommand = DeployTokenCommandBuilder.get(
        TokenType.ERC20,
        'name',
        'symbol',
        2,
        uuidMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .idempotencyKey(uuidMock)
        .txConfig(
          TransactionConfigBuilder.get(addressMock)
            .chainName('chainName')
            .build(),
        )
        .build()
      expect(producerMock.send).toHaveBeenCalledTimes(1)
      expect(producerMock.send).toHaveBeenCalledWith(
        Commands.tokenDeployCommand,
        command,
      )
    })

    it('success - kafka disabled', async () => {
      cfg().kafka.enabled = false
      await service.emitDeployTokenCommand(
        'name',
        'symbol',
        2,
        uuidMock,
        addressMock,
        'chainName',
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
      expect(producerMock.send).toHaveBeenCalledTimes(0)
    })
  })
  describe('emitMintTokenCommand', () => {
    it('success', async () => {
      await service.emitMintTokenCommand(
        addressMock,
        '0x5',
        addressMock2,
        uuidMock,
        addressMock3,
        'chainName',
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
      const command: IMintTokenCommand = MintTokenCommandBuilder.get(
        TokenType.ERC20,
        uuidMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .idempotencyKey(uuidMock)
        .account(addressMock2)
        .amount('0x5')
        .txConfig(
          TransactionConfigBuilder.get(addressMock3)
            .chainName('chainName')
            .to(addressMock)
            .build(),
        )
        .build()
      expect(producerMock.send).toHaveBeenCalledTimes(1)
      expect(producerMock.send).toHaveBeenCalledWith(
        Commands.tokenMintCommand,
        command,
      )
    })

    it('success - kafka disabled', async () => {
      cfg().kafka.enabled = false
      await service.emitMintTokenCommand(
        addressMock,
        '0x5',
        addressMock2,
        uuidMock,
        addressMock3,
        'chainName',
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
      expect(producerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('emitBurnTokenCommand', () => {
    it('success', async () => {
      await service.emitBurnTokenCommand(
        addressMock,
        '0x5',
        uuidMock,
        addressMock3,
        'chainName',
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
      const command: IBurnTokenCommand = BurnTokenCommandBuilder.get(
        TokenType.ERC20,
        '0x5',
        uuidMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .idempotencyKey(uuidMock)
        .txConfig(
          TransactionConfigBuilder.get(addressMock3)
            .chainName('chainName')
            .to(addressMock)
            .build(),
        )
        .build()
      expect(producerMock.send).toHaveBeenCalledTimes(1)
      expect(producerMock.send).toHaveBeenCalledWith(
        Commands.burnTokenCommand,
        command,
      )
    })

    it('success - kafka disabled', async () => {
      cfg().kafka.enabled = false
      await service.emitBurnTokenCommand(
        addressMock,
        '0x5',
        uuidMock,
        addressMock3,
        'chainName',
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
      expect(producerMock.send).toHaveBeenCalledTimes(0)
    })
  })
})
