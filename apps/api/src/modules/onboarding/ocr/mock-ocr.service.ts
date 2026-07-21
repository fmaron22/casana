import { Injectable, Logger } from '@nestjs/common';
import { DatosINE, OcrService } from './ocr.service';

/** OCR de desarrollo: devuelve datos de ejemplo sin llamar a ningún servicio. */
@Injectable()
export class MockOcrService extends OcrService {
  private readonly logger = new Logger(MockOcrService.name);

  async extraerINE(imagenBase64: string): Promise<DatosINE> {
    this.logger.debug(`OCR mock sobre imagen de ${imagenBase64.length} chars`);
    return {
      nombre: 'MARIA GUADALUPE PEREZ LOPEZ',
      curp: 'PELM850312MDFRRR03',
      claveElector: 'PRLPMR85031209M400',
      domicilio: 'CALLE FALSA 123, COL. CENTRO, 06000, CDMX',
      vigencia: '2033',
    };
  }
}
