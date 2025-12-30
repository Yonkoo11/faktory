import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";

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
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
