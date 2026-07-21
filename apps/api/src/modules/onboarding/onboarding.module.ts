import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrabajadoresService } from './trabajadores.service';
import { RelacionesService } from './relaciones.service';
import { OnboardingController } from './onboarding.controller';
import { OcrService } from './ocr/ocr.service';
import { MockOcrService } from './ocr/mock-ocr.service';
import { DocumentAiOcrService } from './ocr/document-ai-ocr.service';

@Module({
  imports: [ConfigModule],
  controllers: [OnboardingController],
  providers: [
    TrabajadoresService,
    RelacionesService,
    // OCR: Document AI si hay processor configurado; si no, mock (dev).
    {
      provide: OcrService,
      inject: [ConfigService],
      useFactory: (config: ConfigService): OcrService =>
        config.get<string>('GCP_DOCUMENTAI_PROCESSOR')
          ? new DocumentAiOcrService(config)
          : new MockOcrService(),
    },
  ],
  exports: [TrabajadoresService, RelacionesService],
})
export class OnboardingModule {}
