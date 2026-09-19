import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import StoreProvider from "./StoreProvider";

export const metadata: Metadata = {
  title: "TBGS Admin Hub",
  description: "Premium Business Intelligence Dashboard",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-['Poppins',sans-serif]">
        <StoreProvider>
          {children}
          <Toaster position="top-center" />
        </StoreProvider>
      </body>
    </html>
  );
}