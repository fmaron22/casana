import { IsString, MinLength } from 'class-validator';

export class OcrIneDto {
  /** Imagen de la INE en base64 (sin el encabezado `data:`). */
  @IsString()
  @MinLength(1)
  imagenBase64!: string;
}
