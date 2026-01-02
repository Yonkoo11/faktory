import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals-light-stripe.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Faktory Protocol - Turn Unpaid Invoices Into Yield",
  description: "Tokenize business invoices as NFTs and generate yield through DeFi lending on Mantle Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" />
        <KeyboardShortcutsProvider />
      </body>
    </html>
  );
}
