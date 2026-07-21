import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class CotizarDto {
  /** Salario diario en CENTAVOS. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  salarioDiario!: number;

  @IsOptional()
  @IsIn(['mesCompleto', 'porDia'])
  modalidad?: 'mesCompleto' | 'porDia';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  diasLaborados?: number;
}
