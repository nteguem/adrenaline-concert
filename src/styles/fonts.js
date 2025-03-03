import { Orbitron } from "next/font/google";
import localFont from "next/font/local";

// Utiliser Orbitron pour remplacer Evangelion (police similaire futuriste)
export const evangelion = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-evangelion",
});

// Utiliser Inter pour remplacer DIN (police moderne sans-serif)
// export const din = Inter({
//   subsets: ["latin"],
//   weight: ["400", "700"],
//   variable: "--font-din",
// });

export const din = localFont({
  src: "../../fonts/DIN2.otf",
  weight: "400",
  variable: "--font-din",
});
