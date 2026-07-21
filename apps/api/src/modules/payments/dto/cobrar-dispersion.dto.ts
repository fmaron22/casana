import { IsString, Matches, MinLength } from 'class-validator';

export class CobrarDispersionDto {
  /** PaymentMethod tokenizado del patrón (Stripe). */
  @IsString()
  @MinLength(1)
  paymentMethodId!: string;

  /** Periodo a dispersar, formato YYYY-MM. */
  @Matches(/^\d{4}-\d{2}$/, { message: 'periodo debe tener formato YYYY-MM' })
  periodo!: string;
}
