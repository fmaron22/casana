import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DispersionService } from './dispersion.service';
import { CobrarDispersionDto } from './dto/cobrar-dispersion.dto';

@Controller('relaciones/:id/dispersion')
export class DispersionController {
  constructor(private readonly dispersion: DispersionService) {}

  /** Vista previa (cuotas + cargo) de la relación laboral. */
  @Get()
  preview(@Param('id') id: string) {
    return this.dispersion.preview(id);
  }

  /** Cobra la dispersión del periodo a la tarjeta del patrón. */
  @Post('cobrar')
  cobrar(@Param('id') id: string, @Body() dto: CobrarDispersionDto) {
    return this.dispersion.cobrar(id, dto.paymentMethodId, dto.periodo);
  }
}
