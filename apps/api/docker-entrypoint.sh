#!/bin/sh
# Aplica migraciones pendientes (idempotente) y arranca el API.
set -e
echo "Aplicando migraciones Prisma…"
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
echo "Iniciando Casana API…"
exec node apps/api/dist/main.js
