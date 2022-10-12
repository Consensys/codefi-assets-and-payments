import Joi from '@hapi/joi'
import { Field, SortCriteria } from '../constants/query'
import { WorkflowType } from '../models/WorkflowType'
import { In, IsNull, LessThan, MoreThan } from 'typeorm'

export const v2QueryOptionSchema = Joi.object({
  callerId: Joi.string().required(),
  isInvestorQuery: Joi.boolean().allow(null),
})

export enum FieldColumnTypes {
  ID = 'id',
  NAME = 'name',
  STATE = 'state',
  ROLE = 'role',
  USER_ID = 'userId',
  RECIPIENT_ID = 'recipientId',
  ENTITY_ID = 'entityId',
  DATA = 'data',
  WORKFLOW_TYPE = 'workflowType',
  DATE = 'date',
  ASSET_CLASS = 'assetClassKey',
  QUANTITY = 'quantity',
  PRICE = 'price',
  ENTITY_TYPE = 'entityType',
  WALLET = 'wallet',
  TENANT_ID = 'tenantId',
  OFFER_ID = 'offerId',
  ORDER_SIDE = 'orderSide',
  CREATED_AT = 'createdAt',
}

export function parseFields(fields: Array<Field>) {
  return fields.reduce((memo, { name, comparator, value }) => {
    const getCriteria = (comparator, value) => {
      switch (comparator) {
        case '=':
          if (Array.isArray(value)) {
            return In(value)
          } else {
            return value
          }

        case '>':
          return MoreThan(value)
        case '<':
          return LessThan(value)
        case '!':
          return IsNull()
        default:
          throw new Error(
            `"${comparator}" unsupported comparator. You can use "=", "<" or ">"`,
          )
      }
    }

    return {
      ...memo,
      [name]: getCriteria(comparator, value),
    }
  }, {})
}

export function parseOrder(order: Array<SortCriteria>) {
  return order.reduce((memo, item) => {
    return {
      ...memo,
      ...item,
    }
  }, {})
}

export function checkForNullUserQuery(fields: Array<Field>): boolean {
  return (
    fields.findIndex(
      field =>
        field.name === FieldColumnTypes.USER_ID && field.comparator === '!',
    ) !== -1 &&
    fields.findIndex(
      field =>
        field.name === FieldColumnTypes.RECIPIENT_ID &&
        field.comparator === '!',
    ) !== -1
  )
}

export function checkForOrderWorkflowQuery(fields: Array<Field>): boolean {
  return fields.some(
    field =>
      field.name === FieldColumnTypes.WORKFLOW_TYPE &&
      (Array.isArray(field.value)
        ? field.value.includes(WorkflowType.ORDER)
        : field.value === WorkflowType.ORDER),
  )
}

export function buildQueryForNullUserQuery(
  tenantId: string,
  fields: Array<Field>,
) {
  const typeOrmWhereQuery = [
    {
      tenantId,
      ...parseFields(
        fields.filter(field => field.name !== FieldColumnTypes.USER_ID),
      ),
    },
    {
      tenantId,
      ...parseFields(
        fields.filter(field => field.name !== FieldColumnTypes.RECIPIENT_ID),
      ),
    },
  ]
  return typeOrmWhereQuery
}

export function buildQueryForInvestors(
  tenantId: string,
  callerId: string,
  fields: Array<Field>,
) {
  const cleanedFields: Array<Field> = []

  // Remove caller from the values of userId and recipientId
  fields.forEach(field => {
    if (
      field.name !== FieldColumnTypes.USER_ID &&
      field.name !== FieldColumnTypes.RECIPIENT_ID
    ) {
      cleanedFields.push(field)
    } else {
      if (Array.isArray(field.value)) {
        cleanedFields.push({
          ...field,
          value: field.value.filter(id => id !== callerId),
        })
      }
    }
  })

  const typeOrmWhereQuery = [
    {
      tenantId,
      ...parseFields(cleanedFields),
      userId: callerId,
    },
    {
      tenantId,
      ...parseFields(cleanedFields),
      recipientId: callerId,
    },
  ]

  return typeOrmWhereQuery
}
