# Casana API (NestJS) para Cloud Run. Contexto de build = RAÍZ del monorepo:
#   docker build -f apps/api/Dockerfile -t casana-api .
# ---------- build ----------
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm ci
RUN npx prisma generate --schema apps/api/prisma/schema.prisma
RUN npm run build --workspace @casana/api

# ---------- runtime ----------
FROM node:22-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=8080

# node_modules incluye @prisma/client, engines y la CLI de prisma (para migrate).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
# Las libs @casana/* se consumen por import() dinámico en runtime.
COPY --from=build /app/libs ./libs
COPY --from=build /app/apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
RUN chmod +x apps/api/docker-entrypoint.sh

EXPOSE 8080
CMD ["./apps/api/docker-entrypoint.sh"]
