import {
  tenantIdMock,
  subjectMock,
  accountMock,
  entityIdMock,
  createMockLogger,
} from '../../test/mocks'
import { AccountsController } from './AccountsController'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  craftRequestWithAuthHeaders,
  extractTokenFromRequest,
} from '@consensys/auth'
import { OrchestrateAccountsService } from '@consensys/nestjs-orchestrate'

describe('AccountsController', () => {
  let controller: AccountsController
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let orchestrateAccountsServiceMock: jest.Mocked<OrchestrateAccountsService>

  beforeEach(async () => {
    orchestrateAccountsServiceMock = createMockInstance(
      OrchestrateAccountsService,
    )
    loggerMock = createMockLogger()
    controller = new AccountsController(
      loggerMock,
      orchestrateAccountsServiceMock,
    )
  })

  describe('Create account', () => {
    it('(POST) Create an account - success', async () => {
      orchestrateAccountsServiceMock.generateAccount.mockImplementationOnce(
        async () => accountMock,
      )

      const mockedRequest = craftRequestWithAuthHeaders(
        tenantIdMock,
        entityIdMock,
        subjectMock,
      )
      await expect(controller.createAccount(mockedRequest)).resolves.toBeDefined()
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(1)
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledWith(extractTokenFromRequest(mockedRequest))
    })

    it('(POST) Create an account - failure', async () => {
      orchestrateAccountsServiceMock.generateAccount.mockImplementationOnce(
        async () => {
          throw new Error('boom')
        },
      )

      await expect(
        controller.createAccount(
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        ),
      ).rejects.toThrow('boom')
      expect(
        orchestrateAccountsServiceMock.generateAccount,
      ).toHaveBeenCalledTimes(1)
    })
  })
})
