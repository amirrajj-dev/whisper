import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../types/auth-request.type';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest<AuthRequest>().user;
  },
);
