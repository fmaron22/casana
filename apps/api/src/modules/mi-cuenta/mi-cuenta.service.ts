import { Injectable } from '@nestjs/common';
import type { LineaCaptura, Patron } from '@prisma/client';
import type { construirPreviewDispersion as CPD, PreviewDispersion } from '@casana/cotizacion';
import { PrismaService } from '../../persistence/prisma.service';
import { AgregarTrabajadoraDto } from './dto/agregar-trabajadora.dto';

export interface TrabajadoraConCuota {
  relacionId: string;
  trabajador: { id: string; nombre: string; curp: string | null; nss: string | null; clabe: string | null };
  puesto: string | null;
  salarioDiario: number;
  modalidad: string;
  preview: PreviewDispersion | null;
}

@Injectable()
export class MiCuentaService {
  constructor(private readonly prisma: PrismaService) {}

  async trabajadoras(patronId: string): Promise<TrabajadoraConCuota[]> {
    const relaciones = await this.prisma.relacionLaboral.findMany({
      where: { patronId, activa: true },
      include: { trabajador: true },
      orderBy: { createdAt: 'desc' },
    });

    const { construirPreviewDispersion } = (await import('@casana/cotizacion')) as {
      construirPreviewDispersion: typeof CPD;
    };

    return relaciones.map((r) => {
      let preview: PreviewDispersion | null = null;
      try {
        preview = construirPreviewDispersion({
          salarioDiarioCentavos: r.salarioDiario,
          modalidad: r.modalidad === 'POR_DIA' ? 'porDia' : 'mesCompleto',
          diasLaborados: r.modalidad === 'POR_DIA' && r.diasSemana ? Math.round(r.diasSemana * 4.33) : undefined,
        });
      } catch {
        preview = null;
      }
      return {
        relacionId: r.id,
        trabajador: {
          id: r.trabajador.id,
          nombre: r.trabajador.nombre,
          curp: r.trabajador.curp,
          nss: r.trabajador.nss,
          clabe: r.trabajador.clabe,
        },
        puesto: r.puesto,
        salarioDiario: r.salarioDiario,
        modalidad: r.modalidad,
        preview,
      };
    });
  }

  lineasCaptura(patronId: string): Promise<LineaCaptura[]> {
    return this.prisma.lineaCaptura.findMany({
      where: { patronId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Alta de trabajadora + su relación laboral, en una transacción. */
  async agregarTrabajadora(patron: Patron, dto: AgregarTrabajadoraDto) {
    return this.prisma.$transaction(async (tx) => {
      const trabajador = await tx.trabajador.create({
        data: {
          nombre: dto.nombre,
          curp: dto.curp ?? null,
          nss: dto.nss ?? null,
          clabe: dto.clabe ?? null,
        },
      });
      const relacion = await tx.relacionLaboral.create({
        data: {
          patronId: patron.id,
          trabajadorId: trabajador.id,
          salarioDiario: dto.salarioDiario,
          modalidad: dto.modalidad,
          diasSemana: dto.modalidad === 'POR_DIA' ? (dto.diasSemana ?? null) : null,
          puesto: dto.puesto ?? null,
        },
      });
      return { trabajador, relacion };
    });
  }
}
