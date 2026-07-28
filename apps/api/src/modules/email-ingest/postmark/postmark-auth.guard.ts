import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

/**
 * Autentica el webhook entrante de Postmark con Basic Auth (método recomendado
 * por Postmark: la URL del webhook lleva user:pass). Si las credenciales no
 * están configuradas, permite el paso SOLO en desarrollo con una advertencia.
 */
@Injectable()
export class PostmarkAuthGuard implements CanActivate {
  private readonly logger = new Logger(PostmarkAuthGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const user = this.config.get<string>('POSTMARK_INBOUND_USER');
    const pass = this.config.get<string>('POSTMARK_INBOUND_PASSWORD');

    if (!user || !pass) {
      this.logger.warn('POSTMARK_INBOUND_USER/PASSWORD sin configurar; webhook SIN autenticar (solo dev)');
      return true;
    }

    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const recibido = Buffer.from(req.headers['authorization'] ?? '');
    const esperado = Buffer.from('Basic ' + Buffer.from(`${user}:${pass}`).toString('base64'));

    if (recibido.length !== esperado.length || !timingSafeEqual(recibido, esperado)) {
      throw new UnauthorizedException('Credenciales de webhook inválidas');
    }
    return true;
  }
}
