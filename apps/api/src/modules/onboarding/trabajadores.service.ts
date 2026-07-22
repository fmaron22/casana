import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Trabajador } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../persistence/prisma.service';
import { CrearTrabajadorDto } from './dto/crear-trabajador.dto';

@Injectable()
export class TrabajadoresService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearTrabajadorDto): Promise<Trabajador> {
    try {
      return await this.prisma.trabajador.create({
        data: {
          nombre: dto.nombre,
          curp: dto.curp ?? null,
          nss: dto.nss ?? null,
          clabe: dto.clabe ?? null,
          fotoUrl: dto.fotoUrl ?? null,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Ya existe una persona registrada con esa CURP');
      }
      throw err;
    }
  }

  async obtener(id: string): Promise<Trabajador> {
    const t = await this.prisma.trabajador.findUnique({ where: { id } });
    if (!t) throw new NotFoundException(`Trabajador ${id} no encontrado`);
    return t;
  }
}
