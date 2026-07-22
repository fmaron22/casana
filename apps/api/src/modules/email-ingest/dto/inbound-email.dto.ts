import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

export class AdjuntoDto {
  @IsString() nombre!: string;
  /** Contenido del archivo en base64. */
  @IsString() @MinLength(1) contenidoBase64!: string;
}

/**
 * Formato interno de correo entrante. Los proveedores (SendGrid Inbound Parse,
 * Mailgun Routes, Gmail API) se mapean a este DTO con un adaptador delgado.
 */
export class InboundEmailDto {
  @IsString() destinatario!: string; // p.ej. imss+{patronId}@casana.mx
  @IsOptional() @IsString() remitente?: string;
  @IsOptional() @IsString() asunto?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjuntoDto)
  adjuntos!: AdjuntoDto[];
}
