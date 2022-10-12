import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { ChainRegistry } from '@codefi-assets-and-payments/nestjs-orchestrate'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Repository, SelectQueryBuilder } from 'typeorm'
import { RecoveryService } from './RecoveryService'
import {
  addressEmptyMock,
  addressFromMock,
  addressToMock,
  amountMock,
  blockNumberMock,
  blockNumberMock2,
  chainNameMock,
  chainNameMock2,
  chainUrlMock,
  chainUrlMock2,
  createBlockchainEventDecodedMock,
  createBlockchainEventMock,
  createMockLogger,
  createTransactionReceiptMock,
  tokenEntityMock,
} from '../../test/mocks'
import config from '../../src/config'
import { EntityStatus, TokenOperationType, TokenType } from '@codefi-assets-and-payments/ts-types'
import { EventSignature } from '../EventSignature'
import { IChain } from 'pegasys-orchestrate'
import CodefiERC721 from '@codefi-assets-and-payments/contracts/build/contracts/CodefiERC721.json'
import { EventsService } from './EventsService'

jest.mock('ethers')

describe('RecoveryService', () => {
  let service: RecoveryService
  let operationRepoMock: jest.Mocked<Repository<any>>
  let tokenRepoMock: jest.Mocked<Repository<any>>
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let chainRegisterMock: jest.Mocked<ChainRegistry>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>
  let eventsServiceMock: jest.Mocked<EventsService>
  let tokenChainsMock: jest.Mocked<any>
  let operationChainsMock: jest.Mocked<any>
  let ethersMock
  let ethersProviderMock
  let ethersInterfaceMock

  beforeEach(async () => {
    loggerMock = createMockLogger()
    operationRepoMock = createMockInstance(Repository)
    tokenRepoMock = createMockInstance(Repository)
    chainRegisterMock = createMockInstance(ChainRegistry)
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    eventsServiceMock = createMockInstance(EventsService)
    tokenChainsMock = jest.fn(() => Promise.resolve([]))
    operationChainsMock = jest.fn(() => Promise.resolve([]))

    service = new RecoveryService(
      loggerMock,
      operationRepoMock,
      tokenRepoMock,
      chainRegisterMock,
      m2mTokenServiceMock,
      eventsServiceMock,
    )

    ethersProviderMock = {
      getBlockNumber: jest.fn(() => blockNumberMock2),
      getLogs: jest.fn(() => Promise.resolve([])),
      getTransaction: jest.fn(() => ({
        from: addressFromMock,
      })),
      getTransactionReceipt: jest.fn(() => ({})),
    }

    ethersInterfaceMock = {
      getEventTopic: jest.fn(),
      parseLog: jest.fn(),
    }

    ethersMock = require('ethers')

    ethersMock.ethers = {
      providers: {
        JsonRpcProvider: jest.fn(() => ethersProviderMock),
      },
      utils: {
        Interface: jest.fn(() => ethersInterfaceMock),
      },
    }

    tokenRepoMock.createQueryBuilder.mockReturnValue({
      distinctOn: () => ({
        getMany: tokenChainsMock,
      }),
    } as unknown as SelectQueryBuilder<any>)

    tokenRepoMock.find.mockResolvedValue([])

    operationRepoMock.createQueryBuilder.mockReturnValue({
      distinctOn: () => ({
        getMany: operationChainsMock,
      }),
    } as unknown as SelectQueryBuilder<any>)

    operationRepoMock.find.mockResolvedValue([])
    operationRepoMock.findOne.mockResolvedValue({
      blockNumber: blockNumberMock,
    })

    ethersInterfaceMock.getEventTopic.mockImplementation(
      (signature) => signature,
    )

    chainRegisterMock.getAllChains.mockResolvedValue([])

    config().orchestrate.chainName = chainNameMock
    config().orchestrate.blockchainUrl = chainUrlMock
    config().recoveryMode.batchSize = 1000000000
    config().recoveryMode.timeoutTransaction = 0
    config().recoveryMode.timeoutLogs = 0
  })

  describe('regenerateDatabase', () => {
    it.each([
      [TokenType.ERC20, EventSignature.DEPLOY_ERC20],
      [TokenType.ERC721, EventSignature.DEPLOY_ERC721],
    ])('creates %s tokens', async (tokenType, signature) => {
      const rawEvents = [
        createBlockchainEventMock(signature, 0),
        createBlockchainEventMock(signature, 1),
      ]

      const decodedEvents = [
        createBlockchainEventDecodedMock(signature, 0),
        createBlockchainEventDecodedMock(signature, 1),
      ]

      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])
      ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

      await service.regenerateDatabase()

      expect(tokenRepoMock.insert).toHaveBeenCalledTimes(rawEvents.length)

      for (let i = 0; i < rawEvents.length; i++) {
        expect(tokenRepoMock.insert).toHaveBeenCalledWith({
          chainName: chainNameMock,
          contractAddress: rawEvents[i].address,
          createdAt: expect.any(Date),
          createdBy: 'Recovery',
          decimals:
            tokenType === TokenType.ERC20
              ? decodedEvents[i].args.decimals
              : undefined,
          deployerAddress: addressFromMock,
          id: expect.any(String),
          name: decodedEvents[i].args.name,
          status: EntityStatus.Confirmed,
          symbol: decodedEvents[i].args.symbol,
          type: tokenType,
        })
      }

      expect(ethersMock.ethers.providers.JsonRpcProvider).toHaveBeenCalledTimes(
        1,
      )
      expect(ethersMock.ethers.providers.JsonRpcProvider).toHaveBeenCalledWith(
        chainUrlMock,
      )

      expect(ethersProviderMock.getLogs).toHaveBeenCalledTimes(1)
      expect(ethersProviderMock.getLogs).toHaveBeenCalledWith({
        fromBlock: blockNumberMock,
        toBlock: blockNumberMock2,
        topics: [
          [
            EventSignature.DEPLOY_ERC20,
            EventSignature.DEPLOY_ERC721,
            EventSignature.TRANSFER,
          ],
        ],
      })
    })

    it.each([
      [TokenType.ERC20, EventSignature.DEPLOY_ERC20],
      [TokenType.ERC721, EventSignature.DEPLOY_ERC721],
    ])(
      'creates %s tokens across multiple chains',
      async (tokenType, signature) => {
        const rawEvents = [
          createBlockchainEventMock(signature, 0),
          createBlockchainEventMock(signature, 1),
        ]

        const decodedEvents = [
          createBlockchainEventDecodedMock(signature, 0),
          createBlockchainEventDecodedMock(signature, 1),
        ]

        const chains = [
          { name: chainNameMock, urls: [chainUrlMock] } as IChain,
          { name: chainNameMock2, urls: [chainUrlMock2] } as IChain,
        ]

        // Chain 1
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

        // Chain 2
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

        ethersProviderMock.getLogs.mockResolvedValue(rawEvents)
        chainRegisterMock.getAllChains.mockResolvedValue(chains)

        tokenChainsMock.mockResolvedValue([
          { chainName: chainNameMock },
          { chainName: chainNameMock2 },
        ])

        await service.regenerateDatabase()

        expect(tokenRepoMock.insert).toHaveBeenCalledTimes(
          rawEvents.length * chains.length,
        )

        for (let i = 0; i < rawEvents.length * chains.length; i++) {
          const eventIndex = i % rawEvents.length

          expect(tokenRepoMock.insert).toHaveBeenCalledWith({
            chainName: chains[eventIndex].name,
            contractAddress: rawEvents[eventIndex].address,
            createdAt: expect.any(Date),
            createdBy: 'Recovery',
            decimals:
              tokenType === TokenType.ERC20
                ? decodedEvents[eventIndex].args.decimals
                : undefined,
            deployerAddress: addressFromMock,
            id: expect.any(String),
            name: decodedEvents[eventIndex].args.name,
            status: EntityStatus.Confirmed,
            symbol: decodedEvents[eventIndex].args.symbol,
            type: tokenType,
          })
        }

        expect(
          ethersMock.ethers.providers.JsonRpcProvider,
        ).toHaveBeenCalledWith(chainUrlMock)

        expect(
          ethersMock.ethers.providers.JsonRpcProvider,
        ).toHaveBeenCalledWith(chainUrlMock2)

        expect(ethersProviderMock.getLogs).toHaveBeenCalledTimes(chains.length)
      },
    )

    it.each([
      [TokenType.ERC20, EventSignature.DEPLOY_ERC20],
      [TokenType.ERC721, EventSignature.DEPLOY_ERC721],
    ])(
      'skips %s tokens if they already exist',
      async (tokenType, signature) => {
        const rawEvents = [
          createBlockchainEventMock(signature, 0),
          createBlockchainEventMock(signature, 1),
        ]

        const decodedEvents = [
          createBlockchainEventDecodedMock(signature, 0),
          createBlockchainEventDecodedMock(signature, 1),
        ]

        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

        ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

        tokenRepoMock.find.mockResolvedValue([
          { contractAddress: rawEvents[0].address, type: tokenType },
          { contractAddress: rawEvents[1].address, type: tokenType },
        ])

        await service.regenerateDatabase()

        expect(tokenRepoMock.insert).toHaveBeenCalledTimes(0)
      },
    )

    it('creates deploy operations', async () => {
      const rawEvents = [
        createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 0),
        createBlockchainEventMock(EventSignature.DEPLOY_ERC721, 1),
      ]

      const decodedEvents = [
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC20, 0),
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC721, 1),
      ]

      // Tokens
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

      // Operations
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

      ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

      tokenRepoMock.find.mockResolvedValue([
        { contractAddress: rawEvents[0].address },
        { contractAddress: rawEvents[1].address },
      ])

      tokenRepoMock.findOne.mockResolvedValue(tokenEntityMock)

      await service.regenerateDatabase()

      expect(operationRepoMock.insert).toHaveBeenCalledTimes(rawEvents.length)

      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(rawEvents.length)

      expect(eventsServiceMock.emitTokenDeployedEvent).toHaveBeenCalledTimes(
        rawEvents.length,
      )

      for (let i = 0; i < rawEvents.length; i++) {
        expect(operationRepoMock.insert).toHaveBeenCalledWith({
          blockNumber: rawEvents[i].blockNumber,
          chainName: chainNameMock,
          createdAt: expect.any(Date),
          createdBy: 'Recovery',
          decodedEvent: expect.any(Object),
          id: expect.any(String),
          operation: TokenOperationType.Deploy,
          receipt: expect.any(Object),
          status: EntityStatus.Confirmed,
          transactionHash: rawEvents[i].transactionHash,
          transactionId: '',
        })

        expect(
          eventsServiceMock.emitAsyncOperationResultEvent,
        ).toHaveBeenCalledWith(
          expect.any(String),
          true,
          chainNameMock,
          rawEvents[i].transactionHash,
          expect.any(Object),
        )

        expect(eventsServiceMock.emitTokenDeployedEvent).toHaveBeenCalledWith(
          tokenEntityMock.name,
          tokenEntityMock.symbol,
          tokenEntityMock.decimals,
          tokenEntityMock.contractAddress,
          tokenEntityMock.deployerAddress,
          rawEvents[i].transactionHash,
          rawEvents[i].blockNumber,
          chainNameMock,
        )
      }
    })

    it.each([
      [TokenOperationType.Transfer, addressFromMock, addressToMock],
      [TokenOperationType.Mint, addressEmptyMock, addressToMock],
      [TokenOperationType.Burn, addressFromMock, addressEmptyMock],
    ])('creates %s operations', async (operation, from, to) => {
      const rawEvents = [
        createBlockchainEventMock(EventSignature.TRANSFER, 0),
        createBlockchainEventMock(EventSignature.TRANSFER, 1),
      ]

      const decodedEvents = [
        createBlockchainEventDecodedMock(EventSignature.TRANSFER, 0, {
          from,
          to,
          value: amountMock,
        }),

        createBlockchainEventDecodedMock(EventSignature.TRANSFER, 1, {
          from,
          to,
          tokenId: amountMock,
        }),
      ]

      const transactionReceiptMock = createTransactionReceiptMock(0)

      // Operations
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

      ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

      tokenRepoMock.find.mockResolvedValue([
        { contractAddress: rawEvents[0].address },
        { contractAddress: rawEvents[1].address },
      ])

      tokenRepoMock.findOne.mockResolvedValue(tokenEntityMock)

      ethersProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceiptMock,
      )

      await service.regenerateDatabase()

      expect(operationRepoMock.insert).toHaveBeenCalledTimes(rawEvents.length)

      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(rawEvents.length)

      expect(eventsServiceMock.emitTokenTransferEvent).toHaveBeenCalledTimes(
        rawEvents.length,
      )

      for (let i = 0; i < rawEvents.length; i++) {
        expect(operationRepoMock.insert).toHaveBeenCalledWith({
          blockNumber: rawEvents[i].blockNumber,
          chainName: chainNameMock,
          createdAt: expect.any(Date),
          createdBy: 'Recovery',
          decodedEvent: expect.any(Object),
          id: expect.any(String),
          operation,
          receipt: expect.any(Object),
          status: EntityStatus.Confirmed,
          transactionHash: rawEvents[i].transactionHash,
          transactionId: '',
        })

        expect(
          eventsServiceMock.emitAsyncOperationResultEvent,
        ).toHaveBeenCalledWith(
          expect.any(String),
          true,
          chainNameMock,
          rawEvents[i].transactionHash,
          expect.any(Object),
        )

        expect(eventsServiceMock.emitTokenTransferEvent).toHaveBeenCalledWith(
          tokenEntityMock.name,
          tokenEntityMock.symbol,
          tokenEntityMock.contractAddress,
          amountMock,
          from,
          to,
          rawEvents[i].blockNumber,
          transactionReceiptMock.from,
          rawEvents[i].transactionHash,
          chainNameMock,
        )
      }

      expect(ethersMock.ethers.providers.JsonRpcProvider).toHaveBeenCalledTimes(
        1,
      )
      expect(ethersMock.ethers.providers.JsonRpcProvider).toHaveBeenCalledWith(
        chainUrlMock,
      )

      expect(ethersProviderMock.getLogs).toHaveBeenCalledTimes(1)
      expect(ethersProviderMock.getLogs).toHaveBeenCalledWith({
        fromBlock: blockNumberMock,
        toBlock: blockNumberMock2,
        topics: [
          [
            EventSignature.DEPLOY_ERC20,
            EventSignature.DEPLOY_ERC721,
            EventSignature.TRANSFER,
          ],
        ],
      })
    })

    it.each([
      [TokenOperationType.Transfer, addressFromMock, addressToMock],
      [TokenOperationType.Mint, addressEmptyMock, addressToMock],
      [TokenOperationType.Burn, addressFromMock, addressEmptyMock],
    ])(
      'creates %s operations including decoded event',
      async (operation, from, to) => {
        const rawEvents = [
          createBlockchainEventMock(EventSignature.TRANSFER, 0),
          createBlockchainEventMock(EventSignature.TRANSFER, 1),
        ]

        const decodedEvents = [
          createBlockchainEventDecodedMock(EventSignature.TRANSFER, 0, {
            from,
            to,
          }),
          createBlockchainEventDecodedMock(EventSignature.TRANSFER, 1, {
            from,
            to,
          }),
        ]

        // Operations
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

        ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

        tokenRepoMock.find.mockResolvedValue([
          { contractAddress: rawEvents[0].address },
          { contractAddress: rawEvents[1].address },
        ])

        await service.regenerateDatabase()

        expect(operationRepoMock.insert).toHaveBeenCalledTimes(rawEvents.length)

        for (let i = 0; i < rawEvents.length; i++) {
          expect(operationRepoMock.insert).toHaveBeenCalledWith(
            expect.objectContaining({
              decodedEvent: {
                address: rawEvents[i].address,
                topics: rawEvents[i].topics,
                data: rawEvents[i].data,
                event: decodedEvents[i].signature,
                decodedData: decodedEvents[i].args,
                blockNumber: rawEvents[i].blockNumber,
                txHash: rawEvents[i].transactionHash,
                txIndex: rawEvents[i].transactionIndex,
                blockHash: rawEvents[i].blockHash,
                index: rawEvents[i].logIndex,
                removed: rawEvents[i].removed,
              },
            }),
          )
        }
      },
    )

    it.each([
      [TokenOperationType.Transfer, addressFromMock, addressToMock],
      [TokenOperationType.Mint, addressEmptyMock, addressToMock],
      [TokenOperationType.Burn, addressFromMock, addressEmptyMock],
    ])(
      'creates %s operations including receipt',
      async (operation, from, to) => {
        const rawEvents = [
          createBlockchainEventMock(EventSignature.TRANSFER, 0),
          createBlockchainEventMock(EventSignature.TRANSFER, 1),
        ]

        const eventData = [
          { test1: 'test1' },
          { test2: 'test2' },
          { test3: 'test3' },
          { test4: 'test4' },
        ]

        const decodedEvents = [
          createBlockchainEventDecodedMock(EventSignature.TRANSFER, 0, {
            from,
            to,
          }),
          createBlockchainEventDecodedMock(
            EventSignature.TRANSFER,
            1,
            eventData[0],
          ),
          createBlockchainEventDecodedMock(
            EventSignature.TRANSFER,
            2,
            eventData[1],
          ),
          createBlockchainEventDecodedMock(EventSignature.TRANSFER, 3, {
            from,
            to,
          }),
          createBlockchainEventDecodedMock(
            EventSignature.TRANSFER,
            4,
            eventData[2],
          ),
          createBlockchainEventDecodedMock(
            EventSignature.TRANSFER,
            5,
            eventData[3],
          ),
        ]

        const transactionReceipts = [
          createTransactionReceiptMock(0),
          createTransactionReceiptMock(1),
        ]

        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[2])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[3])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[4])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[5])

        ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

        tokenRepoMock.find.mockResolvedValue([
          { contractAddress: rawEvents[0].address },
          { contractAddress: rawEvents[1].address },
        ])

        ethersProviderMock.getTransactionReceipt.mockResolvedValueOnce(
          transactionReceipts[0],
        )
        ethersProviderMock.getTransactionReceipt.mockResolvedValueOnce(
          transactionReceipts[1],
        )

        await service.regenerateDatabase()

        expect(operationRepoMock.insert).toHaveBeenCalledTimes(rawEvents.length)

        for (let i = 0; i < rawEvents.length; i++) {
          const decodedEventIndex = i * 3 + 1
          const eventDataIndex = i * 2

          expect(operationRepoMock.insert).toHaveBeenCalledWith(
            expect.objectContaining({
              receipt: {
                txHash: transactionReceipts[i].transactionHash,
                blockHash: transactionReceipts[i].blockHash,
                blockNumber: transactionReceipts[i].blockNumber,
                txIndex: transactionReceipts[i].transactionIndex,
                contractAddress: transactionReceipts[i].contractAddress,
                status: transactionReceipts[i].status === 1,
                bloom: transactionReceipts[i].logsBloom,
                logs: [
                  {
                    address: transactionReceipts[i].logs[0].address,
                    topics: transactionReceipts[i].logs[0].topics,
                    data: transactionReceipts[i].logs[0].data,
                    event: decodedEvents[decodedEventIndex].signature,
                    decodedData: eventData[eventDataIndex],
                    blockNumber: transactionReceipts[i].logs[0].blockNumber,
                    txHash: transactionReceipts[i].logs[0].transactionHash,
                    txIndex: transactionReceipts[i].logs[0].transactionIndex,
                    blockHash: transactionReceipts[i].logs[0].blockHash,
                    index: transactionReceipts[i].logs[0].logIndex,
                    removed: transactionReceipts[i].logs[0].removed,
                  },
                  {
                    address: transactionReceipts[i].logs[1].address,
                    topics: transactionReceipts[i].logs[1].topics,
                    data: transactionReceipts[i].logs[1].data,
                    event: decodedEvents[decodedEventIndex + 1].signature,
                    decodedData: eventData[eventDataIndex + 1],
                    blockNumber: transactionReceipts[i].logs[1].blockNumber,
                    txHash: transactionReceipts[i].logs[1].transactionHash,
                    txIndex: transactionReceipts[i].logs[1].transactionIndex,
                    blockHash: transactionReceipts[i].logs[1].blockHash,
                    index: transactionReceipts[i].logs[1].logIndex,
                    removed: transactionReceipts[i].logs[1].removed,
                  },
                ],
                gasUsed: transactionReceipts[i].gasUsed.toNumber(),
                cumulativeGasUsed:
                  transactionReceipts[i].cumulativeGasUsed.toNumber(),
                revertReason: undefined,
                output: undefined,
                privateFrom: undefined,
                privateFor: undefined,
                privacyGroupId: undefined,
              },
            }),
          )
        }
      },
    )

    it.each([
      [TokenOperationType.Transfer, addressFromMock, addressToMock],
      [TokenOperationType.Mint, addressEmptyMock, addressToMock],
      [TokenOperationType.Burn, addressFromMock, addressEmptyMock],
    ])(
      'creates %s operations including receipt if event cannot be decoded',
      async (operation, from, to) => {
        const rawEvents = [
          createBlockchainEventMock(EventSignature.TRANSFER, 0),
        ]

        const decodedEvents = [
          createBlockchainEventDecodedMock(EventSignature.TRANSFER, 0, {
            from,
            to,
          }),
        ]

        const transactionReceipt = createTransactionReceiptMock(0)

        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
        ethersInterfaceMock.parseLog.mockImplementation(() => {
          throw new Error()
        })

        ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

        tokenRepoMock.find.mockResolvedValue([
          { contractAddress: rawEvents[0].address },
        ])

        ethersProviderMock.getTransactionReceipt.mockResolvedValueOnce(
          transactionReceipt,
        )

        await service.regenerateDatabase()

        expect(operationRepoMock.insert).toHaveBeenCalledTimes(rawEvents.length)

        expect(operationRepoMock.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            receipt: expect.objectContaining({
              logs: [
                {
                  address: transactionReceipt.logs[0].address,
                  topics: transactionReceipt.logs[0].topics,
                  data: transactionReceipt.logs[0].data,
                  event: undefined,
                  decodedData: undefined,
                  blockNumber: transactionReceipt.logs[0].blockNumber,
                  txHash: transactionReceipt.logs[0].transactionHash,
                  txIndex: transactionReceipt.logs[0].transactionIndex,
                  blockHash: transactionReceipt.logs[0].blockHash,
                  index: transactionReceipt.logs[0].logIndex,
                  removed: transactionReceipt.logs[0].removed,
                },
                {
                  address: transactionReceipt.logs[1].address,
                  topics: transactionReceipt.logs[1].topics,
                  data: transactionReceipt.logs[1].data,
                  event: undefined,
                  decodedData: undefined,
                  blockNumber: transactionReceipt.logs[1].blockNumber,
                  txHash: transactionReceipt.logs[1].transactionHash,
                  txIndex: transactionReceipt.logs[1].transactionIndex,
                  blockHash: transactionReceipt.logs[1].blockHash,
                  index: transactionReceipt.logs[1].logIndex,
                  removed: transactionReceipt.logs[1].removed,
                },
              ],
            }),
          }),
        )
      },
    )

    it.each([
      [TokenOperationType.Transfer, addressFromMock, addressToMock],
      [TokenOperationType.Mint, addressEmptyMock, addressToMock],
      [TokenOperationType.Burn, addressFromMock, addressEmptyMock],
    ])(
      'creates %s operations across multiple chains',
      async (operation, from, to) => {
        const rawEvents = [
          createBlockchainEventMock(EventSignature.TRANSFER, 0),
          createBlockchainEventMock(EventSignature.TRANSFER, 1),
        ]

        const decodedEvents = [
          createBlockchainEventDecodedMock(EventSignature.TRANSFER, 0, {
            from,
            to,
          }),

          createBlockchainEventDecodedMock(EventSignature.TRANSFER, 1, {
            from,
            to,
          }),
        ]

        const chains = [
          { name: chainNameMock, urls: [chainUrlMock] } as IChain,
          { name: chainNameMock2, urls: [chainUrlMock2] } as IChain,
        ]

        // Chain 1
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

        // Chain 2
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

        ethersProviderMock.getLogs.mockResolvedValue(rawEvents)
        chainRegisterMock.getAllChains.mockResolvedValue(chains)

        tokenChainsMock.mockResolvedValue([
          { chainName: chainNameMock },
          { chainName: chainNameMock2 },
        ])

        tokenRepoMock.find.mockResolvedValue([
          { contractAddress: rawEvents[0].address },
          { contractAddress: rawEvents[1].address },
        ])

        await service.regenerateDatabase()

        expect(operationRepoMock.insert).toHaveBeenCalledTimes(
          rawEvents.length * chains.length,
        )

        for (let i = 0; i < rawEvents.length * chains.length; i++) {
          const eventIndex = i % rawEvents.length

          expect(operationRepoMock.insert).toHaveBeenCalledWith({
            blockNumber: rawEvents[eventIndex].blockNumber,
            chainName: chainNameMock,
            createdAt: expect.any(Date),
            createdBy: 'Recovery',
            decodedEvent: expect.any(Object),
            id: expect.any(String),
            operation,
            receipt: expect.any(Object),
            status: EntityStatus.Confirmed,
            transactionHash: rawEvents[eventIndex].transactionHash,
            transactionId: '',
          })
        }

        expect(
          ethersMock.ethers.providers.JsonRpcProvider,
        ).toHaveBeenCalledTimes(2)

        expect(
          ethersMock.ethers.providers.JsonRpcProvider,
        ).toHaveBeenCalledWith(chainUrlMock)

        expect(
          ethersMock.ethers.providers.JsonRpcProvider,
        ).toHaveBeenCalledWith(chainUrlMock2)
      },
    )

    it.each([
      [TokenOperationType.Transfer, addressFromMock, addressToMock],
      [TokenOperationType.Mint, addressEmptyMock, addressToMock],
      [TokenOperationType.Burn, addressFromMock, addressEmptyMock],
    ])(
      'skips %s operations if they already exist',
      async (operation, from, to) => {
        const rawEvents = [
          createBlockchainEventMock(EventSignature.TRANSFER, 0),
          createBlockchainEventMock(EventSignature.TRANSFER, 1),
        ]

        const decodedEvents = [
          createBlockchainEventDecodedMock(EventSignature.TRANSFER, 0, {
            from,
            to,
          }),
          ,
          createBlockchainEventDecodedMock(EventSignature.TRANSFER, 1, {
            from,
            to,
          }),
        ]

        // Operations
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
        ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

        ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

        tokenRepoMock.find.mockResolvedValue([
          { contractAddress: rawEvents[0].address },
          { contractAddress: rawEvents[1].address },
        ])

        operationRepoMock.find.mockResolvedValue([
          { transactionHash: rawEvents[0].transactionHash },
          { transactionHash: rawEvents[1].transactionHash },
        ])

        await service.regenerateDatabase()

        expect(operationRepoMock.insert).toHaveBeenCalledTimes(0)
      },
    )

    it.each([
      ['no operations', undefined],
      ['operation has no block number', { blockNumber: undefined }],
    ])('retrieves events from block 0 if %s', async (condition, operation) => {
      const rawEvents = [
        createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 0),
        createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 1),
      ]

      const decodedEvents = [
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC20, 0),
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC20, 1),
      ]

      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])
      ethersProviderMock.getLogs.mockResolvedValue(rawEvents)
      operationRepoMock.findOne.mockResolvedValue(operation)

      await service.regenerateDatabase()

      expect(ethersProviderMock.getLogs).toHaveBeenCalledWith({
        fromBlock: 0,
        toBlock: blockNumberMock2,
        topics: [
          [
            EventSignature.DEPLOY_ERC20,
            EventSignature.DEPLOY_ERC721,
            EventSignature.TRANSFER,
          ],
        ],
      })
    })

    it('retrieves events using multple calls if missing blocks exceeds batch size', async () => {
      const batchCount = 2
      const batchSize = (blockNumberMock2 - blockNumberMock) / batchCount

      config().recoveryMode.batchSize = batchSize

      const rawEvents = [
        createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 0),
        createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 1),
      ]

      const decodedEvents = [
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC20, 0),
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC20, 1),
      ]

      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

      ethersProviderMock.getLogs.mockResolvedValueOnce([rawEvents[0]])
      ethersProviderMock.getLogs.mockResolvedValueOnce([rawEvents[1]])

      await service.regenerateDatabase()

      expect(ethersProviderMock.getLogs).toHaveBeenCalledTimes(batchCount)
      expect(tokenRepoMock.insert).toHaveBeenCalledTimes(rawEvents.length)

      expect(ethersProviderMock.getLogs).toHaveBeenCalledWith({
        fromBlock: blockNumberMock,
        toBlock: blockNumberMock + batchSize,
        topics: [
          [
            EventSignature.DEPLOY_ERC20,
            EventSignature.DEPLOY_ERC721,
            EventSignature.TRANSFER,
          ],
        ],
      })

      expect(ethersProviderMock.getLogs).toHaveBeenCalledWith({
        fromBlock: blockNumberMock + batchSize,
        toBlock: blockNumberMock2,
        topics: [
          [
            EventSignature.DEPLOY_ERC20,
            EventSignature.DEPLOY_ERC721,
            EventSignature.TRANSFER,
          ],
        ],
      })
    })

    it('decodes events using ERC721 contract if not found in ERC20', async () => {
      const rawEvents = [
        createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 0),
        createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 1),
      ]

      const decodedEvents = [
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC20, 0),
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC20, 1),
      ]

      ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

      ethersInterfaceMock.parseLog.mockImplementationOnce(() => {
        throw new Error()
      })

      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

      await service.regenerateDatabase()

      expect(ethersMock.ethers.utils.Interface).toHaveBeenCalledWith(
        CodefiERC721.abi,
      )
    })

    it('encodes event signatures using ERC721 contract if not found in ERC20', async () => {
      const rawEvents = [
        createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 0),
        createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 1),
      ]

      const decodedEvents = [
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC20, 0),
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC20, 1),
      ]

      ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

      ethersInterfaceMock.getEventTopic.mockImplementationOnce(() => {
        throw new Error()
      })

      ethersInterfaceMock.getEventTopic.mockImplementation(
        (signature) => signature,
      )

      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[1])

      await service.regenerateDatabase()

      expect(ethersMock.ethers.utils.Interface).toHaveBeenCalledWith(
        CodefiERC721.abi,
      )
    })

    it('supports blockchain urls containing username and password', async () => {
      const rawEvents = [
        createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 0),
      ]

      const decodedEvents = [
        createBlockchainEventDecodedMock(EventSignature.DEPLOY_ERC20, 0),
      ]

      ethersInterfaceMock.parseLog.mockReturnValueOnce(decodedEvents[0])
      ethersProviderMock.getLogs.mockResolvedValue(rawEvents)

      config().orchestrate.blockchainUrl =
        'https://testuser:testpass@testhost.com/testpath:1234'

      await service.regenerateDatabase()

      expect(ethersMock.ethers.providers.JsonRpcProvider).toHaveBeenCalledTimes(
        1,
      )
      expect(ethersMock.ethers.providers.JsonRpcProvider).toHaveBeenCalledWith({
        url: 'https://testhost.com/testpath:1234',
        user: 'testuser',
        password: 'testpass',
      })
    })

    it('throws if orchestrate is missing chains found in database', async () => {
      chainRegisterMock.getAllChains.mockResolvedValue([])

      tokenChainsMock.mockResolvedValue([
        { chainName: chainNameMock },
        { chainName: chainNameMock2 },
      ])

      await expect(service.regenerateDatabase()).rejects.toThrowError(
        `Database chain names not registered in Orchestrate: ${chainNameMock}, ${chainNameMock2}`,
      )
    })
  })
})
