import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenVerifier } from './token-verifier';
import { DevTokenVerifier } from './dev-token-verifier';
import { FirebaseTokenVerifier } from './firebase-token-verifier';
import { AuthGuard } from './auth.guard';

// Global: AuthGuard y TokenVerifier disponibles para cualquier módulo.
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: TokenVerifier,
      inject: [ConfigService],
      useFactory: (config: ConfigService): TokenVerifier =>
        config.get<string>('FIREBASE_PROJECT_ID')
          ? new FirebaseTokenVerifier(config)
          : new DevTokenVerifier(),
    },
    AuthGuard,
  ],
  exports: [TokenVerifier, AuthGuard],
})
export class AuthModule {}
