import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const Protected = (
  authentication: boolean,
  permissions: string[] = []
): CustomDecorator =>
  SetMetadata('protectionContext', {
    authentication,
    permissions,
  });
