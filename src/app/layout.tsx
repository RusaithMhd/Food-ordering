import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { BranchProvider } from "@/features/branch/BranchContext";
import { CartProvider } from "@/features/cart/CartContext";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { Navbar } from "@/components/navigation/Navbar";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Footer } from "@/components/navigation/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atheef Hotel - Fast Campus Food Delivery",
  description: "Fresh and hot food delivered right to your hostel room. Order from Atheef Hotel now!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-20 md:pb-0">
        <AuthProvider>
          <Suspense fallback={<div>Loading context...</div>}>
            <BranchProvider>
              <CartProvider>
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
                <MobileNav />
                <CartDrawer />
              </CartProvider>
            </BranchProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
