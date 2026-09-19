import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar, SidebarProvider, Header } from "@/components/sidebar";
import Providers from "@/components/Providers";
import { AuthGuard } from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tbgs | Approval Management system",
  description: "Advanced management system for Tbgs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} font-body bg-background text-foreground min-h-screen selection:bg-primary/10 overflow-x-hidden`}>
        <Providers>
          <AuthGuard>
            <SidebarProvider>
              <div className="relative flex min-h-screen w-full">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 bg-background h-screen overflow-y-auto">
                  <Header />
                  <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
                    {children}
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}