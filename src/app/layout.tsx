import { ReactNode } from 'react';
import { evangelion, din } from '@/styles/fonts';
import '@/styles/globals.css';

export const metadata = {
  title: 'Adrénaline Concert',
  description: 'Vivez l\'expérience Adrénaline Max',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr" className={`${din.variable} ${evangelion.variable}`}>
      <body className="bg-black text-white">
        {children}
      </body>
    </html>
  );
}

