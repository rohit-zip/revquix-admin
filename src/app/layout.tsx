import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Provider } from "@/core/provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://admin.revquix.com",
  ),

  title: {
    default: "Revquix Admin",
    template: "%s | Revquix Admin",
  },

  description:
    "Revquix Admin Panel — internal platform management for administrators and authorised staff.",

  // Admin panel must NEVER be indexed
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
    },
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        "font-mono",
        jetbrainsMono.variable,
      )}
    >
      <body>
        <NextTopLoader
          color="var(--primary)"
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px oklch(0.567 0.210 257.951), 0 0 5px oklch(0.567 0.210 257.951)"
          zIndex={99999}
        />
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
