import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { LiveBackground } from "@/components/live-background";

// Terminal aesthetic - monospace everything
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "faktory - AI Treasury Agent",
  description: "Autonomous AI manages your invoices 24/7. Tokenize, optimize yield, settle via x402.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrains.variable}>
      <body className="font-mono antialiased bg-[#0a0a0a] text-[#e5e5e5] scan-pulse corner-glow">
        <LiveBackground />
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111111',
              border: '1px solid #1f1f1f',
              color: '#e5e5e5',
              fontFamily: 'var(--font-mono)',
            },
          }}
        />
        <KeyboardShortcutsProvider />
      </body>
    </html>
  );
}
