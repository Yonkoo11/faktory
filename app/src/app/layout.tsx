import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";

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
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" />
        <KeyboardShortcutsProvider />
      </body>
    </html>
  );
}
