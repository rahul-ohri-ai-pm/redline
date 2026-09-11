import { Big_Shoulders_Stencil, Courier_Prime, Public_Sans } from "next/font/google";

export const stencil = Big_Shoulders_Stencil({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-stencil",
  display: "swap",
});

export const ticket = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ticket",
  display: "swap",
});

export const body = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});
