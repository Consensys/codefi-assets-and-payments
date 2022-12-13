import {
  TransferDigitalCurrencyRequest,
  EntityStatus,
} from '@consensys/ts-types'
import createMockInstance from 'jest-create-mock-instance'
import {
  addressMock2,
  burnDigitalCurrencyRequest,
  createDigitalCurrencyRequestMock,
  digitalCurrencyEntityMock,
  entityIdMock,
  mintDigitalCurrencyRequest,
  requestWithTenantIdAndEntityId,
  subjectMock,
  tenantIdMock,
  uuidMock,
  transferRequestMock,
} from '../../test/mocks'
import { DigitalCurrencyService } from '../services/DigitalCurrencyService'
import { DigitalCurrencyController } from './DigitalCurrencyController'

describe('DigitalCurrencyController', () => {
  let controller: DigitalCurrencyController
  let digitalCurrencyServiceMock: jest.Mocked<DigitalCurrencyService>

  beforeEach(() => {
    digitalCurrencyServiceMock = createMockInstance(DigitalCurrencyService)
    controller = new DigitalCurrencyController(digitalCurrencyServiceMock)
  })

  describe('create', () => {
    it('success', async () => {
      await controller.create(
        createDigitalCurrencyRequestMock,
        requestWithTenantIdAndEntityId,
      )
      expect(digitalCurrencyServiceMock.create).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.create).toHaveBeenCalledWith(
        createDigitalCurrencyRequestMock.name,
        createDigitalCurrencyRequestMock.symbol,
        createDigitalCurrencyRequestMock.decimals,
        tenantIdMock,
        subjectMock,
        EntityStatus.Pending,
        entityIdMock,
        undefined,
      )
    })

    it('success - ethereum address specified', async () => {
      await controller.create(
        {
          ...createDigitalCurrencyRequestMock,
          ethereumAddress: addressMock2,
          decimals: undefined,
        },
        requestWithTenantIdAndEntityId,
      )
      expect(digitalCurrencyServiceMock.create).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.create).toHaveBeenCalledWith(
        createDigitalCurrencyRequestMock.name,
        createDigitalCurrencyRequestMock.symbol,
        2,
        tenantIdMock,
        subjectMock,
        EntityStatus.Pending,
        entityIdMock,
        addressMock2,
      )
    })
  })

  describe('transfer', () => {
    it('success', async () => {
      await controller.transfer(
        digitalCurrencyEntityMock.id,
        transferRequestMock,
        requestWithTenantIdAndEntityId,
      )
      expect(digitalCurrencyServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.transfer).toHaveBeenCalledWith(
        digitalCurrencyEntityMock.id,
        transferRequestMock.amount,
        transferRequestMock.to,
        tenantIdMock,
        subjectMock,
        entityIdMock,
        undefined,
      )
    })

    it('success - ethereum address specified', async () => {
      await controller.transfer(
        digitalCurrencyEntityMock.id,
        { ...transferRequestMock, ethereumAddress: addressMock2 },
        requestWithTenantIdAndEntityId,
      )
      expect(digitalCurrencyServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.transfer).toHaveBeenCalledWith(
        digitalCurrencyEntityMock.id,
        transferRequestMock.amount,
        transferRequestMock.to,
        tenantIdMock,
        subjectMock,
        entityIdMock,
        addressMock2,
      )
    })

    it('success', async () => {
      const transferReq: TransferDigitalCurrencyRequest = {
        amount: '0x64',
        to: addressMock2,
      }
      await controller.transfer(
        digitalCurrencyEntityMock.id,
        transferReq,
        requestWithTenantIdAndEntityId,
      )
      expect(digitalCurrencyServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.transfer).toHaveBeenCalledWith(
        digitalCurrencyEntityMock.id,
        transferReq.amount,
        transferReq.to,
        tenantIdMock,
        subjectMock,
        entityIdMock,
        undefined,
      )
    })
  })

  describe('find', () => {
    it('success', async () => {
      await controller.findAll(requestWithTenantIdAndEntityId)
      expect(digitalCurrencyServiceMock.findAll).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.findAll).toHaveBeenCalledWith(
        tenantIdMock,
      )
    })
  })

  describe('findById', () => {
    it('success', async () => {
      await controller.findById(uuidMock, requestWithTenantIdAndEntityId)
      expect(digitalCurrencyServiceMock.findOneById).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.findOneById).toHaveBeenCalledWith(
        uuidMock,
        tenantIdMock,
      )
    })
  })

  describe('mint', () => {
    it('success', async () => {
      await controller.mint(
        uuidMock,
        mintDigitalCurrencyRequest,
        requestWithTenantIdAndEntityId,
      )
      expect(digitalCurrencyServiceMock.mint).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.mint).toHaveBeenCalledWith(
        uuidMock,
        mintDigitalCurrencyRequest.amount,
        mintDigitalCurrencyRequest.to,
        tenantIdMock,
        subjectMock,
        entityIdMock,
        undefined,
      )
    })

    it('success - ethereum address specified', async () => {
      await controller.mint(
        uuidMock,
        { ...mintDigitalCurrencyRequest, ethereumAddress: addressMock2 },
        requestWithTenantIdAndEntityId,
      )
      expect(digitalCurrencyServiceMock.mint).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.mint).toHaveBeenCalledWith(
        uuidMock,
        mintDigitalCurrencyRequest.amount,
        mintDigitalCurrencyRequest.to,
        tenantIdMock,
        subjectMock,
        entityIdMock,
        addressMock2,
      )
    })
  })

  describe('burn', () => {
    it('success', async () => {
      await controller.burn(
        uuidMock,
        burnDigitalCurrencyRequest,
        requestWithTenantIdAndEntityId,
      )
      expect(digitalCurrencyServiceMock.burn).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.burn).toHaveBeenCalledWith(
        uuidMock,
        burnDigitalCurrencyRequest.amount,
        tenantIdMock,
        subjectMock,
        entityIdMock,
        undefined,
      )
    })

    it('success - ethereum address specified ', async () => {
      await controller.burn(
        uuidMock,
        { ...burnDigitalCurrencyRequest, ethereumAddress: addressMock2 },
        requestWithTenantIdAndEntityId,
      )
      expect(digitalCurrencyServiceMock.burn).toHaveBeenCalledTimes(1)
      expect(digitalCurrencyServiceMock.burn).toHaveBeenCalledWith(
        uuidMock,
        burnDigitalCurrencyRequest.amount,
        tenantIdMock,
        subjectMock,
        entityIdMock,
        addressMock2,
      )
    })
  })
})
