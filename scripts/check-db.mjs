// Verificación rápida del contenido de la BD de desarrollo.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const patrones = await prisma.patron.findMany({ include: { relaciones: true } });
const trabajadores = await prisma.trabajador.findMany();

console.log(`Patrones: ${patrones.length}`);
for (const p of patrones) {
  console.log(` - ${p.nombre} <${p.email}> · estado=${p.estadoOnboarding} · relaciones=${p.relaciones.length}`);
  for (const r of p.relaciones) {
    console.log(`     relación: salarioDiario=${r.salarioDiario}c · ${r.modalidad} · puesto=${r.puesto}`);
  }
}
console.log(`Trabajadores: ${trabajadores.length}`);
for (const t of trabajadores) {
  console.log(` - ${t.nombre} · CURP=${t.curp} · CLABE=${t.clabe ?? "—"}`);
}
await prisma.$disconnect();
