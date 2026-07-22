import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

// Montserrat: sustituto web de Gotham (tipografía del manual de marca).
const brand = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-brand',
});

export const metadata: Metadata = {
  title: 'Casana · Protege a quien cuida tu hogar',
  description:
    'Da de alta ante el IMSS a tu persona trabajadora del hogar, paga sus cuotas y su salario en automático. Sin filas, sin efectivo, sin complicaciones.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={brand.variable}>
      <body style={{ fontFamily: 'var(--font-brand), Montserrat, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
