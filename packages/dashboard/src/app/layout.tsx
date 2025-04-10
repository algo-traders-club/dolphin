import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

// Import all CSS files to ensure they're processed
import "./globals.css";
import "@/styles/typography.css";
import "@/styles/direct-styles.css";

// Enhanced Inter font configuration with variable weights for optical sizing
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600"],
  style: ["normal"],
  fallback: ["SF Pro Text", "SF Pro Display", "system-ui"],
});

// Enhanced JetBrains Mono configuration for better monospace rendering
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal"],
  fallback: ["SF Mono", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "Nexwave - Orca Liquidity Agent",
  description: "Modern dashboard for monitoring Orca Liquidity Agent on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No inline styles - allowing CSS variables from globals.css to work properly */}
      </head>
      <body className={`${inter.variable} ${jetBrainsMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
