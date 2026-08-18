variable "project_id" {
  type        = string
  description = "ID del proyecto de GCP."
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "Región de Cloud Run / Cloud SQL / Artifact Registry."
}

variable "db_tier" {
  type        = string
  default     = "db-f1-micro"
  description = "Tier de Cloud SQL (subir en producción, p.ej. db-custom-1-3840)."
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Password del usuario de Postgres (no commitear; usar tfvars local o -var)."
}

# Secretos de aplicación (Secret Manager). No commitear valores reales.
variable "stripe_secret_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "stripe_price_cuota_mensual" {
  type    = string
  default = ""
}

variable "postmark_inbound_user" {
  type    = string
  default = "casana"
}

variable "postmark_inbound_password" {
  type      = string
  sensitive = true
  default   = ""
}

variable "firebase_project_id" {
  type    = string
  default = ""
}

variable "cors_origins" {
  type        = string
  default     = "https://casana.mx,https://app.casana.mx,https://ops.casana.mx"
  description = "Orígenes permitidos por el API (CSV)."
}
