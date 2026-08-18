import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenVerifier, UsuarioAutenticado } from './token-verifier';

/**
 * Verificador de PRODUCCIÓN con Identity Platform (Firebase Auth).
 * Requiere `npm i firebase-admin`, `FIREBASE_PROJECT_ID` y credenciales ADC
 * (GOOGLE_APPLICATION_CREDENTIALS o la cuenta de servicio de Cloud Run).
 * firebase-admin se carga por import() dinámico para no acoplar el build.
 */
@Injectable()
export class FirebaseTokenVerifier extends TokenVerifier {
  private readonly logger = new Logger(FirebaseTokenVerifier.name);
  private app: unknown;

  constructor(private readonly config: ConfigService) {
    super();
  }

  private async admin(): Promise<any> {
    const pkg = 'firebase-admin';
    const mod: any = await import(pkg);
    if (!this.app) {
      this.app = mod.apps?.length
        ? mod.app()
        : mod.initializeApp({ projectId: this.config.getOrThrow<string>('FIREBASE_PROJECT_ID') });
      this.logger.log('firebase-admin inicializado');
    }
    return mod;
  }

  async verificar(token: string): Promise<UsuarioAutenticado> {
    try {
      const mod = await this.admin();
      const decoded = await mod.auth().verifyIdToken(token);
      return { uid: decoded.uid, email: decoded.email, nombre: decoded.name };
    } catch (err) {
      throw new UnauthorizedException(`Token inválido: ${(err as Error).message}`);
    }
  }
}
