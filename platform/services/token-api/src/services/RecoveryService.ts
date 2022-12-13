import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { OperationEntity } from '../data/entities/OperationEntity'
import { InjectRepository } from '@nestjs/typeorm'
import { v4 as uuidv4 } from 'uuid'
import { TokenEntity } from '../data/entities/TokenEntity'
import { ethers as Ethers } from 'ethers'
import config from '../config'
import { EntityStatus, TokenOperationType, TokenType } from '@consensys/ts-types'
import { ChainRegistry } from '@consensys/nestjs-orchestrate'
import { M2mTokenService } from '@consensys/auth'
import { sleep } from '../utils/sleep'
import { Repository } from 'typeorm'
import CodefiERC20 from '@consensys/contracts/build/contracts/CodefiERC20.json'
import CodefiERC721 from '@consensys/contracts/build/contracts/CodefiERC721.json'
import { EventSignature } from '../EventSignature'
import { IReceipt } from '@consensys/nestjs-orchestrate'
import { EventsService } from './EventsService'

const EVENT_SIGNATURES = [
  EventSignature.DEPLOY_ERC20,
  EventSignature.DEPLOY_ERC721,
  EventSignature.TRANSFER,
]

const TOKEN_TYPE_BY_EVENT_SIGNATURES = {
  [EventSignature.DEPLOY_ERC20]: TokenType.ERC20,
  [EventSignature.DEPLOY_ERC721]: TokenType.ERC721,
}

const ADDRESS_EMPTY = '0x0000000000000000000000000000000000000000'

@Injectable()
export class RecoveryService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(OperationEntity)
    private operationRepository: Repository<OperationEntity>,
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,
    private orchestrateChainRegistry: ChainRegistry,
    private m2mTokenService: M2mTokenService,
    private eventsService: EventsService,
  ) {
    logger.setContext(RecoveryService.name)
  }

  async regenerateDatabase() {
    this.logger.info('Regenerating database')

    const chains = await this.getChains()
    const chainNames = Object.keys(chains)

    const logger = this.logger.logger.child({
      recoveryChains: chainNames,
    })

    logger.info(`Found ${chainNames.length} chains`)

    let tokenCount = 0
    let operationCount = 0

    for (const chainName of chainNames) {
      const chainUrl = chains[chainName]
      const ethers = this.getProvider(chainUrl)
      const lastSeenBlockNumber = await this.getLastSeenBlockNumber(chainName)
      const latestBlockNumber = await ethers.getBlockNumber()

      logger.info(
        {
          chain: chainName,
          lastSeenBlock: lastSeenBlockNumber,
          latestBlock: latestBlockNumber,
        },
        `Processing chain`,
      )

      await this.getEvents(
        EVENT_SIGNATURES,
        lastSeenBlockNumber,
        latestBlockNumber,
        chainName,
        ethers,
        async (events) => {
          tokenCount += await this.regenerateTokens(chainName, events, ethers)

          operationCount += await this.regenerateOperations(
            chainName,
            events,
            ethers,
          )
        },
      )
    }

    logger.info(
      {
        recoveredTokenCount: tokenCount,
        recoveredOperationCount: operationCount,
      },
      `Database regeneration complete`,
    )
  }

  private async regenerateOperations(
    chainName: string,
    events: { [eventSignature: string]: Ethers.providers.Log[] },
    ethers: Ethers.providers.JsonRpcProvider,
  ): Promise<number> {
    const existingTokens = await this.tokenRepository.find({ chainName })

    const existingTokenAddresses = existingTokens.map(
      (token) => token.contractAddress,
    )

    const matchingEvents = [].concat(
      ...EVENT_SIGNATURES.map((eventSignature) => events[eventSignature] || []),
    )

    const tokenEvents: Ethers.providers.Log[] = matchingEvents
      .filter((event) => existingTokenAddresses.includes(event.address))
      .sort((a, b) => a.blockNumber - b.blockNumber)

    this.logger.info(
      { chain: chainName },
      `Found ${tokenEvents.length} operation events`,
    )

    const newOperations = await this.createOperations(
      tokenEvents,
      chainName,
      ethers,
    )

    return newOperations.length
  }

  private async regenerateTokens(
    chainName: string,
    events: { [eventSignature: string]: Ethers.providers.Log[] },
    ethers: Ethers.providers.JsonRpcProvider,
  ): Promise<number> {
    const existingTokens = await this.tokenRepository.find({ chainName })

    let tokenCount = 0

    for (const eventSignature of Object.keys(TOKEN_TYPE_BY_EVENT_SIGNATURES)) {
      const newTokens = await this.createTokensForType(
        events[eventSignature] || [],
        eventSignature,
        existingTokens,
        chainName,
        ethers,
      )

      tokenCount += newTokens.length
    }

    return tokenCount
  }

  private async getEvents(
    eventSignatures: string[],
    fromBlock: number,
    toBlock: number,
    chainName: string,
    ethers: Ethers.providers.JsonRpcProvider,
    action: (events: {
      [eventSignature: string]: Ethers.providers.Log[]
    }) => void,
  ) {
    const logger = this.logger.logger.child({
      chainName,
      fromBlock,
      toBlock,
    })

    logger.info('Searching chain for events')

    const encodedEventSignatures: string[] = eventSignatures.map(
      (eventSignature) => this.encodeEventSignature(eventSignature),
    )

    let eventCount = 0
    const batchSize = config().recoveryMode.batchSize

    for (
      let blockIndex = fromBlock;
      blockIndex < toBlock;
      blockIndex += batchSize
    ) {
      const toBlockLocal =
        blockIndex + batchSize > toBlock ? toBlock : blockIndex + batchSize

      logger.info(
        { blockStart: blockIndex, blockEnd: toBlockLocal },
        `Checking blocks`,
      )

      const missedEvents = await ethers.getLogs({
        fromBlock: blockIndex,
        toBlock: toBlockLocal,
        topics: [encodedEventSignatures],
      })

      eventCount += missedEvents.length

      logger.info(`Found ${missedEvents.length} events`)

      const events = {}

      for (
        let eventIndex = 0;
        eventIndex < eventSignatures.length;
        eventIndex++
      ) {
        const eventSignature = eventSignatures[eventIndex]
        const encodedEventSignature = encodedEventSignatures[eventIndex]
        const existingEvents = events[eventSignature] || []

        const matchingEvents = missedEvents.filter(
          (event) => event.topics[0] === encodedEventSignature,
        )

        events[eventSignature] = [...existingEvents, ...matchingEvents]
      }

      await action(events)

      logger.info(
        `Sleeping ${
          config().recoveryMode.timeoutLogs
        }ms to avoid log retrieval timeout`,
      )

      await sleep(config().recoveryMode.timeoutLogs)
    }

    logger.info(`Found a total of ${eventCount} events`)
  }

  private async createOperations(
    events: Ethers.providers.Log[],
    chainName: string,
    ethers: Ethers.providers.JsonRpcProvider,
  ): Promise<TokenEntity[]> {
    const existingOperationHashes = (
      await this.operationRepository.find({
        chainName,
      })
    ).map((operation) => operation.transactionHash)

    const newOperations = []

    const logger = this.logger.logger.child({ chain: chainName })

    for (const event of events) {
      if (existingOperationHashes.includes(event.transactionHash)) {
        logger.info(
          { transactionHash: event.transactionHash },
          `Skipping existing operation`,
        )
        continue
      }

      const { operation: newOperation, receipt: rawReceipt } =
        await this.createOperationEntity(event, chainName, ethers)

      await this.operationRepository.insert(newOperation)

      await this.sendEvents(newOperation, event, rawReceipt, chainName)

      if (newOperation.operation === TokenOperationType.Deploy) {
        await this.tokenRepository.update(
          { contractAddress: event.address },
          {
            operationId: newOperation.id,
          },
        )
      }

      newOperations.push(newOperation)

      logger.info(
        {
          transactionHash: event.transactionHash,
          operationId: newOperation.id,
          operationType: newOperation.operation,
        },
        `Saved operation`,
      )

      await sleep(config().recoveryMode.timeoutTransaction)
    }

    return newOperations
  }

  private async createTokensForType(
    events: Ethers.providers.Log[],
    eventSignature: string,
    existingTokens: TokenEntity[],
    chainName: string,
    ethers: Ethers.providers.JsonRpcProvider,
  ): Promise<TokenEntity[]> {
    const tokenType = TOKEN_TYPE_BY_EVENT_SIGNATURES[eventSignature]

    const existingTokenAddresses = existingTokens
      .filter((token) => token.type === tokenType)
      .map((token) => token.contractAddress)

    const newTokens = []

    const logger = this.logger.logger.child({ chain: chainName, tokenType })

    for (const event of events) {
      const exists = existingTokenAddresses.includes(event.address)

      if (exists) {
        logger.info(
          { contractAddress: event.address },
          `Skipping existing token`,
        )
        continue
      }

      const newToken = await this.createTokenEntity(
        event,
        tokenType,
        chainName,
        ethers,
      )

      newTokens.push(newToken)

      await this.tokenRepository.insert(newToken)

      logger.info({ tokenName: newToken.name }, `Saved token`)

      await sleep(config().recoveryMode.timeoutTransaction)
    }

    return newTokens
  }

  private async createOperationEntity(
    event: Ethers.providers.Log,
    chainName: string,
    ethers: Ethers.providers.JsonRpcProvider,
  ): Promise<{
    operation: OperationEntity
    receipt: Ethers.providers.TransactionReceipt
  }> {
    const decodedEvent = this.decodeEventData(event)

    const orchestrateDecodedEvent = this.createOrchestrateDecodedEvent(
      event,
      decodedEvent,
    )

    const receipt = await ethers.getTransactionReceipt(event.transactionHash)
    const orchestrateReceipt = this.createOrchestrateReceipt(receipt)

    const isDeploy = Object.keys(TOKEN_TYPE_BY_EVENT_SIGNATURES).includes(
      decodedEvent.signature,
    )

    const operationType = isDeploy
      ? TokenOperationType.Deploy
      : decodedEvent.args.from === ADDRESS_EMPTY
      ? TokenOperationType.Mint
      : decodedEvent.args.to === ADDRESS_EMPTY
      ? TokenOperationType.Burn
      : TokenOperationType.Transfer

    const operation = {
      id: uuidv4(),
      status: EntityStatus.Confirmed,
      operation: operationType,
      transactionId: '',
      chainName,
      createdBy: 'Recovery',
      createdAt: new Date(),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      decodedEvent: orchestrateDecodedEvent,
      receipt: orchestrateReceipt,
    }

    return { operation, receipt }
  }

  private async createTokenEntity(
    event: Ethers.providers.Log,
    tokenType: TokenType,
    chainName: string,
    ethers: Ethers.providers.JsonRpcProvider,
  ): Promise<TokenEntity> {
    const eventData = this.decodeEventData(event)
    const tokenName = eventData.args.name
    const tokenSymbol = eventData.args.symbol
    const decimals =
      tokenType == TokenType.ERC20 ? eventData.args.decimals : undefined
    const transaction = await ethers.getTransaction(event.transactionHash)

    return {
      id: uuidv4(),
      status: EntityStatus.Confirmed,
      type: tokenType,
      name: tokenName,
      symbol: tokenSymbol,
      chainName,
      decimals,
      deployerAddress: transaction.from,
      contractAddress: event.address,
      createdBy: 'Recovery',
      createdAt: new Date(),
    }
  }

  private async getLastSeenBlockNumber(chainName: string): Promise<number> {
    const lastOperation = await this.operationRepository.findOne(
      { chainName },
      {
        order: {
          blockNumber: 'DESC',
        },
      },
    )

    if (!lastOperation) return 0

    return lastOperation.blockNumber || 0
  }

  private async getChains() {
    const tokenChains = (
      await this.tokenRepository
        .createQueryBuilder('token_entity')
        .distinctOn(['token_entity.chainName'])
        .getMany()
    ).map((token) => token.chainName)

    const operationChains = (
      await this.operationRepository
        .createQueryBuilder('operation_entity')
        .distinctOn(['operation_entity.chainName'])
        .getMany()
    ).map((operation) => operation.chainName)

    const databaseChainNames = [
      ...new Set([...tokenChains, ...operationChains]),
    ]

    if (!databaseChainNames.length) {
      this.logger.info(
        'No chains found in database, using environment variable',
      )
      return {
        [config().orchestrate.chainName]: config().orchestrate.blockchainUrl,
      }
    }

    const authToken = await this.m2mTokenService.createM2mToken(
      config().m2mToken.client.id,
      config().m2mToken.client.secret,
      config().m2mToken.audience,
    )

    const orchestrateChains = await this.orchestrateChainRegistry.getAllChains(
      authToken,
    )

    const chains = orchestrateChains
      .filter((chain) => databaseChainNames.includes(chain.name))
      .reduce((output, chain) => {
        output[chain.name] = chain.urls[0]
        return output
      }, {})

    const missingOrchestrateChains = databaseChainNames.filter(
      (chainName) => !chains[chainName],
    )

    if (missingOrchestrateChains.length) {
      throw new Error(
        `Database chain names not registered in Orchestrate: ${missingOrchestrateChains.join(
          ', ',
        )}`,
      )
    }

    return chains
  }

  private createOrchestrateReceipt(
    receipt: Ethers.providers.TransactionReceipt,
  ): IReceipt {
    return {
      txHash: receipt.transactionHash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
      txIndex: receipt.transactionIndex,
      contractAddress: receipt.contractAddress || undefined,
      status: receipt.status === 1,
      bloom: receipt.logsBloom,
      logs: receipt.logs?.map((log) => {
        const decodedEvent = this.decodeEventData(log) || ({} as any)
        return {
          address: log.address,
          topics: log.topics,
          data: log.data,
          event: decodedEvent.signature,
          decodedData: decodedEvent.args
            ? this.decodeData(decodedEvent)
            : undefined,
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
          txIndex: log.transactionIndex,
          blockHash: log.blockHash,
          index: log.logIndex,
          removed: log.removed,
        }
      }),
      gasUsed: receipt.gasUsed?.toNumber(),
      cumulativeGasUsed: receipt.cumulativeGasUsed?.toNumber(),
      revertReason: undefined,
      output: undefined,
      privateFrom: undefined,
      privateFor: undefined,
      privacyGroupId: undefined,
    }
  }

  private createOrchestrateDecodedEvent(
    event: Ethers.providers.Log,
    decodedEvent: Ethers.utils.LogDescription,
  ): any {
    return {
      address: event.address,
      topics: event.topics,
      data: event.data,
      event: decodedEvent.signature,
      decodedData: this.decodeData(decodedEvent),
      blockNumber: event.blockNumber,
      txHash: event.transactionHash,
      txIndex: event.transactionIndex,
      blockHash: event.blockHash,
      index: event.logIndex,
      removed: event.removed,
    }
  }

  private decodeData(decodedLog: Ethers.utils.LogDescription) {
    return decodedLog.eventFragment.inputs.reduce((output, input) => {
      output[input.name] = decodedLog.args[input.name] + ''
      return output
    }, {})
  }

  private decodeEventData(
    event: Ethers.providers.Log,
  ): Ethers.utils.LogDescription | null {
    try {
      return this.tryWithAllContracts((contractInterface) => {
        return contractInterface.parseLog(event)
      })
    } catch {
      return null
    }
  }

  private encodeEventSignature(eventSignature: string): string {
    return this.tryWithAllContracts((contractInterface) =>
      contractInterface.getEventTopic(eventSignature),
    )
  }

  private tryWithAllContracts(
    func: (contractInterface: Ethers.utils.Interface) => any,
  ): any {
    try {
      const contractERC20 = new Ethers.utils.Interface(CodefiERC20.abi)
      return func(contractERC20)
    } catch {
      const contractERC721 = new Ethers.utils.Interface(CodefiERC721.abi)
      return func(contractERC721)
    }
  }

  private getProvider(url: string): Ethers.providers.JsonRpcProvider {
    const matches = url.match(/(.+):\/\/(.+):(.+)@(.+)/)

    if (matches) {
      const url = matches[1] + '://' + matches[4]
      const user = matches[2]
      const password = matches[3]
      return new Ethers.providers.JsonRpcProvider({ url, user, password })
    }

    return new Ethers.providers.JsonRpcProvider(url)
  }

  private async sendEvents(
    operation: OperationEntity,
    rawEvent: Ethers.providers.Log,
    rawReceipt: Ethers.providers.TransactionReceipt,
    chainName: string,
  ) {
    const contractAddress = rawEvent.address

    await this.eventsService.emitAsyncOperationResultEvent(
      operation.id,
      true,
      chainName,
      operation.transactionHash,
      {
        contractAddress,
      },
    )

    const tokenQuery = { contractAddress }
    const token = await this.tokenRepository.findOne(tokenQuery)

    if (!token) return

    if (operation.operation === TokenOperationType.Deploy) {
      await this.eventsService.emitTokenDeployedEvent(
        token.name,
        token.symbol,
        token.decimals,
        token.contractAddress,
        token.deployerAddress,
        operation.transactionHash,
        operation.blockNumber,
        chainName,
      )
    }

    if (
      [
        TokenOperationType.Mint,
        TokenOperationType.Burn,
        TokenOperationType.Transfer,
      ].includes(operation.operation)
    ) {
      await this.eventsService.emitTokenTransferEvent(
        token.name,
        token.symbol,
        token.contractAddress,
        operation.decodedEvent.decodedData.value ||
          operation.decodedEvent.decodedData.tokenId,
        operation.decodedEvent.decodedData.from,
        operation.decodedEvent.decodedData.to,
        operation.blockNumber,
        rawReceipt.from,
        operation.transactionHash,
        chainName,
      )
    }
  }
}
