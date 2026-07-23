import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';

/**
 * Endpoints de solo lectura para la consola de operación (back office).
 * ⚠️ TODO producción: proteger con auth (Identity Platform) + RBAC de ops.
 */
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  /** Contadores para el tablero. */
  @Get('resumen')
  async resumen() {
    const [patrones, trabajadores, relaciones, lineas] = await Promise.all([
      this.prisma.patron.count(),
      this.prisma.trabajador.count(),
      this.prisma.relacionLaboral.count({ where: { activa: true } }),
      this.prisma.lineaCaptura.count(),
    ]);
    return { patrones, trabajadores, relaciones, lineasCaptura: lineas };
  }

  /** Patrones con sus relaciones y trabajadoras (vista principal de ops). */
  @Get('patrones')
  async patrones() {
    return this.prisma.patron.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        relaciones: {
          include: { trabajador: { select: { id: true, nombre: true, curp: true, nss: true, clabe: true } } },
        },
      },
    });
  }

  /** Líneas de captura recibidas (ingesta de correo) con su estado. */
  @Get('lineas-captura')
  async lineasCaptura() {
    return this.prisma.lineaCaptura.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
