import type { Metadata } from "next";
import { stencil, ticket, body as bodyFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redline — read what you're actually signing",
  description:
    "Redline reads your lease and shows exactly which sentences to worry about, with the source text cited and a next step for each one.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${stencil.variable} ${ticket.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
