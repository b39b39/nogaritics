import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: { default: "Nogaritics", template: "%s | Nogaritics" },
  description: "Music rating and discovery platform",
  metadataBase: new URL("https://www.ngritics.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <SessionProvider>
          <Header />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
