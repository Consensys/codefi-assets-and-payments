import Joi from 'joi';
import {
  Field,
  FieldColumnTypes,
  FieldComparator,
} from 'src/modules/v2ApiCall/api.call.service/query';
import { OrderSide, WorkflowType } from 'src/types/workflow/workflowInstances';
import {
  keys as WorkflowTemplateKeys,
  WorkflowName,
  WorkflowTemplate,
} from 'src/types/workflow/workflowTemplate';
import ErrorService from '../errorService';

export const fieldSchema = Joi.object({
  name: Joi.string().allow(...Object.values(FieldColumnTypes)),
  comparator: Joi.string().allow(...Object.values(FieldComparator)),
  value: Joi.alternatives(
    Joi.string(),
    Joi.array().items(Joi.string().allow(null)),
  ),
});

export function getCommonFilters(
  tenantId: string,
  workflowType: Array<WorkflowType>,
  tokenIds: Array<string>,
): Array<Field> {
  const filters: Array<Field> = [
    {
      name: FieldColumnTypes.TENANT_ID,
      comparator: FieldComparator.EQUALS,
      value: tenantId,
    },
    {
      name: FieldColumnTypes.WORKFLOW_TYPE,
      comparator: FieldComparator.EQUALS,
      value: workflowType,
    },
    {
      name: FieldColumnTypes.ENTITY_ID,
      comparator: FieldComparator.EQUALS,
      value: tokenIds,
    },
  ];

  return filters;
}

export function getQueryFilters(
  userId: string,
  states?: Array<string>,
  functionNames?: Array<string>,
  userIds?: Array<string>,
  dates?: Array<Date>,
  assetClasses?: Array<string>,
): Array<Field> {
  const filters: Array<Field> = [];

  if (states) {
    filters.push({
      name: FieldColumnTypes.STATE,
      comparator: FieldComparator.EQUALS,
      value: states,
    });
  }

  if (functionNames) {
    filters.push({
      name: FieldColumnTypes.NAME,
      comparator: FieldComparator.EQUALS,
      value: functionNames,
    });
  }

  if (dates) {
    filters.push({
      name: FieldColumnTypes.DATE,
      comparator: FieldComparator.EQUALS,
      value: dates.map((date) => date.toISOString()),
    });
  }

  if (userIds) {
    filters.push({
      name: FieldColumnTypes.USER_ID,
      comparator: FieldComparator.EQUALS,
      value: Array.from(new Set([...userIds, userId])),
    });
    filters.push({
      name: FieldColumnTypes.RECIPIENT_ID,
      comparator: FieldComparator.EQUALS,
      value: Array.from(new Set([...userIds, userId])),
    });
  } else {
    filters.push({
      name: FieldColumnTypes.USER_ID,
      comparator: FieldComparator.EQUALS,
      value: userId,
    });
    filters.push({
      name: FieldColumnTypes.RECIPIENT_ID,
      comparator: FieldComparator.EQUALS,
      value: userId,
    });
  }

  if (assetClasses) {
    filters.push({
      name: FieldColumnTypes.ASSET_CLASS,
      comparator: FieldComparator.EQUALS,
      value: assetClasses,
    });
  }

  return filters;
}

export function getFiltersForOrders(
  workflowName: WorkflowName,
  workflowTemplate: WorkflowTemplate,
  filters: Array<Field>,
  orderSide?: OrderSide,
  price?: Partial<Field>,
  quantity?: Partial<Field>,
  isPublicOrders?: boolean,
): Array<Field> {
  const orderFilters = [];

  if (orderSide) {
    orderFilters.push({
      name: FieldColumnTypes.ORDER_SIDE,
      comparator: FieldComparator.EQUALS,
      value: orderSide,
    });
  }

  // TODO: Temporary fix
  // we will need remove this if conditinoal once the postman collection and assets front is updated to support this.
  if (workflowName) {
    orderFilters.push({
      name: FieldColumnTypes.WORKFLOW_TEMPLATE_ID,
      comparator: FieldComparator.EQUALS,
      value: workflowTemplate[WorkflowTemplateKeys.ID],
    });
  }

  if (price) {
    const parsedPrice: Field = {
      name: FieldColumnTypes.PRICE,
      comparator: parseComparator(price.comparator),
      value: price.value,
    };
    orderFilters.push(validateField(parsedPrice));
  }

  if (quantity) {
    const parsedQuantity: Field = {
      name: FieldColumnTypes.QUANTITY,
      comparator: parseComparator(quantity.comparator),
      value: quantity.value,
    };
    orderFilters.push(validateField(parsedQuantity));
  }

  if (isPublicOrders) {
    // we expect workflow name to be defined if looking for public orders.
    if (isPublicOrders && workflowName !== WorkflowName.ASSET_SECONDARY_TRADE) {
      ErrorService.throwError('Cannot retrieve public primary orders');
    }

    return [
      ...filters.filter(
        (field) =>
          field.name !== FieldColumnTypes.USER_ID &&
          field.name !== FieldColumnTypes.RECIPIENT_ID,
      ),
      ...orderFilters,
      {
        name: FieldColumnTypes.USER_ID,
        comparator: FieldComparator.NULL,
        value: null,
      },
      {
        name: FieldColumnTypes.RECIPIENT_ID,
        comparator: FieldComparator.NULL,
        value: null,
      },
    ];
  } else {
    return [...filters, ...orderFilters];
  }
}

export function parseComparator(comparator: string): FieldComparator {
  switch (comparator) {
    case '=':
      return FieldComparator.EQUALS;
    case '>':
      return FieldComparator.GREATER_THAN;
    case '<':
      return FieldComparator.LESS_THAN;
    case '!':
      return FieldComparator.NULL;
    default:
      ErrorService.throwError(`Unknown field comparator ${comparator}`);
  }
}

export function validateField(field: Field): Field {
  const { error } = fieldSchema.validate(field);
  if (error) {
    ErrorService.throwError('Invalid field schema.');
  }

  try {
    // make sure it is is a string number if it uses greater than or less than
    if (
      [FieldComparator.GREATER_THAN, FieldComparator.LESS_THAN].includes(
        field.comparator,
      )
    ) {
      parseFloat(field.value as string);
    }
  } catch {
    ErrorService.throwError(
      `Invalid field schema with ${field.comparator} comparator, value should be a number`,
    );
  }

  return field;
}
