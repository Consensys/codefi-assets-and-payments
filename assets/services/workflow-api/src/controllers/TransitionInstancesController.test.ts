import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import { TransitionInstancesController } from './TransitionInstancesController'
import { TransitionInstancesService } from '../services/TransitionInstancesService'
import {
  mockId,
  validFirstTransitionInstanceRequest,
  validFirstTransitionInstanceResponse,
  mockIdentityQuery,
  mockField,
  mockValue,
  validFirstUpdatedTransitionInstanceRequest,
} from '../../test/mocks'

describe('TransitionInstancesController', () => {
  let logger: NestJSPinoLogger
  let serviceMock: jest.Mocked<TransitionInstancesService>
  let controller: TransitionInstancesController

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    serviceMock = createMockInstance(TransitionInstancesService)
    controller = new TransitionInstancesController(serviceMock, logger)
  })

  describe('create', () => {
    it('success', async () => {
      serviceMock.create.mockImplementationOnce(
        async () => validFirstTransitionInstanceResponse,
      )
      await controller.create(
        mockIdentityQuery,
        validFirstTransitionInstanceRequest,
      )
      expect(serviceMock.create).toBeCalledTimes(1)
      expect(serviceMock.create).toBeCalledWith(
        mockIdentityQuery.tenantId,
        validFirstTransitionInstanceRequest,
      )
      expect(logger.info).toHaveBeenCalledTimes(1)
    })

    it('failure', async () => {
      serviceMock.create.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.create(
          mockIdentityQuery,
          validFirstTransitionInstanceRequest,
        ),
      ).rejects.toThrowError('boom')
    })
  })

  describe('find', () => {
    it('success', async () => {
      await controller.find(mockIdentityQuery, mockId, mockField, mockValue)
      expect(serviceMock.find).toBeCalledTimes(1)
      expect(serviceMock.find).toBeCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
        mockField,
        mockValue,
      )
    })

    it('failure', async () => {
      serviceMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.find(mockIdentityQuery, mockId, mockField, mockValue),
      ).rejects.toThrowError('boom')
    })
  })

  describe('update', () => {
    it('success', async () => {
      await controller.update(
        mockIdentityQuery,
        mockId,
        validFirstUpdatedTransitionInstanceRequest,
      )
      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(serviceMock.update).toBeCalledTimes(1)
      expect(serviceMock.update).toBeCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
        validFirstUpdatedTransitionInstanceRequest,
      )
    })

    it('failure', async () => {
      serviceMock.update.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.update(
          mockIdentityQuery,
          mockId,
          validFirstTransitionInstanceRequest,
        ),
      ).rejects.toThrowError('boom')
    })
  })

  describe('delete', () => {
    it('success', async () => {
      await controller.delete(mockIdentityQuery, mockId)
      expect(serviceMock.delete).toHaveBeenCalledTimes(1)
      expect(serviceMock.delete).toHaveBeenCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
      )
    })

    it('failure', async () => {
      serviceMock.delete.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.delete(mockIdentityQuery, mockId),
      ).rejects.toThrowError('boom')
    })
  })
})
