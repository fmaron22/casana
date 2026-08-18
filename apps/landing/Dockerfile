# Casana landing (Next.js standalone) para Cloud Run. Contexto = raíz del monorepo:
#   docker build -f apps/landing/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.casana.mx \
#     --build-arg NEXT_PUBLIC_APP_URL=https://app.casana.mx -t casana-landing .
FROM node:22-slim AS build
WORKDIR /app
COPY . .
RUN npm ci
# NEXT_PUBLIC_* se hornean en build.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build --workspace @casana/landing

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=build /app/apps/landing/.next/standalone ./
COPY --from=build /app/apps/landing/.next/static ./apps/landing/.next/static
EXPOSE 8080
CMD ["node", "apps/landing/server.js"]
