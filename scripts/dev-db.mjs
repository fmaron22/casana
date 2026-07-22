// Postgres embebido para desarrollo (sin Docker ni instalación de sistema).
// Uso:  node scripts/dev-db.mjs   (deja el proceso corriendo; Ctrl+C detiene)
// Datos persistentes en .devdb/ (gitignored).
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const databaseDir = join(root, ".devdb", "data");

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "casana",
  password: "casana",
  port: 5432,
  persistent: true,
});

if (!existsSync(join(databaseDir, "PG_VERSION"))) {
  console.log("Inicializando cluster de Postgres embebido…");
  await pg.initialise();
}

await pg.start();

// Crea la BD si no existe.
try {
  await pg.createDatabase("casana");
  console.log('BD "casana" creada');
} catch {
  console.log('BD "casana" ya existía');
}

console.log("✅ Postgres embebido listo: postgresql://casana:casana@localhost:5432/casana");
console.log("   (Ctrl+C para detener)");

const stop = async () => {
  console.log("Deteniendo Postgres…");
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
