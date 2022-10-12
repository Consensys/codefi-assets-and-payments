import { TopSection } from 'src/models/TopSection';
import { ElementModel } from 'src/modules/ElementModule/ElementModel';
import { ElementType } from 'src/utils/constants/enum';

// build array of distinct element keys
export const buildTopSectionsElementKeys = (
  topSections: TopSection[],
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

export const checkValidValue = (
  values: string[],
  targetedElement: ElementModel,
) => {
  if (
    targetedElement.type === ElementType.CHECK ||
    targetedElement.type === ElementType.RADIO
  ) {
    for (const value of values) {
      if (
        parseInt(value, 10) < 0 ||
        parseInt(value, 10) >= targetedElement.inputs.length
      ) {
        return false;
      }
    }

    if (targetedElement.type === ElementType.RADIO && values.length !== 1) {
      return false;
    }
  }
  return true;
};
