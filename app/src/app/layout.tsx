import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals-faktory.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";

// Display font - geometric, distinctive headlines
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Body font - clean, professional
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Mono font - data and numbers
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Faktory Protocol - AI-Managed B2B Payments",
  description: "Tokenize business invoices as NFTs, earn yield while waiting, and enable x402-style on-chain payment settlement on Cronos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" />
        <KeyboardShortcutsProvider />
      </body>
    </html>
  );
}
