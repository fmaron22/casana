import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TrabajadoresService } from './trabajadores.service';
import { RelacionesService } from './relaciones.service';
import { OcrService, DatosINE } from './ocr/ocr.service';
import { CrearTrabajadorDto } from './dto/crear-trabajador.dto';
import { CrearRelacionDto } from './dto/crear-relacion.dto';
import { OcrIneDto } from './dto/ocr-ine.dto';

@Controller()
export class OnboardingController {
  constructor(
    private readonly trabajadores: TrabajadoresService,
    private readonly relaciones: RelacionesService,
    private readonly ocr: OcrService,
  ) {}

  /** Extrae datos de una INE para prellenar el onboarding. */
  @Post('onboarding/ocr-ine')
  extraerINE(@Body() dto: OcrIneDto): Promise<DatosINE> {
    return this.ocr.extraerINE(dto.imagenBase64);
  }

  @Post('trabajadores')
  crearTrabajador(@Body() dto: CrearTrabajadorDto) {
    return this.trabajadores.crear(dto);
  }

  @Get('trabajadores/:id')
  obtenerTrabajador(@Param('id') id: string) {
    return this.trabajadores.obtener(id);
  }

  @Post('relaciones')
  crearRelacion(@Body() dto: CrearRelacionDto) {
    return this.relaciones.crear(dto);
  }
}
