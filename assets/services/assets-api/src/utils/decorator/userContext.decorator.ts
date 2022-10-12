import { extractTokenFromRequest } from '@codefi-assets-and-payments/auth';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { keys as UserContextKeys } from 'src/types/userContext';

export const UserContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const authToken: string = extractTokenFromRequest(request);

    return {
      [UserContextKeys.USER_ID]: request[UserContextKeys.USER_ID],
      [UserContextKeys.CALLER_ID]: request[UserContextKeys.CALLER_ID],
      [UserContextKeys.TENANT_ID]: request[UserContextKeys.TENANT_ID],
      [UserContextKeys.AUTH_ID]: request[UserContextKeys.AUTH_ID],
      [UserContextKeys.EMAIL]: request[UserContextKeys.EMAIL],
      [UserContextKeys.USER]: request[UserContextKeys.USER],
      [UserContextKeys.CALLER]: request[UserContextKeys.CALLER],
      [UserContextKeys.AUTH_TOKEN]: authToken,
    };
  },
);
