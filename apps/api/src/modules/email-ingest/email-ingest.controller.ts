import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { EmailIngestService, ResultadoIngesta } from './email-ingest.service';
import { InboundEmailDto } from './dto/inbound-email.dto';

/**
 * Webhook de correo entrante (líneas de captura del IMSS, ADR-0005).
 * El proveedor de correo (SendGrid/Mailgun/Gmail) publica aquí; su formato se
 * adapta al DTO interno. TODO producción: autenticar el webhook (firma/secreto).
 */
@Controller('webhooks/email-ingest')
export class EmailIngestController {
  constructor(private readonly ingesta: EmailIngestService) {}

  @Post()
  @HttpCode(200)
  recibir(@Body() dto: InboundEmailDto): Promise<ResultadoIngesta> {
    return this.ingesta.procesar(dto);
  }
}
