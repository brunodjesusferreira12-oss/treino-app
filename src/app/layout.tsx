import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

import { AppRuntimeBridge } from "@/components/runtime/app-runtime-bridge";
import { APP_NAME } from "@/lib/constants";
import { getThemeBootstrapScript } from "@/lib/theme";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "Plataforma privada para musculação, pilates e crossfit com execução diária, vídeos, gamificação e batalhas entre competidores.",
  manifest: "/manifest.webmanifest",
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  icons: {
    icon: "/fortynex-logo.png",
    apple: "/fortynex-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeBootstrapScript(),
          }}
        />
      </head>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} bg-[var(--background)] font-[var(--font-body)] text-[var(--foreground)] antialiased`}
      >
        <AppRuntimeBridge />
        {children}
      </body>
    </html>
  );
}
