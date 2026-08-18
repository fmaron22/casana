# Casana back office (Next.js standalone) para Cloud Run. Contexto = raíz del monorepo.
# API_URL se consume del lado servidor en runtime (no es NEXT_PUBLIC): se inyecta
# como variable de entorno en Cloud Run.
FROM node:22-slim AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build --workspace @casana/backoffice

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=build /app/apps/backoffice/.next/standalone ./
COPY --from=build /app/apps/backoffice/.next/static ./apps/backoffice/.next/static
EXPOSE 8080
CMD ["node", "apps/backoffice/server.js"]
