import ErrorService from 'src/utils/errorService';
import { TokenCategory } from 'src/types/smartContract';

export const convertCategoryToDeprecatedEnum = (
  tokenCategory: TokenCategory,
): string => {
  try {
    if (tokenCategory === TokenCategory.FUNGIBLE) {
      return 'fungibleBasics';
    } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
      return 'nonfungibleBasics';
    } else if (tokenCategory === TokenCategory.HYBRID) {
      return 'hybridBasics';
    } else {
      ErrorService.throwError('unknown token category');
    }
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'converting category to deprecated token category',
      'convertCategoryToDeprecatedEnum',
      false,
      500,
    );
  }
};
