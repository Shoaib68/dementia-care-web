import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ReactQueryProvider } from "@/shared/components/providers/ReactQueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Better font loading performance
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Better font loading performance
  preload: false, // Only preload primary font
});

export const metadata: Metadata = {
  title: {
    default: "Dementia Care System",
    template: "%s | Dementia Care System",
  },
  description: "Secure portal for healthcare professionals managing dementia care",
  keywords: ["dementia care", "healthcare", "patient management", "medical portal"],
  authors: [{ name: "Dementia Care Team" }],
  creator: "Dementia Care System",
  publisher: "Dementia Care System",
  robots: {
    index: false, // Don't index in production for security
    follow: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32", type: "image/x-icon" },
      { url: "/favicon.jpg", sizes: "32x32", type: "image/jpeg" },
    ],
    apple: "/images/logo/dementialogo.jpg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom for better performance on mobile
  themeColor: "#3b82f6",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload logo from API route */}
        <link rel="preload" href="/api/logo" as="image" type="image/jpeg" />
        <link rel="dns-prefetch" href="//dementia-care-web.vercel.app" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Prevent initial logo flicker */
            .logo-container {
              min-height: 64px;
              min-width: 64px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo-loading {
              background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6);
              background-size: 200% 100%;
              animation: shimmer 2s infinite;
            }
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
