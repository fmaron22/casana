import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Patron } from '@prisma/client';
import { PrismaService } from '../persistence/prisma.service';
import { TokenVerifier } from './token-verifier';

export interface RequestConPatron {
  headers: Record<string, string | undefined>;
  patron?: Patron;
}

/**
 * Verifica el Bearer token y resuelve el patrón autenticado:
 *   1) por firebaseUid, 2) por email (y lo vincula), 3) auto-provisiona.
 * Deja el patrón en `request.patron` (usar con @PatronActual()).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly verifier: TokenVerifier,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestConPatron>();
    const auth = req.headers['authorization'] ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) throw new UnauthorizedException('Falta el token de sesión');

    const usuario = await this.verifier.verificar(token);

    let patron = await this.prisma.patron.findUnique({ where: { firebaseUid: usuario.uid } });
    if (!patron) {
      const porEmail = await this.prisma.patron.findUnique({ where: { email: usuario.email } });
      patron = porEmail
        ? await this.prisma.patron.update({
            where: { id: porEmail.id },
            data: { firebaseUid: usuario.uid },
          })
        : await this.prisma.patron.create({
            data: { email: usuario.email, nombre: usuario.nombre ?? usuario.email, firebaseUid: usuario.uid },
          });
    }

    req.patron = patron;
    return true;
  }
}
