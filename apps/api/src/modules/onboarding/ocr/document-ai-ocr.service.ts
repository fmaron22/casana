import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatosINE, OcrService } from './ocr.service';

/**
 * OCR con Google Cloud Document AI. Extrae entidades de la INE.
 *
 * Requiere:
 *   - dependencia `@google-cloud/documentai` (se carga por import() dinámico
 *     para no acoplar el build cuando no está en uso),
 *   - credenciales GCP (ADC) y un Processor configurado:
 *       GCP_PROJECT, GCP_LOCATION (p.ej. "us"), GCP_DOCUMENTAI_PROCESSOR.
 */
@Injectable()
export class DocumentAiOcrService extends OcrService {
  private readonly logger = new Logger(DocumentAiOcrService.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async extraerINE(imagenBase64: string): Promise<DatosINE> {
    // Specifier en variable → el compilador no resuelve el módulo en build.
    const pkg = '@google-cloud/documentai';
    const mod: any = await import(pkg);
    const client = new mod.DocumentProcessorServiceClient();

    const name = [
      'projects',
      this.config.getOrThrow<string>('GCP_PROJECT'),
      'locations',
      this.config.getOrThrow<string>('GCP_LOCATION'),
      'processors',
      this.config.getOrThrow<string>('GCP_DOCUMENTAI_PROCESSOR'),
    ].join('/');

    const [result] = await client.processDocument({
      name,
      rawDocument: { content: imagenBase64, mimeType: 'image/jpeg' },
    });

    const entidades: Record<string, string> = {};
    for (const e of result.document?.entities ?? []) {
      if (e.type) entidades[e.type] = e.mentionText ?? '';
    }

    return {
      nombre: entidades['nombre'] ?? entidades['name'],
      curp: entidades['curp'],
      claveElector: entidades['clave_elector'],
      domicilio: entidades['domicilio'] ?? entidades['address'],
      vigencia: entidades['vigencia'],
    };
  }
}
