import { Archivo_Black, Space_Grotesk, Inter, JetBrains_Mono, Cairo } from "next/font/google";

// Self-hosted by Next.js at build time — no runtime request to Google Fonts,
// which keeps this off the critical rendering path entirely.
export const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Archivo Black / Inter / JetBrains Mono are Latin-only, so Arabic falls
// back to this instead — Cairo covers both scripts and keeps the same
// geometric, high-contrast feel as the rest of the type system.
export const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const fontVariables = `${archivoBlack.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${cairo.variable}`;
