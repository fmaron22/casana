import { Body, Controller, Post } from '@nestjs/common';
import { ImssGateway, LineaDeCaptura } from './imss-gateway.service';
import { GenerarLineaDto } from './dto/generar-linea.dto';

@Controller('imss')
export class ImssGatewayController {
  constructor(private readonly gateway: ImssGateway) {}

  /**
   * Genera la línea de captura para una declaración PTH.
   * En dev usa el adaptador mock; con IMSS_RPA_ENABLED=true usa el RPA real.
   */
  @Post('linea-captura')
  generar(@Body() dto: GenerarLineaDto): Promise<LineaDeCaptura> {
    return this.gateway.generarLineaDeCaptura(dto);
  }
}
