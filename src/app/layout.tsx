import type { Metadata, Viewport } from "next";
import { Geist, Rajdhani, Teko } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Valorant Arena | Registro de Torneos",
    template: "%s | Valorant Arena",
  },
  description: "Plataforma premium para registrar equipos, gestionar rosters y competir en torneos de Valorant.",
  keywords: ["Valorant", "E-Sports", "Torneo", "Gaming", "Registro"],
  openGraph: {
    title: "Valorant Arena",
    description: "Inscripción competitiva para torneos de Valorant.",
    type: "website",
    images: ["/og/tournament-card.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Valorant Arena",
    description: "Inscripción competitiva para torneos de Valorant.",
    images: ["/og/tournament-card.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${rajdhani.variable} ${teko.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
