import { keys as TokenKeys, Token } from 'src/types/token';
import ErrorService from 'src/utils/errorService';
import { TokenCategory } from 'src/types/smartContract';

/**
 * [Check whether or not token belongs to expected category]
 */
export const checkTokenBelongsToExpectedCategory = (
  token: Token,
  expectedTokenCategory: TokenCategory,
): boolean => {
  try {
    let tokenCategory: TokenCategory;
    if (token[TokenKeys.STANDARD].includes('ERC1400')) {
      tokenCategory = TokenCategory.HYBRID;
    } else if (token[TokenKeys.STANDARD].includes('ERC721')) {
      tokenCategory = TokenCategory.NONFUNGIBLE;
    } else if (token[TokenKeys.STANDARD].includes('ERC20')) {
      tokenCategory = TokenCategory.FUNGIBLE;
    } else {
      ErrorService.throwError(
        `token with ID ${
          token[TokenKeys.TOKEN_ID]
        } was found but has an unknown category (${token[TokenKeys.STANDARD]})`,
      );
    }

    if (tokenCategory !== expectedTokenCategory) {
      throw new Error(
        `token with ID ${
          token[TokenKeys.TOKEN_ID]
        } was found, but is not a ${expectedTokenCategory.toLowerCase()} token (${tokenCategory.toLowerCase()} instead)`,
      );
    }

    return true;
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'checking if token category is valid',
      'checkTokenBelongsToExpectedCategory',
      false,
      500,
    );
  }
};
