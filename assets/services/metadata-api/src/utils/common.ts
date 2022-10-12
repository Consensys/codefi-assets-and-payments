import { AssetTemplateTopSection } from 'src/model/dto/AssetTemplatesDto';
import { ApiBody } from '@nestjs/swagger';
import isNil from 'lodash/isNil';
import isEqual from 'lodash/isEqual';

export const prettify = (obj) => JSON.stringify(obj, null, 2);

export const removeEmpty = (obj) => {
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
  return obj;
};

export const removeEmptyAndNull = (obj) => {
  Object.keys(obj).forEach((key) => isNil(obj[key]) && delete obj[key]);
  return obj;
};

/**
 * [This methods compares 2 database entries - generic fields are discarded in the process]
 */
export const areDatabaseObjectsEqual = (obj1, obj2) => {
  const localObj1 = removeEmptyAndNull({ ...obj1 });
  const localObj2 = removeEmptyAndNull({ ...obj2 });

  delete localObj1.id;
  delete localObj1.createdAt;
  delete localObj1.updatedAt;

  delete localObj2.id;
  delete localObj2.createdAt;
  delete localObj2.updatedAt;

  return isEqual(localObj1, localObj2);
};

export const buildTopSectionsItemKeys = (
  topSections: AssetTemplateTopSection[],
): string[] => [
  ...new Set(
    topSections.reduce(
      (acc, { sections }) => [
        ...acc,
        ...sections.reduce(
          (itemAcc, { elements }) => [...itemAcc, ...elements],
          [],
        ),
      ],
      [],
    ),
  ),
];

export const ApiFile =
  (fileName = 'file'): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fileName]: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    })(target, propertyKey, descriptor);
  };

export const areArraysOfSameLength = (a, b, c) => {
  return a?.length === b?.length && a?.length === c?.length;
};
