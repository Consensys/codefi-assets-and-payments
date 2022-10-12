import { In, IsNull } from 'typeorm'
import { Field } from '../constants/query'
import {
  buildQueryForNullUserQuery,
  buildQueryForInvestors,
  checkForNullUserQuery,
  checkForOrderWorkflowQuery,
  FieldColumnTypes,
} from './filters'

describe('Filters', () => {
  describe('checkForNullUserQuery', () => {
    it('should return true when userId and recipientId is null', () => {
      const fields: Array<Field> = [
        {
          name: FieldColumnTypes.USER_ID,
          comparator: '!',
          value: null,
        },
        {
          name: FieldColumnTypes.RECIPIENT_ID,
          comparator: '!',
          value: null,
        },
      ]

      expect(checkForNullUserQuery(fields)).toEqual(true)
    })

    it('should return false when only userId is null', () => {
      const fields: Array<Field> = [
        {
          name: FieldColumnTypes.USER_ID,
          comparator: '=',
          value: null,
        },
      ]

      expect(checkForNullUserQuery(fields)).toEqual(false)
    })

    it('should return false when only recipientId is null', () => {
      const fields: Array<Field> = [
        {
          name: FieldColumnTypes.RECIPIENT_ID,
          comparator: '=',
          value: null,
        },
      ]

      expect(checkForNullUserQuery(fields)).toEqual(false)
    })

    it('should return false when there aren\t any nulls', () => {
      const fields: Array<Field> = [
        {
          name: FieldColumnTypes.RECIPIENT_ID,
          comparator: '=',
          value: 'user',
        },
        {
          name: FieldColumnTypes.USER_ID,
          comparator: '=',
          value: 'user',
        },
      ]

      expect(checkForNullUserQuery(fields)).toEqual(false)
    })
  })

  describe('checkForOrderWorkflowQuery', () => {
    it('should return true when there is a field with WorkflowType.ORDER', () => {
      const fields: Array<Field> = [
        {
          name: FieldColumnTypes.WORKFLOW_TYPE,
          comparator: '=',
          value: 'ORDER',
        },
      ]
      expect(checkForOrderWorkflowQuery(fields)).toEqual(true)
    })

    it('should return false when WORKFLOW_TYPE is not ORDER', () => {
      const fields: Array<Field> = [
        {
          name: FieldColumnTypes.WORKFLOW_TYPE,
          comparator: '=',
          value: 'LINK',
        },
      ]
      expect(checkForOrderWorkflowQuery(fields)).toEqual(false)
    })

    it("should return false when there isn't any fields with WORKFLOW_TYPE", () => {
      const fields: Array<Field> = []
      expect(checkForOrderWorkflowQuery(fields)).toEqual(false)
    })
  })

  describe('buildQueryForNullUserQuery', () => {
    it('should build an array of typeOrmWhereQuery with one recipientId = IsNull and another with userId = IsNull', () => {
      const tenantId = 'tenantId'
      const fields: Array<Field> = [
        {
          name: FieldColumnTypes.USER_ID,
          comparator: '!',
          value: null,
        },
        {
          name: FieldColumnTypes.RECIPIENT_ID,
          comparator: '!',
          value: null,
        },
      ]

      expect(buildQueryForNullUserQuery(tenantId, fields)).toEqual([
        {
          tenantId,
          recipientId: IsNull(),
        },
        {
          tenantId,
          userId: IsNull(),
        },
      ])
    })

    it('should preserve other field values', () => {
      const tenantId = 'tenantId'
      const fields: Array<Field> = [
        {
          name: FieldColumnTypes.USER_ID,
          comparator: '!',
          value: null,
        },
        {
          name: FieldColumnTypes.RECIPIENT_ID,
          comparator: '!',
          value: null,
        },
        {
          name: FieldColumnTypes.NAME,
          comparator: '=',
          value: 'cool name',
        },
      ]

      expect(buildQueryForNullUserQuery(tenantId, fields)).toEqual([
        {
          tenantId,
          recipientId: IsNull(),
          name: 'cool name',
        },
        {
          tenantId,
          userId: IsNull(),
          name: 'cool name',
        },
      ])
    })
  })

  describe('buildQueryForInvestors', () => {
    it('return an array of typeorm where values, one with userId = callerId and another with recipientId = callerId', () => {
      const tenantId = 'tenantId'
      const callerId = 'callerId'
      const fields: Array<Field> = []

      expect(buildQueryForInvestors(tenantId, callerId, fields)).toEqual([
        {
          tenantId,
          userId: callerId,
        },
        {
          tenantId,
          recipientId: callerId,
        },
      ])
    })

    it('should filter out callerId if the field value is an array', () => {
      const tenantId = 'tenantId'
      const callerId = 'callerId'
      const fields: Array<Field> = [
        {
          name: FieldColumnTypes.USER_ID,
          comparator: '=',
          value: ['user1', callerId],
        },
        {
          name: FieldColumnTypes.RECIPIENT_ID,
          comparator: '=',
          value: ['user1', callerId],
        },
      ]

      expect(buildQueryForInvestors(tenantId, callerId, fields)).toEqual([
        {
          tenantId,
          userId: callerId,
          recipientId: In(['user1']),
        },
        {
          tenantId,
          recipientId: callerId,
          userId: In(['user1']),
        },
      ])
    })
  })
})
