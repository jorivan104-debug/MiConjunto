import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import { AvisosProvider } from '@/components/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mi Conjunto · Convivencia organizada',
  description: 'Administración de propiedad horizontal: cobros, pagos, comunicados, PQRS y reservas.',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <AvisosProvider>{children}</AvisosProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
