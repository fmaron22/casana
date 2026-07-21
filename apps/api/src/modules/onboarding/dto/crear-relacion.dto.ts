import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ModalidadCotizacion } from '@prisma/client';

export class CrearRelacionDto {
  @IsUUID()
  patronId!: string;

  @IsUUID()
  trabajadorId!: string;

  /** Salario diario en CENTAVOS. */
  @IsInt()
  @Min(1)
  salarioDiario!: number;

  @IsEnum(ModalidadCotizacion)
  modalidad!: ModalidadCotizacion;

  @IsOptional()
  @IsString()
  lugarTrabajo?: string;

  @IsOptional()
  @IsString()
  puesto?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  diasSemana?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  jornadaHoras?: number;
}
