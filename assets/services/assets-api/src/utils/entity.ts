import { EntityType } from 'src/types/entity';
import { keys as ProjectKeys, Project } from 'src/types/project';
import { keys as TokenKeys, Token } from 'src/types/token';
import { keys as UserKeys, User } from 'src/types/user';
import ErrorService from 'src/utils/errorService';

/**
 * [Retrieve entityId]
 */
export const retrieveEntityId = (
  entityType: EntityType,
  project: Project,
  issuer: User,
  token: Token,
): string => {
  try {
    let entityId: string;
    if (entityType === EntityType.PROJECT) {
      entityId = project[ProjectKeys.PROJECT_ID];
    } else if (entityType === EntityType.ISSUER) {
      entityId = issuer[UserKeys.USER_ID];
    } else if (entityType === EntityType.TOKEN) {
      entityId = token[TokenKeys.TOKEN_ID];
    } else if (entityType === EntityType.PLATFORM) {
      // entityId = undefined;
    } else {
      ErrorService.throwError(`invalid entity type (${entityType})`);
    }

    return entityId;
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'retrieving entity ID',
      'retrieveEntityId',
      false,
      500,
    );
  }
};
