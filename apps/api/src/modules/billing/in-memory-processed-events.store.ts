import { Injectable } from '@nestjs/common';
import { ProcessedEventsStore } from './billing.webhook.controller';

/**
 * Implementación EN MEMORIA para desarrollo. En producción se reemplaza por una
 * versión con Postgres (INSERT ... ON CONFLICT DO NOTHING sobre stripe_event_id)
 * cuando el módulo `persistence` esté listo.
 */
@Injectable()
export class InMemoryProcessedEventsStore extends ProcessedEventsStore {
  private readonly vistos = new Set<string>();

  async marcarSiNuevo(eventId: string): Promise<boolean> {
    if (this.vistos.has(eventId)) return false;
    this.vistos.add(eventId);
    return true;
  }
}
