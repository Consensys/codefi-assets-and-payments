import {
  Events,
  ITenantOperationEvent,
  MessageDataOperation,
  TenantOperationEvent,
} from '@codefi-assets-and-payments/messaging-events'
import {
  ChainRegistry,
  OrchestrateUtils,
} from '@codefi-assets-and-payments/nestjs-orchestrate'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { TenantService } from '../services/TenantService'
import { v4 as uuidv4 } from 'uuid'
import config from '../config'
import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { getGroupId } from '../utils/kafka'
import { TenantEntity } from '../data/entities/TenantEntity'
import { KafkaPreview } from '@codefi-assets-and-payments/nestjs-messaging'

@Injectable()
export class TenantOperationEventConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Events.tenantOperationEvent.getMessageName()
  groupId: string = getGroupId(TenantOperationEventConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private readonly tenantService: TenantService,
    private orchestrateChainRegistry: ChainRegistry,
    private m2mService: M2mTokenService,
  ) {
    this.logger.setContext(TenantOperationEvent.name)
  }

  async onMessage(decodedMessage: ITenantOperationEvent) {
    this.logger.info(
      `[!] topic ${this.topic} - ITenantOperationEvent operation ${decodedMessage.operation} received`,
    )
    this.logger.info(JSON.stringify(decodedMessage))

    if (decodedMessage.operation === MessageDataOperation.CREATE) {
      this.logger.info(
        `Check if chain exists ${decodedMessage.defaultNetworkKey}`,
      )
      const authToken = await this.m2mService.createM2mToken(
        config().m2mToken.client.id,
        config().m2mToken.client.secret,
        config().m2mToken.audience,
      )
      const chains = await this.orchestrateChainRegistry.getAllChains(authToken)
      this.logger.info(
        `${chains.length} chains are already registered in Orchestrate`,
      )
      const existingChain = chains.find((chain) =>
        chain.urls.includes(decodedMessage.defaultNetworkKey),
      )
      let chainName = `payments_${decodedMessage.name}_${uuidv4()}`

      if (existingChain) {
        this.logger.info(`Chain already exists in orchestrate`)
        chainName = existingChain.name
      } else {
        this.logger.info(
          `Chain does not exist in orchestrate. Registering with name=${chainName}`,
        )
        const publicTenantHeaders =
          OrchestrateUtils.buildOrchestrateHeadersForPublicTenant()
        await this.orchestrateChainRegistry.registerChain(
          chainName,
          [decodedMessage.defaultNetworkKey],
          {
            backOffDuration: config().orchestrate.chainBackoffDuration,
            externalTxEnabled: config().orchestrate.chainEnableExternalTx,
          },
          undefined,
          authToken,
          publicTenantHeaders,
        )
      }
      this.logger.info(`Check if tenantId=${decodedMessage.tenantId} exists`)
      const tenantExists: TenantEntity = await this.tenantService.findOne({
        id: decodedMessage.tenantId,
      })

      if (tenantExists) {
        this.logger.warn(
          `Duplicate Event: tenantId=${decodedMessage.tenantId} already exists. Skipping...`,
        )
        return
      }
      await this.tenantService.create(
        decodedMessage.tenantId,
        decodedMessage.name,
        decodedMessage.metadata,
        chainName,
      )
      this.logger.info(`tenant saved`)
    } else if (decodedMessage.operation === MessageDataOperation.UPDATE) {
      await this.tenantService.update(
        {
          id: decodedMessage.tenantId,
        },
        {
          metadata: decodedMessage.metadata,
          name: decodedMessage.name,
        },
      )
    } else if (decodedMessage.operation === MessageDataOperation.DELETE) {
      await this.tenantService.delete(decodedMessage.tenantId)
    }
  }

  async onStopListener() {
    this.logger.info(`Stopping ${TenantOperationEventConsumer.name}`)
  }
}
