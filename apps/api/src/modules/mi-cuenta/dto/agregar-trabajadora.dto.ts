import { IsEnum, IsInt, IsOptional, IsString, Length, Min, MinLength } from 'class-validator';
import { ModalidadCotizacion } from '@prisma/client';

export class AgregarTrabajadoraDto {
  @IsString() @MinLength(2) nombre!: string;

  @IsOptional() @IsString() @Length(18, 18) curp?: string;
  @IsOptional() @IsString() nss?: string;
  @IsOptional() @IsString() @Length(18, 18) clabe?: string;

  /** Salario diario en CENTAVOS. */
  @IsInt() @Min(1) salarioDiario!: number;

  @IsEnum(ModalidadCotizacion) modalidad!: ModalidadCotizacion;

  @IsOptional() @IsInt() @Min(1) diasSemana?: number;
  @IsOptional() @IsString() puesto?: string;
}
