import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthLayout from "@/components/layout/AuthLayout";
import DocumentTitle from "@/components/layout/DocumentTitle";
import LockAppZoom from "@/components/pwa/LockAppZoom";
import RegisterServiceWorker from "@/components/pwa/RegisterServiceWorker";
import SwrProvider from "@/lib/swr/SwrProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PortPax",
  description: "Plataforma de gestión de operaciones en puertos de cruceros",
  applicationName: "PortPax",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PortPax",
    // Content draws under the status bar so the header gradient fills the notch.
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  // Slightly deeper than pure wash so the system status bar does not read as white.
  themeColor: "#dce8f7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var mobile=window.matchMedia('(max-width: 767px)').matches;var s=localStorage.getItem('portpax-theme');var isDark=!mobile&&(s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches));document.documentElement.classList.toggle('dark',isDark);document.documentElement.classList.toggle('light',!isDark);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.className} ${geistSans.variable} overflow-x-hidden antialiased`}
      >
        <AuthProvider>
          <SwrProvider>
            <DocumentTitle />
            <LockAppZoom />
            <RegisterServiceWorker />
            <AuthLayout>{children}</AuthLayout>
          </SwrProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
