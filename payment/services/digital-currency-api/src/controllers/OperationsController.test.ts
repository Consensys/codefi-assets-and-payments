import { PeriodGranularity } from '@codefi-assets-and-payments/ts-types'
import createMockInstance from 'jest-create-mock-instance'
import {
  addressMock,
  addressMock2,
  balanceHistoryByPeriodMock,
  createCountedMock,
  operationMock,
  requestWithTenantIdAndEntityId,
  tenantIdMock,
  uuidMock,
} from '../../test/mocks'
import { OperationService } from '../services/OperationService'
import { OperationsController } from './OperationsController'

describe('OperationsController', () => {
  let controller: OperationsController
  let operationsServiceMock: jest.Mocked<OperationService>

  beforeEach(() => {
    operationsServiceMock = createMockInstance(OperationService)
    operationsServiceMock.find.mockImplementationOnce(async () =>
      createCountedMock([operationMock]),
    )
    controller = new OperationsController(operationsServiceMock)
  })

  describe('find', () => {
    it('success - with digitalCurrencyAddress and chainName', async () => {
      const digitalCurrencyAddress = 'digitalCurrencyAddress'
      const chainName = 'chainName'
      await controller.findAll(
        requestWithTenantIdAndEntityId,
        digitalCurrencyAddress,
        chainName,
      )
      expect(operationsServiceMock.find).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.find).toHaveBeenCalledWith(
        {
          digitalCurrencyAddress,
          chainName,
          tenantId: tenantIdMock,
        },
        undefined,
        undefined,
      )
    })
    it('success - with chainName and without digitalCurrencyAddress', async () => {
      const chainName = 'chainName'
      await controller.findAll(
        requestWithTenantIdAndEntityId,
        undefined,
        chainName,
      )
      expect(operationsServiceMock.find).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.find).toHaveBeenCalledWith(
        {
          chainName,
          tenantId: tenantIdMock,
        },
        undefined,
        undefined,
      )
    })

    it('success - without chainName and digitalCurrencyAddress', async () => {
      const chainName = 'chainName'
      await controller.findAll(requestWithTenantIdAndEntityId)
      expect(operationsServiceMock.find).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.find).toHaveBeenCalledWith(
        {
          tenantId: tenantIdMock,
        },
        undefined,
        undefined,
      )
    })
  })

  describe('findById', () => {
    it('success', async () => {
      await controller.findById(uuidMock, requestWithTenantIdAndEntityId)
      expect(operationsServiceMock.findOne).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.findOne).toHaveBeenCalledWith({
        id: uuidMock,
        tenantId: tenantIdMock,
      })
    })
  })

  describe('findBalanceHistoryByPeriod', () => {
    it('success', async () => {
      operationsServiceMock.findBalanceHistoryByPeriod.mockImplementationOnce(
        async () => balanceHistoryByPeriodMock,
      )
      await controller.findBalanceHistoryByPeriod(
        addressMock,
        addressMock2,
        'chainNameMock',
        PeriodGranularity.DAY,
        new Date('01-01-2021').getTime(),
        new Date('30-01-2021').getTime(),
        0,
        0,
      )
      expect(
        operationsServiceMock.findBalanceHistoryByPeriod,
      ).toHaveBeenCalledTimes(1)
      expect(
        operationsServiceMock.findBalanceHistoryByPeriod,
      ).toHaveBeenCalledWith(
        addressMock,
        addressMock2,
        'chainNameMock',
        PeriodGranularity.DAY,
        expect.any(Date),
        expect.any(Date),
        0,
        0,
      )
    })
  })
})
