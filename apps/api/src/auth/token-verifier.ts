// Verificación de tokens de sesión. Adaptadores intercambiables (ADR-0006):
// firebase (producción) o dev (local, sin Firebase).

export interface UsuarioAutenticado {
  uid: string;
  email: string;
  nombre?: string;
}

export abstract class TokenVerifier {
  abstract verificar(token: string): Promise<UsuarioAutenticado>;
}
