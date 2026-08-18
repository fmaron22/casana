output "api_url" {
  value       = google_cloud_run_v2_service.api.uri
  description = "URL pública del API."
}

output "web_urls" {
  value       = { for k, s in google_cloud_run_v2_service.web : k => s.uri }
  description = "URLs públicas de landing, web-patron y backoffice."
}

output "artifact_registry" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.casana.repository_id}"
  description = "Ruta base de Artifact Registry para las imágenes."
}

output "sql_connection_name" {
  value       = google_sql_database_instance.pg.connection_name
  description = "Connection name de Cloud SQL (para el socket)."
}
