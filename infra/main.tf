# =============================================================================
# Casana · Infraestructura en GCP (ADR-0007)
# Cloud Run (api + 3 web) · Cloud SQL Postgres · Secret Manager · Artifact Registry
# =============================================================================

locals {
  services = ["run", "sqladmin", "secretmanager", "artifactregistry", "iam", "compute"]
  # Imagen placeholder para la creación inicial; el CI actualiza la real.
  placeholder_image = "us-docker.pkg.dev/cloudrun/container/hello"
  database_url = join("", [
    "postgresql://casana:${var.db_password}@localhost/casana",
    "?host=/cloudsql/${google_sql_database_instance.pg.connection_name}",
    "&schema=public&sslmode=disable",
  ])
}

# ---- Habilitar APIs ----
resource "google_project_service" "apis" {
  for_each                   = toset(local.services)
  service                    = "${each.value}.googleapis.com"
  disable_dependent_services = false
  disable_on_destroy         = false
}

# ---- Artifact Registry (imágenes Docker) ----
resource "google_artifact_registry_repository" "casana" {
  location      = var.region
  repository_id = "casana"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

# ---- Cloud SQL (Postgres) ----
resource "google_sql_database_instance" "pg" {
  name             = "casana-pg"
  database_version = "POSTGRES_16"
  region           = var.region
  depends_on       = [google_project_service.apis]

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_autoresize   = true
    backup_configuration {
      enabled = true
    }
    ip_configuration {
      ipv4_enabled = false
      # Sin IP pública: solo acceso por socket de Cloud SQL desde Cloud Run.
    }
  }
  deletion_protection = true
}

resource "google_sql_database" "casana" {
  name     = "casana"
  instance = google_sql_database_instance.pg.name
}

resource "google_sql_user" "casana" {
  name     = "casana"
  instance = google_sql_database_instance.pg.name
  password = var.db_password
}

# ---- Secret Manager ----
locals {
  secretos = {
    DATABASE_URL               = local.database_url
    STRIPE_SECRET_KEY          = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET      = var.stripe_webhook_secret
    STRIPE_PRICE_CUOTA_MENSUAL = var.stripe_price_cuota_mensual
    POSTMARK_INBOUND_PASSWORD  = var.postmark_inbound_password
  }
}

resource "google_secret_manager_secret" "app" {
  for_each   = local.secretos
  secret_id  = each.key
  depends_on = [google_project_service.apis]
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "app" {
  for_each    = local.secretos
  secret      = google_secret_manager_secret.app[each.key].id
  secret_data = each.value
}

# ---- Cuenta de servicio del API ----
resource "google_service_account" "api" {
  account_id   = "casana-api"
  display_name = "Casana API (Cloud Run)"
}

resource "google_project_iam_member" "api_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.api.email}"
}

resource "google_secret_manager_secret_iam_member" "api_secrets" {
  for_each  = google_secret_manager_secret.app
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api.email}"
}

# ---- Cloud Run · API ----
resource "google_cloud_run_v2_service" "api" {
  name     = "casana-api"
  location = var.region
  template {
    service_account = google_service_account.api.email
    scaling {
      min_instance_count = 0
      max_instance_count = 4
    }
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.pg.connection_name]
      }
    }
    containers {
      image = local.placeholder_image
      ports {
        container_port = 8080
      }
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
      env {
        name  = "CORS_ORIGINS"
        value = var.cors_origins
      }
      dynamic "env" {
        for_each = local.secretos
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app[env.key].secret_id
              version = "latest"
            }
          }
        }
      }
      env {
        name  = "POSTMARK_INBOUND_USER"
        value = var.postmark_inbound_user
      }
      dynamic "env" {
        for_each = var.firebase_project_id == "" ? [] : [1]
        content {
          name  = "FIREBASE_PROJECT_ID"
          value = var.firebase_project_id
        }
      }
    }
  }
  depends_on = [google_project_service.apis]
  lifecycle {
    ignore_changes = [template[0].containers[0].image] # el CI actualiza la imagen
  }
}

# ---- Cloud Run · apps web (landing, web-patron, backoffice) ----
resource "google_cloud_run_v2_service" "web" {
  for_each = toset(["landing", "web-patron", "backoffice"])
  name     = "casana-${each.value}"
  location = var.region
  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
    containers {
      image = local.placeholder_image
      ports {
        container_port = 8080
      }
      # backoffice consume API_URL del lado servidor en runtime.
      dynamic "env" {
        for_each = each.value == "backoffice" ? [1] : []
        content {
          name  = "API_URL"
          value = google_cloud_run_v2_service.api.uri
        }
      }
    }
  }
  depends_on = [google_project_service.apis]
  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }
}

# ---- Acceso público (invoker) a todos los servicios ----
resource "google_cloud_run_v2_service_iam_member" "api_public" {
  name     = google_cloud_run_v2_service.api.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  for_each = google_cloud_run_v2_service.web
  name     = each.value.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
