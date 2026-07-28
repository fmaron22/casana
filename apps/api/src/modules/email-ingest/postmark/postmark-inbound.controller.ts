import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { EmailIngestService, ResultadoIngesta } from '../email-ingest.service';
import { InboundEmailDto } from '../dto/inbound-email.dto';
import { PostmarkAuthGuard } from './postmark-auth.guard';

/** Subconjunto del payload de Inbound Webhook de Postmark que usamos. */
interface PostmarkInbound {
  OriginalRecipient?: string;
  To?: string;
  ToFull?: Array<{ Email: string; Name?: string }>;
  From?: string;
  FromFull?: { Email: string; Name?: string };
  Subject?: string;
  Attachments?: Array<{ Name: string; Content: string; ContentType?: string; ContentLength?: number }>;
}

/**
 * Adaptador del webhook de correo entrante de Postmark (ADR-0005).
 * Mapea el payload de Postmark al `InboundEmailDto` interno y delega en
 * `EmailIngestService`. Autenticado con Basic Auth (PostmarkAuthGuard).
 *
 * Configurar en Postmark el Inbound Webhook a:
 *   https://USER:PASS@<host>/webhooks/email-ingest/postmark
 */
@Controller('webhooks/email-ingest/postmark')
@UseGuards(PostmarkAuthGuard)
export class PostmarkInboundController {
  constructor(private readonly ingesta: EmailIngestService) {}

  @Post()
  @HttpCode(200)
  recibir(@Body() payload: PostmarkInbound): Promise<ResultadoIngesta> {
    const dto: InboundEmailDto = {
      // OriginalRecipient conserva el alias exacto (imss+{patronId}@…) en catch-all.
      destinatario: payload.OriginalRecipient ?? payload.ToFull?.[0]?.Email ?? payload.To ?? '',
      remitente: payload.FromFull?.Email ?? payload.From,
      asunto: payload.Subject,
      adjuntos: (payload.Attachments ?? []).map((a) => ({
        nombre: a.Name,
        contenidoBase64: a.Content,
      })),
    };
    return this.ingesta.procesar(dto);
  }
}
