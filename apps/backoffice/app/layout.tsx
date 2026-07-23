import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

const brand = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-brand',
});

export const metadata: Metadata = {
  title: 'Casana · Back office',
  description: 'Consola de operación de Casana.',
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
