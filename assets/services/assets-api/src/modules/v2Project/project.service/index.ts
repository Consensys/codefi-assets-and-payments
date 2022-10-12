import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { ENTITY_DESCRIPTION_MAX_LENGTH } from 'src/types/entity';

@Injectable()
export class ProjectHelperService {
  /**
   * [Retrieve project description if valid]
   */
  retrieveProjectDescriptionIfValid(description: string): string {
    try {
      if (description && description.length > ENTITY_DESCRIPTION_MAX_LENGTH) {
        ErrorService.throwError(
          `invalid project description: project description length(${description.length}) shall not exceed ${ENTITY_DESCRIPTION_MAX_LENGTH} characters`,
        );
      }
      return description;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving project description',
        'retrieveProjectDescriptionIfValid',
        false,
        500,
      );
    }
  }
}
