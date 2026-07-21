import { Controller, Get, Query } from '@nestjs/common';
import type { PreviewDispersion } from '@casana/cotizacion';
import { cotizacion } from './cotizacion.loader';
import { CotizarDto } from './dto/cotizar.dto';

/**
 * Cotizador sin estado (no toca BD): dado un salario diario, devuelve el
 * desglose de cuotas IMSS y el cargo total a la tarjeta (salario + obligaciones
 * + comisión). Lo consumen la landing y las apps antes de registrar.
 */
@Controller('cotizador')
export class CotizadorController {
  @Get()
  async cotizar(@Query() q: CotizarDto): Promise<PreviewDispersion> {
    const { construirPreviewDispersion } = await cotizacion();
    return construirPreviewDispersion({
      salarioDiarioCentavos: q.salarioDiario,
      modalidad: q.modalidad,
      diasLaborados: q.diasLaborados,
    });
  }
}
