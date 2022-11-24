import { KafkaProducer } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import config from '../config'
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
  BurnTokenCommandBuilder,
  IBurnTokenCommand,
} from '@consensys/messaging-events'
import { TokenType } from '@consensys/ts-types'

@Injectable()
export class EventsService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly kafkaProducer: KafkaProducer,
  ) {
    this.logger.setContext(EventsService.name)
  }

  async emitDeployTokenCommand(
    name: string,
    symbol: string,
    decimals: number,
    operationId: string,
    from: string,
    chainName: string,
    subject: string,
    tenantId: string,
    entityId: string,
  ) {
    if (config().kafka.enabled) {
      this.logger.info(
        `Sending emitDeployTokenCommand, name=${name}, symbol=${symbol}, operationId=${operationId}, from=${from}, subject=${subject}, tenantId=${tenantId}, chainName=${chainName}, entityId=${entityId}`,
      )
      const command: IDeployTokenCommand = DeployTokenCommandBuilder.get(
        TokenType.ERC20,
        name,
        symbol,
        decimals,
        operationId,
        subject,
        tenantId,
        entityId,
      )
        .idempotencyKey(operationId)
        .txConfig(
          TransactionConfigBuilder.get(from).chainName(chainName).build(),
        )
        .build()
      await this.kafkaProducer.send(Commands.tokenDeployCommand, command)
    } else {
      this.logger.info(`Kafka disabled, not sending event`)
    }
  }

  async emitTransferTokenCommand(
    currencyEthereumAddress: string,
    amount: string,
    recipientAddress: string,
    operationId: string,
    from: string,
    chainName: string,
    subject: string,
    tenantId: string,
    entityId: string,
  ) {
    if (!config().kafka.enabled) {
      this.logger.info(`Kafka disabled, not sending event`)
      return
    }
    this.logger.info(
      `emitTransferTokenCommand, currencyEthereumAddress=${currencyEthereumAddress}, amount=${amount}, recipientAddress=${recipientAddress}, operationId=${operationId}, from=${from}, chainName=${chainName}, subject=${subject}, tenantId=${tenantId}, entityId=${entityId}`,
    )
    const txConfig: ITransactionConfig = TransactionConfigBuilder.get(from)
      .to(currencyEthereumAddress)
      .chainName(chainName)
      .build()

    const transferCommand: ITransferTokenCommand =
      TransferTokenCommandBuilder.get(
        TokenType.ERC20,
        operationId,
        subject,
        tenantId,
        entityId,
      )
        .amount(amount)
        .txConfig(txConfig)
        .recipient(recipientAddress)
        .tenantId(tenantId)
        .subject(subject)
        .idempotencyKey(operationId)
        .build()

    await this.kafkaProducer.send<ITransferTokenCommand>(
      Commands.transferTokenCommand,
      transferCommand,
    )
  }

  async emitMintTokenCommand(
    currencyEthereumAddress: string,
    amount: string,
    recipientAddress: string,
    operationId: string,
    from: string,
    chainName: string,
    subject: string,
    tenantId: string,
    entityId: string,
  ) {
    if (config().kafka.enabled) {
      this.logger.info(
        `Sending emitMintTokenCommand, currencyEthereumAddress=${currencyEthereumAddress}, amount=${amount}, recipientAddress=${recipientAddress} operationId=${operationId}, from=${from}, subject=${subject}, tenantId=${tenantId}, entityId=${entityId} chainName=${chainName}`,
      )
      const command: IMintTokenCommand = MintTokenCommandBuilder.get(
        TokenType.ERC20,
        operationId,
        subject,
        tenantId,
        entityId,
      )
        .account(recipientAddress)
        .amount(amount)
        .idempotencyKey(operationId)
        .txConfig(
          TransactionConfigBuilder.get(from)
            .chainName(chainName)
            .to(currencyEthereumAddress)
            .build(),
        )
        .build()
      await this.kafkaProducer.send(Commands.tokenMintCommand, command)
    } else {
      this.logger.info(`Kafka disabled, not sending event`)
    }
  }

  async emitBurnTokenCommand(
    currencyEthereumAddress: string,
    amount: string,
    operationId: string,
    from: string,
    chainName: string,
    subject: string,
    tenantId: string,
    entityId: string,
  ) {
    if (config().kafka.enabled) {
      this.logger.info(
        `Sending emitBurnTokenCommand, currencyEthereumAddress=${currencyEthereumAddress}, amount=${amount}, operationId=${operationId}, from=${from}, subject=${subject}, tenantId=${tenantId}, entityId=${entityId}, chainName=${chainName}`,
      )
      const command: IBurnTokenCommand = BurnTokenCommandBuilder.get(
        TokenType.ERC20,
        amount,
        operationId,
        subject,
        tenantId,
        entityId,
      )
        .idempotencyKey(operationId)
        .txConfig(
          TransactionConfigBuilder.get(from)
            .chainName(chainName)
            .to(currencyEthereumAddress)
            .build(),
        )
        .build()
      await this.kafkaProducer.send(Commands.burnTokenCommand, command)
    } else {
      this.logger.info(`Kafka disabled, not sending event`)
    }
  }
}
