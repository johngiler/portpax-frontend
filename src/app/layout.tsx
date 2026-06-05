import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthLayout from "@/components/layout/AuthLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PortPax",
  description: "Plataforma de gestión de operaciones en puertos de cruceros",
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
            __html: `(function(){try{var s=localStorage.getItem('portpax-theme');var isDark=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',isDark);document.documentElement.classList.toggle('light',!isDark);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.className} ${geistSans.variable} overflow-x-hidden antialiased`}
      >
        <AuthProvider>
        <AuthLayout>{children}</AuthLayout>
      </AuthProvider>
      </body>
    </html>
  );
}
