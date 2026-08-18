import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { TokenVerifier, UsuarioAutenticado } from './token-verifier';

/**
 * Verificador de DESARROLLO. El "token" es un JSON {uid,email,nombre} en
 * base64url. NO usar en producción: se activa solo cuando no hay Firebase.
 */
@Injectable()
export class DevTokenVerifier extends TokenVerifier {
  private readonly logger = new Logger(DevTokenVerifier.name);

  constructor() {
    super();
    this.logger.warn('AUTH en modo DEV (tokens sin firmar) — no usar en producción');
  }

  async verificar(token: string): Promise<UsuarioAutenticado> {
    try {
      const json = Buffer.from(token, 'base64url').toString('utf8');
      const data = JSON.parse(json) as Partial<UsuarioAutenticado>;
      if (!data.uid || !data.email) throw new Error('faltan uid/email');
      return { uid: data.uid, email: data.email, nombre: data.nombre };
    } catch (err) {
      throw new UnauthorizedException(`Token dev inválido: ${(err as Error).message}`);
    }
  }
}
