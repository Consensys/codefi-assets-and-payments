import { TenantOperationEventConsumer } from './TenantOperationEventConsumer'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import { TenantService } from '../services/TenantService'
import { ChainRegistry } from '@codefi-assets-and-payments/nestjs-orchestrate'
import {
  registeredChainsMock,
  tenantOperationEventMock,
} from '../../test/mocks'
import { MessageDataOperation } from '@codefi-assets-and-payments/messaging-events'
import { M2mTokenService } from '@codefi-assets-and-payments/auth'

describe('TenantOperationEventConsumer', () => {
  let logger: jest.Mocked<NestJSPinoLogger>
  let service: TenantOperationEventConsumer
  let tenantServiceMock: jest.Mocked<TenantService>
  let orchestrateChainRegistryMock: jest.Mocked<ChainRegistry>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    tenantServiceMock = createMockInstance(TenantService)
    orchestrateChainRegistryMock = createMockInstance(ChainRegistry)
    m2mTokenServiceMock = createMockInstance(M2mTokenService)

    service = new TenantOperationEventConsumer(
      logger,
      tenantServiceMock,
      orchestrateChainRegistryMock,
      m2mTokenServiceMock,
    )
  })

  describe('onMessage', () => {
    it('CREATE chain exists - success', async () => {
      orchestrateChainRegistryMock.getAllChains.mockImplementationOnce(
        async () => [registeredChainsMock],
      )
      await service.onMessage(tenantOperationEventMock)

      expect(orchestrateChainRegistryMock.registerChain).toHaveBeenCalledTimes(
        0,
      )
      expect(orchestrateChainRegistryMock.getAllChains).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.create).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.create).toHaveBeenCalledWith(
        tenantOperationEventMock.tenantId,
        tenantOperationEventMock.name,
        tenantOperationEventMock.metadata,
        registeredChainsMock.name,
      )
    })

    it('CREATE chain does not exist - success', async () => {
      orchestrateChainRegistryMock.getAllChains.mockImplementationOnce(
        async () => [],
      )
      await service.onMessage(tenantOperationEventMock)

      expect(orchestrateChainRegistryMock.registerChain).toHaveBeenCalledTimes(
        1,
      )
      expect(orchestrateChainRegistryMock.getAllChains).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.create).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.create).toHaveBeenCalledWith(
        tenantOperationEventMock.tenantId,
        tenantOperationEventMock.name,
        tenantOperationEventMock.metadata,
        expect.any(String),
      )
    })

    it('UPDATE - success', async () => {
      await service.onMessage({
        ...tenantOperationEventMock,
        operation: MessageDataOperation.UPDATE,
      })

      expect(tenantServiceMock.update).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.update).toHaveBeenCalledWith(
        {
          id: tenantOperationEventMock.tenantId,
        },
        {
          name: tenantOperationEventMock.name,
          metadata: tenantOperationEventMock.metadata,
        },
      )
    })
    it('DELETE - success', async () => {
      await service.onMessage({
        ...tenantOperationEventMock,
        operation: MessageDataOperation.DELETE,
      })

      expect(tenantServiceMock.delete).toHaveBeenCalledTimes(1)
      expect(tenantServiceMock.delete).toHaveBeenCalledWith(
        tenantOperationEventMock.tenantId,
      )
    })
  })
})
