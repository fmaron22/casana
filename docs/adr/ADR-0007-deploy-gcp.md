# ADR-0007 · Deploy en GCP (Cloud Run + Cloud SQL)

- **Estado:** Aceptado
- **Fecha:** 2026-07-23
- **Relacionado:** [ADR-0001](./ADR-0001-stack-y-arquitectura.md)

## Contexto
Todo corre local. Hay que publicar API + 3 apps web en GCP, con base de datos gestionada,
secretos seguros y despliegue reproducible desde GitHub.

## Decisión
- **Cómputo:** **Cloud Run** (un servicio por app: `api`, `landing`, `web-patron`, `backoffice`).
  Serverless, escala a cero, HTTPS gestionado.
- **Base de datos:** **Cloud SQL for PostgreSQL**. El API se conecta por el **socket de Cloud SQL**
  (conector integrado de Cloud Run), sin exponer la BD a internet.
- **Imágenes:** **Artifact Registry**. API = imagen NestJS (multi-stage). Web = Next.js `standalone`.
- **Secretos:** **Secret Manager** (Stripe, Postmark, Firebase, `DATABASE_URL`); montados como env en
  Cloud Run. Nunca en el repo ni en la imagen.
- **IaC:** **Terraform** (`infra/`) para toda la infraestructura.
- **CI/CD:** **GitHub Actions** con **Workload Identity Federation** (sin llaves de servicio en
  GitHub): build → push a Artifact Registry → deploy a Cloud Run.
- **Migraciones:** `prisma migrate deploy` en el arranque del contenedor del API (idempotente).
- **NEXT_PUBLIC_*:** se inyectan como **build args** de cada imagen web (Next las hornea en build).

## Consecuencias
- Costo bajo en reposo (escala a cero); pago por uso.
- La BD queda privada (solo vía socket de Cloud Run).
- El primer despliegue requiere bootstrap manual (proyecto, APIs, WIF); luego todo por push.

## Pendiente (config del negocio)
Proyecto GCP + billing, dominio (mapear en Cloud Run), y las llaves reales de Stripe/Postmark/
Firebase en Secret Manager.
