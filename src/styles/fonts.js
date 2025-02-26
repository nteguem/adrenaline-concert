import { Inter, Orbitron } from 'next/font/google';

// Utiliser Orbitron pour remplacer Evangelion (police similaire futuriste)
export const evangelion = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-evangelion'
});

// Utiliser Inter pour remplacer DIN (police moderne sans-serif)
export const din = Inter({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-din'
});