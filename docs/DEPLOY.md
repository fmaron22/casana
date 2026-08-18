# Deploy de Casana a GCP

Infraestructura como código (ADR-0007): **Cloud Run** (api + landing + web-patron + backoffice),
**Cloud SQL Postgres**, **Secret Manager**, **Artifact Registry**, CI con **GitHub Actions + WIF**.

> ⚠️ Estos artefactos **no se ejecutaron/verificaron** en el entorno de desarrollo (sin Docker ni
> acceso a GCP). Revisa con `terraform plan` antes del primer `apply` y ajustamos lo que salga.

## 0. Prerrequisitos
- `gcloud`, `terraform` (>= 1.6) y `docker` instalados.
- Proyecto de GCP con **billing** activo. Autentícate: `gcloud auth login` y
  `gcloud auth application-default login`.
- Dominio (p. ej. `casana.mx`) con acceso a su DNS.

## 1. Infraestructura con Terraform
```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # completa valores (gitignored)
terraform init
terraform plan
terraform apply
```
Esto crea Artifact Registry, Cloud SQL (privado), los secretos, las cuentas de servicio y los
4 servicios de Cloud Run (con una **imagen placeholder**; el CI sube las reales).

Anota los outputs: `terraform output` (api_url, web_urls, artifact_registry).

## 2. Workload Identity Federation (para el CI, sin llaves)
Crea el pool/proveedor de WIF y una cuenta de servicio de deploy con permisos
(`roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser`), y
autoriza al repo `fmaron22/casana`. Guía oficial:
<https://github.com/google-github-actions/auth#setting-up-workload-identity-federation>.

Configura en **GitHub → Settings → Variables** (Actions):
- `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `DEPLOY_SA`
- `NEXT_PUBLIC_API_URL` (= dominio del api), `NEXT_PUBLIC_APP_URL`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_FIREBASE_*`

## 3. Primer despliegue
Haz push a `main` (o corre el workflow manualmente). El pipeline
(`.github/workflows/deploy.yml`) construye y despliega las 4 imágenes. El API aplica las
**migraciones Prisma** al arrancar (`docker-entrypoint.sh`).

## 4. Secretos (si no los pusiste en tfvars)
```bash
echo -n "sk_live_xxx" | gcloud secrets versions add STRIPE_SECRET_KEY --data-file=-
# idem STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_CUOTA_MENSUAL, POSTMARK_INBOUND_PASSWORD
```

## 5. Dominios
Mapea cada servicio a su subdominio (Cloud Run → Manage custom domains, o `gcloud run domain-mappings`):
- `casana.mx` → casana-landing
- `app.casana.mx` → casana-web-patron
- `ops.casana.mx` → casana-backoffice
- `api.casana.mx` → casana-api

Agrega los registros DNS que te indique Cloud Run. Actualiza `cors_origins` (Terraform) y los
`NEXT_PUBLIC_*` (vars de GitHub) con los dominios finales y vuelve a desplegar.

## 6. Integraciones externas
- **Stripe:** webhook → `https://api.casana.mx/webhooks/stripe`; copia el signing secret a
  `STRIPE_WEBHOOK_SECRET`. Crea el Price de la cuota mensual → `STRIPE_PRICE_CUOTA_MENSUAL`.
- **Postmark:** verifica `casana.mx` (SPF/DKIM). MX de `inbox.casana.mx` → Postmark. Inbound webhook →
  `https://USER:PASS@api.casana.mx/webhooks/email-ingest/postmark` (pon `POSTMARK_INBOUND_USER/PASSWORD`).
- **Firebase (Identity Platform):** habilita Google y Apple; agrega `app.casana.mx` a dominios
  autorizados; pon `FIREBASE_PROJECT_ID` (API) y `NEXT_PUBLIC_FIREBASE_*` (web-patron). En el API,
  agrega `firebase-admin` a dependencias antes de desplegar con Firebase (`npm i -w @casana/api firebase-admin`).
- **Document AI (OCR):** crea un processor y pon `GCP_PROJECT/GCP_LOCATION/GCP_DOCUMENTAI_PROCESSOR`
  en el API (o deja el mock).

## Notas
- Cloud SQL queda **sin IP pública**; el API se conecta por socket `/cloudsql/<conn>`.
- `deletion_protection = true` en la BD: para destruir en pruebas, cámbialo primero.
- Escala a cero por defecto (min_instance_count = 0). Sube mínimos en producción para evitar cold starts.
