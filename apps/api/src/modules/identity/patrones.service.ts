import { Injectable, NotFoundException } from '@nestjs/common';
import type { Patron } from '@prisma/client';
import { PrismaService } from '../../persistence/prisma.service';
import { CrearPatronDto } from './dto/crear-patron.dto';

@Injectable()
export class PatronesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Registra un patrón (paso 1 del onboarding). */
  async crear(dto: CrearPatronDto): Promise<Patron> {
    return this.prisma.patron.create({
      data: {
        email: dto.email,
        nombre: dto.nombre,
        telefono: dto.telefono ?? null,
        rfc: dto.rfc ?? null,
        curp: dto.curp ?? null,
      },
    });
  }

  async obtener(id: string): Promise<Patron> {
    const patron = await this.prisma.patron.findUnique({ where: { id } });
    if (!patron) throw new NotFoundException(`Patrón ${id} no encontrado`);
    return patron;
  }
}
