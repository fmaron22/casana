import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Patron } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../persistence/prisma.service';
import { CrearPatronDto } from './dto/crear-patron.dto';

@Injectable()
export class PatronesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Registra un patrón (paso 1 del onboarding). */
  async crear(dto: CrearPatronDto): Promise<Patron> {
    try {
      return await this.prisma.patron.create({
        data: {
          email: dto.email,
          nombre: dto.nombre,
          telefono: dto.telefono ?? null,
          rfc: dto.rfc ?? null,
          curp: dto.curp ?? null,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Ya existe una cuenta con ese correo');
      }
      throw err;
    }
  }

  async obtener(id: string): Promise<Patron> {
    const patron = await this.prisma.patron.findUnique({ where: { id } });
    if (!patron) throw new NotFoundException(`Patrón ${id} no encontrado`);
    return patron;
  }
}
