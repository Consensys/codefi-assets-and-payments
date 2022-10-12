import ErrorService from 'src/utils/errorService';

import {
  validEntityLinkStatusForUserType,
  UserType,
  validPlatformLinkStatusForUserType,
} from 'src/types/user';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { keys as LinkKeys } from 'src/types/workflow/workflowInstances';
import { EntityType } from 'src/types/entity';

/**
 * [Check link KYC validation granularity]
 */
export const checkLinkStateValidForUserType = (
  linkState: string,
  userType: UserType,
  entityType: EntityType,
): boolean => {
  try {
    if (entityType === EntityType.PLATFORM) {
      return (
        validPlatformLinkStatusForUserType[userType] &&
        validPlatformLinkStatusForUserType[userType].length > 0 &&
        validPlatformLinkStatusForUserType[userType].indexOf(linkState) >= 0
      );
    } else {
      return (
        validEntityLinkStatusForUserType[userType] &&
        validEntityLinkStatusForUserType[userType].length > 0 &&
        validEntityLinkStatusForUserType[userType].indexOf(linkState) >= 0
      );
    }
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'checking link status validity for userType',
      'checkLinkStateValidForUserType',
      false,
      500,
    );
  }
};

/**
 * [Check if link is linked to correct asset class]
 */
export const checkIfLinkedToAssetClassOrToken = (
  userEntityLink: Link,
  assetClassKey: string,
): boolean => {
  try {
    if (
      assetClassKey &&
      userEntityLink[LinkKeys.ASSET_CLASS] &&
      userEntityLink[LinkKeys.ASSET_CLASS] !== assetClassKey
    ) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'checking if linked to asset class or token',
      'checkIfLinkedToAssetClassOrToken',
      false,
      500,
    );
  }
};

/**
 * [Check if link is linked to asset class (and not to token)]
 */
export const checkIfLinkedToAssetClassOnly = (
  userEntityLink: Link,
  assetClassKey: string,
): boolean => {
  try {
    if (assetClassKey) {
      return userEntityLink[LinkKeys.ASSET_CLASS] === assetClassKey;
    } else {
      return !userEntityLink[LinkKeys.ASSET_CLASS];
    }
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'checking if linked to asset class only',
      'checkIfLinkedToAssetClassOnly',
      false,
      500,
    );
  }
};
