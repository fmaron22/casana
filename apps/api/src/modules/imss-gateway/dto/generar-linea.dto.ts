import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

class EmpleadorDto {
  @IsString() @Length(18, 18) curp!: string;
  @IsEmail() correo!: string;
  @IsString() nombre!: string;
}

class TrabajadorDto {
  @IsString() @Length(18, 18) curp!: string;
  @IsOptional() @IsString() nss?: string;
  @IsString() nombre!: string;
}

export class GenerarLineaDto {
  @ValidateNested() @Type(() => EmpleadorDto) empleador!: EmpleadorDto;
  @ValidateNested() @Type(() => TrabajadorDto) trabajador!: TrabajadorDto;

  /** Salario diario en CENTAVOS. */
  @IsInt() @Min(1) salarioDiarioCentavos!: number;

  @IsIn(['MES_COMPLETO', 'POR_DIA']) modalidad!: 'MES_COMPLETO' | 'POR_DIA';

  @IsOptional() @IsInt() @Min(1) diasLaborados?: number;

  @Matches(/^\d{4}-\d{2}$/, { message: 'periodo debe tener formato YYYY-MM' })
  periodo!: string;
}
