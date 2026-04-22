import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Treino App",
  description:
    "Painel pessoal de treinos para musculação complementar, fortalecimento para corrida e execução diária.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} bg-[var(--background)] font-[var(--font-body)] text-[var(--foreground)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
