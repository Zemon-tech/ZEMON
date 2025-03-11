import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { defaultMetadata } from "./metadata";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <Script id="schema-org" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Zemon",
              "description": "India's premier open-source technology platform, fostering innovation and collaboration across all domains of technology development.",
              "url": "https://zemon.dev",
              "logo": "https://zemon.dev/logo.png",
              "sameAs": [
                "https://twitter.com/zemon_dev",
                "https://github.com/zemon",
                "https://linkedin.com/company/zemon"
              ],
              "knowsAbout": [
                "Open Source Development",
                "Software Tools",
                "Developer Community",
                "Project Collaboration",
                "Tech Innovation"
              ]
            }
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16">
              {children}
            </main>
            <Toaster />
          </div>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
