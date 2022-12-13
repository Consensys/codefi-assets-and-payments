import { OperationRequestService } from './OperationRequestService'
import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import { Repository, UpdateResult } from 'typeorm'
import { DigitalCurrencyEntity } from '../data/entities/DigitalCurrencyEntity'
import { OperationRequestEntity } from '../data/entities/OperationRequestEntity'
import {
  addressMock,
  addressMock2,
  addressMock3,
  entityIdMock,
  legalEntityMock,
  subjectMock,
  tenantIdMock,
  uuidMock,
} from '../../test/mocks'
import { DigitalCurrencyService } from './DigitalCurrencyService'
import { OperationEntity } from '../data/entities/OperationEntity'
import { v4 as uuidv4 } from 'uuid'
import { KafkaProducer } from '@consensys/nestjs-messaging'
import {
  AquisitionRedeemRequest,
  OperationRequestAction,
  OperationRequestState,
  OperationRequestType,
} from '@consensys/ts-types'
import { LegalEntityService } from './LegalEntityService'
import { Counted } from './types'

describe('OperationRequests', () => {
  let loggerMock: NestJSPinoLogger
  let operationRequestsRepositoryMock: jest.Mocked<Repository<any>>
  let digitalCurrencyRepositoryMock: jest.Mocked<Repository<any>>
  let operationRepoMock: jest.Mocked<Repository<any>>
  let digitalCurrencyServiceMock: jest.Mocked<DigitalCurrencyService>
  let kafkaProducerMock: jest.Mocked<KafkaProducer>
  let legalEntityServiceMock: jest.Mocked<LegalEntityService>

  let operationRequestService: OperationRequestService

  let token: jest.Mocked<DigitalCurrencyEntity>
  let mockOperationResult: jest.Mocked<OperationRequestEntity>

  const amount = '0x1'

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    operationRequestsRepositoryMock = createMockInstance(Repository)
    digitalCurrencyRepositoryMock = createMockInstance(Repository)
    operationRepoMock = createMockInstance(Repository)
    digitalCurrencyServiceMock = createMockInstance(DigitalCurrencyService)
    kafkaProducerMock = createMockInstance(KafkaProducer)
    legalEntityServiceMock = createMockInstance(LegalEntityService)

    token = createMockInstance(DigitalCurrencyEntity)

    mockOperationResult = createMockInstance(OperationRequestEntity)
    mockOperationResult.amount = amount

    operationRequestsRepositoryMock.save.mockResolvedValue(mockOperationResult)
    digitalCurrencyRepositoryMock.findOne.mockResolvedValue(token)

    legalEntityServiceMock.findOne.mockImplementationOnce(
      async () => legalEntityMock,
    )

    operationRequestService = new OperationRequestService(
      loggerMock,
      operationRequestsRepositoryMock,
      digitalCurrencyRepositoryMock,
      digitalCurrencyServiceMock,
      operationRepoMock,
      kafkaProducerMock,
      legalEntityServiceMock,
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('(OK) service has request returns true', async () => {
    operationRequestsRepositoryMock.findOne.mockResolvedValue(
      createMockInstance(OperationRequestEntity),
    )
    await expect(operationRequestService.hasRequest(uuidMock)).resolves.toBe(
      true,
    )
  })

  it('(OK) service has NO request returns false', async () => {
    operationRequestsRepositoryMock.findOne.mockResolvedValue(undefined)
    await expect(operationRequestService.hasRequest(uuidMock)).resolves.toBe(
      false,
    )
  })

  it('(OK) skip resolving request if state supplied is PENDING', async () => {
    const result = await operationRequestService.resolveRequestState(
      uuidMock,
      OperationRequestState.PENDING,
      tenantIdMock,
      entityIdMock,
      subjectMock,
    )
    expect(result).toBe(undefined) //skipped
  })

  it(`(OK) find all op requests`, async () => {
    const findAndCountMock: any = [
      [
        createMockInstance(OperationRequestEntity),
        createMockInstance(OperationRequestEntity),
      ],
      2,
    ]
    operationRequestsRepositoryMock.findAndCount.mockImplementationOnce(
      async () => findAndCountMock,
    )

    const results: Counted<OperationRequestEntity> =
      await operationRequestService.getAll()
    expect(results.result.length).toBe(2)
  })

  it('(OK) able to save & persist valid requests', async () => {
    const request: AquisitionRedeemRequest = {
      action: OperationRequestAction.APPROVE,
      address: addressMock2,
      amount,
      id: uuidv4(),
      issuer: addressMock3,
      subject: subjectMock,
      tenantId: tenantIdMock,
      tokenAddress: token.currencyEthereumAddress,
      type: OperationRequestType.AQUISITION,
      requiredOperationId: uuidv4(),
    }

    await operationRequestService.saveRequest(request)
    expect(digitalCurrencyRepositoryMock.findOne).toHaveBeenCalledTimes(1)
    expect(operationRequestsRepositoryMock.save).toHaveBeenCalledTimes(1)
  })

  it('(FAIL) cant find digital currency', async () => {
    // not found
    digitalCurrencyRepositoryMock.findOne.mockResolvedValue(undefined)

    const request: AquisitionRedeemRequest = {
      action: OperationRequestAction.APPROVE,
      address: addressMock2,
      amount,
      id: uuidv4(),
      issuer: addressMock3,
      subject: subjectMock,
      tenantId: tenantIdMock,
      tokenAddress: token.currencyEthereumAddress,
      type: OperationRequestType.AQUISITION,
      requiredOperationId: uuidv4(),
    }

    await expect(operationRequestService.saveRequest(request)).rejects.toThrow()
    expect(operationRequestsRepositoryMock.save).toHaveBeenCalledTimes(0)
  })

  it('(OK) update state existing operation request', async () => {
    const updatedResult: jest.Mocked<UpdateResult> =
      createMockInstance(UpdateResult)
    updatedResult.affected = 2
    operationRequestsRepositoryMock.update.mockResolvedValue(updatedResult)

    const opId: string = uuidv4()

    const params: Partial<OperationRequestEntity> = {
      state: OperationRequestState.APPROVED,
    }
    await expect(
      operationRequestService.updateOperationRequest(opId, params),
    ).resolves.toBe(true)
    expect(operationRequestsRepositoryMock.update).toHaveBeenCalledTimes(1)
    expect(operationRequestsRepositoryMock.update).toHaveBeenCalledWith(
      { id: opId },
      params,
    )
  })

  describe('creating request', () => {
    const requester = addressMock
    const issuer = addressMock2

    it('(OK) create operation AQUISITION request', async () => {
      const expected: OperationRequestEntity = {
        amount,
        chainName: token.chainName,
        issuer: addressMock2,
        requester: addressMock,
        state: OperationRequestState.PENDING,
        subject: subjectMock,
        tenantId: tenantIdMock,
        symbol: token.symbol,
        type: OperationRequestType.AQUISITION,
        tokenAddress: token.currencyEthereumAddress,
        id: expect.anything(),
      }

      const result: OperationRequestEntity =
        await operationRequestService.createPendingRequest(
          OperationRequestType.AQUISITION,
          requester,
          amount,
          issuer,
          token.id,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        )

      expect(result).toMatchObject(expected)

      expect(digitalCurrencyRepositoryMock.findOne).toHaveBeenCalledTimes(1)
    })

    it('(OK) create operation REDEEM request', async () => {
      const expected: OperationRequestEntity = {
        amount,
        chainName: token.chainName,
        issuer: addressMock2,
        requester: addressMock,
        state: OperationRequestState.PENDING,
        subject: subjectMock,
        tenantId: tenantIdMock,
        symbol: token.symbol,
        type: OperationRequestType.REDEEM,
        tokenAddress: token.currencyEthereumAddress,
        id: expect.anything(),
      }

      const result: OperationRequestEntity =
        await operationRequestService.createPendingRequest(
          OperationRequestType.REDEEM,
          requester,
          amount,
          issuer,
          token.id,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        )

      expect(result).toMatchObject(expected)

      expect(digitalCurrencyRepositoryMock.findOne).toHaveBeenCalledTimes(1)
    })

    it('(FAIL) token does not exist', async () => {
      digitalCurrencyRepositoryMock.findOne.mockResolvedValue(null) // not found!
      await expect(
        operationRequestService.createPendingRequest(
          OperationRequestType.AQUISITION,
          requester,
          amount,
          issuer,
          token.id,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        ),
      ).rejects.toThrowError(`currency=${token.id} not found`)
    })
  })

  describe('AQUISITION request resolution', () => {
    let mockOperationResult: jest.Mocked<OperationRequestEntity>
    let updatedResult: UpdateResult
    const mintTransactionId = '012345'

    beforeEach(() => {
      mockOperationResult = createMockInstance(OperationRequestEntity)
      mockOperationResult.amount = '0x1'
      mockOperationResult.state = OperationRequestState.PENDING
      mockOperationResult.type = OperationRequestType.AQUISITION

      updatedResult = createMockInstance(UpdateResult)
      operationRequestsRepositoryMock.update.mockResolvedValue(updatedResult)
      operationRequestsRepositoryMock.findOne.mockResolvedValue(
        mockOperationResult,
      )

      digitalCurrencyServiceMock.mint.mockResolvedValue(mintTransactionId)
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('(FAIL) fails if operation doesnt exist', async () => {
      operationRequestsRepositoryMock.findOne.mockResolvedValueOnce(undefined) // not found

      await expect(
        operationRequestService.resolveRequestState(
          uuidMock,
          OperationRequestState.APPROVED,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        ),
      ).rejects.toThrowError(`Operation Request=${uuidMock} not found`)
      expect(operationRequestsRepositoryMock.update).toHaveBeenCalledTimes(0)
    })
  })

  describe('REDEEM request resolution', () => {
    let mockOperationRequest: jest.Mocked<OperationRequestEntity>
    let updatedResult: UpdateResult
    const burnTransactionId = '012345'

    beforeEach(() => {
      mockOperationRequest = createMockInstance(OperationRequestEntity)
      mockOperationRequest.amount = '0x1'
      mockOperationRequest.state = OperationRequestState.PENDING
      mockOperationRequest.type = OperationRequestType.REDEEM

      updatedResult = createMockInstance(UpdateResult)
      operationRequestsRepositoryMock.update.mockResolvedValue(updatedResult)
      operationRequestsRepositoryMock.findOne.mockResolvedValue(
        mockOperationRequest,
      )

      const mockOperation: jest.Mocked<OperationEntity> =
        createMockInstance(OperationEntity)
      mockOperation.operationAmount = mockOperationRequest.amount
      operationRepoMock.findOne.mockResolvedValue(mockOperation)

      digitalCurrencyServiceMock.burn.mockResolvedValue(burnTransactionId)
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('(OK) approve AQUISITION operation request', async () => {
      const opRequest: jest.Mocked<OperationRequestEntity> = createMockInstance(
        OperationRequestEntity,
      )
      opRequest.type = OperationRequestType.AQUISITION
      opRequest.state = OperationRequestState.PENDING
      operationRequestsRepositoryMock.findOne.mockResolvedValueOnce(opRequest)
      digitalCurrencyServiceMock.mint.mockResolvedValueOnce(
        opRequest.resolutionOperationId,
      )

      const performedResolutionOpId =
        await operationRequestService.resolveRequestState(
          uuidMock,
          OperationRequestState.APPROVED,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        )

      // expect no action / operation to reject aquisition
      expect(performedResolutionOpId).toBe(undefined)
      // resolve with mint
      expect(digitalCurrencyServiceMock.mint).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.transfer).toHaveBeenCalledTimes(0)
      expect(digitalCurrencyServiceMock.burn).toHaveBeenCalledTimes(0)
    })

    it('(OK) approve REDEEM operation request', async () => {
      const opRequest: jest.Mocked<OperationRequestEntity> = createMockInstance(
        OperationRequestEntity,
      )
      opRequest.type = OperationRequestType.REDEEM
      opRequest.resolutionOperationId = uuidv4()
      opRequest.amount = amount
      opRequest.state = OperationRequestState.PENDING

      operationRequestsRepositoryMock.findOne.mockResolvedValueOnce(opRequest)
      digitalCurrencyServiceMock.burn.mockResolvedValueOnce(
        opRequest.resolutionOperationId,
      )

      const performedResolutionOpId =
        await operationRequestService.resolveRequestState(
          uuidMock,
          OperationRequestState.APPROVED,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        )

      // resolution op needed for redeem
      expect(performedResolutionOpId).toBe(opRequest.resolutionOperationId)
      // burn for redeem
      expect(digitalCurrencyServiceMock.burn).toHaveBeenCalledTimes(1)
      // no refund
      expect(digitalCurrencyServiceMock.transfer).toHaveBeenCalledTimes(0)
      expect(digitalCurrencyServiceMock.mint).toHaveBeenCalledTimes(0)
    })

    it('(OK) reject AQUISITION operation request', async () => {
      const opRequest: jest.Mocked<OperationRequestEntity> = createMockInstance(
        OperationRequestEntity,
      )
      opRequest.type = OperationRequestType.AQUISITION
      opRequest.state = OperationRequestState.PENDING
      operationRequestsRepositoryMock.findOne.mockResolvedValueOnce(opRequest)

      const performedResolutionOpId =
        await operationRequestService.resolveRequestState(
          uuidMock,
          OperationRequestState.REJECTED,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        )

      // expect no action / operation to reject aquisition
      expect(performedResolutionOpId).toBe(undefined)
      // nope, dont mint
      expect(digitalCurrencyServiceMock.mint).toHaveBeenCalledTimes(0)
      expect(digitalCurrencyServiceMock.burn).toHaveBeenCalledTimes(0)
      expect(digitalCurrencyServiceMock.transfer).toHaveBeenCalledTimes(0)
    })

    it('(OK) reject REDEEM operation request', async () => {
      const opRequest: jest.Mocked<OperationRequestEntity> = createMockInstance(
        OperationRequestEntity,
      )
      opRequest.type = OperationRequestType.REDEEM
      opRequest.resolutionOperationId = uuidv4()
      opRequest.state = OperationRequestState.PENDING

      operationRequestsRepositoryMock.findOne.mockResolvedValueOnce(opRequest)
      digitalCurrencyServiceMock.transfer.mockResolvedValueOnce(
        opRequest.resolutionOperationId,
      )

      const performedResolutionOpId =
        await operationRequestService.resolveRequestState(
          uuidMock,
          OperationRequestState.REJECTED,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        )

      // resolution op needed for redeem
      expect(performedResolutionOpId).toBe(opRequest.resolutionOperationId)
      // nope, dont mint
      expect(digitalCurrencyServiceMock.burn).toHaveBeenCalledTimes(0)
      // return funds to requester
      expect(digitalCurrencyServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.mint).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) fails if operation doesnt exist', async () => {
      operationRequestsRepositoryMock.findOne.mockResolvedValueOnce(undefined) // not found

      await expect(
        operationRequestService.resolveRequestState(
          uuidMock,
          OperationRequestState.APPROVED,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        ),
      ).rejects.toThrowError(`Operation Request=${uuidMock} not found`)
      expect(operationRequestsRepositoryMock.update).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) fails to find operation to redeem', async () => {
      const opRequestMock: OperationRequestEntity = createMockInstance(
        OperationRequestEntity,
      )
      operationRequestsRepositoryMock.findOne.mockResolvedValue({
        ...opRequestMock,
        type: OperationRequestType.REDEEM,
        state: OperationRequestState.PENDING,
      })
      operationRepoMock.findOne.mockResolvedValueOnce(undefined) // not found

      let error
      try {
        await operationRequestService.resolveRequestState(
          uuidMock,
          OperationRequestState.APPROVED,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        )
      } catch (e) {
        error = e
      }
      expect(error.errorName).toBe('OperationNotFound')
      expect(operationRequestsRepositoryMock.update).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) incorrect amount for resolving the request', async () => {
      const opRequestMock: OperationRequestEntity = createMockInstance(
        OperationRequestEntity,
      )
      operationRequestsRepositoryMock.findOne.mockResolvedValue({
        ...opRequestMock,
        type: OperationRequestType.REDEEM,
        amount: '0x666',
        state: OperationRequestState.PENDING,
      })

      let error
      try {
        await operationRequestService.resolveRequestState(
          uuidMock,
          OperationRequestState.APPROVED,
          tenantIdMock,
          entityIdMock,
          subjectMock,
        )
      } catch (e) {
        error = e
      }

      expect(error.errorCode).toBe('EAPP02')
      expect(error.errorName).toBe('FundsMismatch')
      expect(operationRequestsRepositoryMock.update).toHaveBeenCalledTimes(0)
    })
  })
})
