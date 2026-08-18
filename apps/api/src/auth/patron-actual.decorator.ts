import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Patron } from '@prisma/client';
import { RequestConPatron } from './auth.guard';

/** Inyecta el patrón autenticado (resuelto por AuthGuard). */
export const PatronActual = createParamDecorator((_data: unknown, ctx: ExecutionContext): Patron => {
  const req = ctx.switchToHttp().getRequest<RequestConPatron>();
  if (!req.patron) throw new Error('PatronActual usado sin AuthGuard');
  return req.patron;
});
