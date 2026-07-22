import { BadRequestException, Injectable } from '@nestjs/common';
import type { RelacionLaboral } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../persistence/prisma.service';
import { CrearRelacionDto } from './dto/crear-relacion.dto';

@Injectable()
export class RelacionesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea la relación laboral patrón↔trabajador (lugar, salario, modalidad…).
   * Es el dato que alimenta a imss-calc (cálculo de cuotas) y a billing.
   */
  async crear(dto: CrearRelacionDto): Promise<RelacionLaboral> {
    try {
      return await this.prisma.relacionLaboral.create({
        data: {
          patronId: dto.patronId,
          trabajadorId: dto.trabajadorId,
          salarioDiario: dto.salarioDiario,
          modalidad: dto.modalidad,
          lugarTrabajo: dto.lugarTrabajo ?? null,
          puesto: dto.puesto ?? null,
          diasSemana: dto.diasSemana ?? null,
          jornadaHoras: dto.jornadaHoras ?? null,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new BadRequestException('El patrón o la trabajadora no existen');
      }
      throw err;
    }
  }
}
