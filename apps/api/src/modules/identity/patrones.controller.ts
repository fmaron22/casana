import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PatronesService } from './patrones.service';
import { CrearPatronDto } from './dto/crear-patron.dto';

@Controller('patrones')
export class PatronesController {
  constructor(private readonly patrones: PatronesService) {}

  @Post()
  crear(@Body() dto: CrearPatronDto) {
    return this.patrones.crear(dto);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.patrones.obtener(id);
  }
}
