import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CrearPatronDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  rfc?: string;

  @IsOptional()
  @IsString()
  curp?: string;
}
