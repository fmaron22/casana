import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { Patron } from '@prisma/client';
import { AuthGuard } from '../../auth/auth.guard';
import { PatronActual } from '../../auth/patron-actual.decorator';
import { MiCuentaService } from './mi-cuenta.service';
import { AgregarTrabajadoraDto } from './dto/agregar-trabajadora.dto';

/** Endpoints del patrón autenticado (ADR-0006). Todos requieren Bearer token. */
@Controller('mi')
@UseGuards(AuthGuard)
export class MiCuentaController {
  constructor(private readonly cuenta: MiCuentaService) {}

  @Get('perfil')
  perfil(@PatronActual() patron: Patron) {
    return {
      id: patron.id,
      nombre: patron.nombre,
      email: patron.email,
      estadoOnboarding: patron.estadoOnboarding,
      tieneTarjeta: Boolean(patron.stripeCustomerId),
    };
  }

  @Get('trabajadoras')
  trabajadoras(@PatronActual() patron: Patron) {
    return this.cuenta.trabajadoras(patron.id);
  }

  @Get('lineas-captura')
  lineasCaptura(@PatronActual() patron: Patron) {
    return this.cuenta.lineasCaptura(patron.id);
  }

  @Post('trabajadoras')
  agregar(@PatronActual() patron: Patron, @Body() dto: AgregarTrabajadoraDto) {
    return this.cuenta.agregarTrabajadora(patron, dto);
  }
}
