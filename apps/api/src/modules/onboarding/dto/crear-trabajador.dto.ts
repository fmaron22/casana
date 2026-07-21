import { IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CrearTrabajadorDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  @Length(18, 18)
  curp?: string;

  @IsOptional()
  @IsString()
  nss?: string;

  @IsOptional()
  @IsString()
  @Length(18, 18)
  clabe?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;
}
