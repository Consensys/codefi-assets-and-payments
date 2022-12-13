import createMockInstance from 'jest-create-mock-instance'
import { OperationRequestService } from '../services/OperationRequestService'
import {
  addressMock,
  addressMock2,
  createCountedMock,
  requestWithTenantIdAndEntityId,
  subjectMock,
  tenantIdMock,
  uuidMock,
} from '../../test/mocks'
import { OperationsRequestController } from './OperationRequestController'
import {
  OperationRequestRequest,
  OperationRequestResolve,
  OperationRequestResponse,
  OperationRequestState,
  OperationRequestType,
} from '@consensys/ts-types'

describe('OperationRequestController', () => {
  let operationRequestService: jest.Mocked<OperationRequestService>
  let controller: OperationsRequestController
  const mockedTokenId = 'tokenId'

  beforeEach(() => {
    operationRequestService = createMockInstance(OperationRequestService)
    controller = new OperationsRequestController(operationRequestService)
  })

  it('(OK) fire create operation request', async () => {
    const reqOpRequest: OperationRequestResponse = {
      amount: '100',
      chainName: 'chainName',
      issuer: addressMock2,
      requester: addressMock,
      state: OperationRequestState.PENDING,
      subject: subjectMock,
      tenantId: tenantIdMock,
      symbol: 'symbol',
      tokenAddress: mockedTokenId,
      preRequirementOperationId: 'someTxId',
      type: OperationRequestType.AQUISITION,
      id: 'opReqId',
    }

    operationRequestService.createPendingRequest.mockResolvedValueOnce(
      reqOpRequest,
    )

    const request: OperationRequestRequest = {
      amount: '100',
      issuerAddress: addressMock2,
      requesterAddress: addressMock,
      type: OperationRequestType.AQUISITION,
    }

    await expect(
      controller.createRequest(
        mockedTokenId,
        request,
        requestWithTenantIdAndEntityId,
      ),
    ).resolves.toMatchObject(reqOpRequest)
  })

  it('(OK) resolve operation request (APPROVE)', async () => {
    const opRequestBody: OperationRequestResolve = {
      state: OperationRequestState.APPROVED,
      type: OperationRequestType.AQUISITION,
    }

    const resolutionOperationId = 'resolutionOperationId'
    operationRequestService.resolveRequestState.mockResolvedValueOnce(
      resolutionOperationId,
    )

    await expect(
      controller.resolveRequest(
        'someId',
        opRequestBody,
        requestWithTenantIdAndEntityId,
      ),
    ).resolves.toMatchObject({ operationId: resolutionOperationId })
  })

  it('(OK) find all op requests', async () => {
    const operations: OperationRequestResponse[] = [
      createMockInstance(OperationRequestResponse),
      createMockInstance(OperationRequestResponse),
    ]

    operationRequestService.getAll.mockResolvedValue(
      createCountedMock(operations, operations.length),
    )
    const results = await controller.getAll()
    expect(results).toMatchObject({
      count: operations.length,
      items: operations,
    })
  })
})
