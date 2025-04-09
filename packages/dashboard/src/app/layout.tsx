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
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            font-size: 18px;
            line-height: 1.5;
            color: #1a202c;
            background-color: #f7f9fc;
            margin: 0;
            padding: 0;
          }
          
          h1 {
            font-size: 42px;
            font-weight: 300;
            margin-bottom: 18px;
          }
          
          h2 {
            font-size: 34px;
            font-weight: 300;
            margin-bottom: 18px;
          }
          
          h3 {
            font-size: 26px;
            font-weight: 500;
            margin-bottom: 18px;
          }
          
          h4 {
            font-size: 22px;
            font-weight: 500;
            margin-bottom: 16px;
          }
          
          h5 {
            font-size: 20px;
            font-weight: 500;
            margin-bottom: 14px;
          }
          
          p {
            margin-bottom: 16px;
            font-size: 18px;
          }
          
          /* Card styling */
          div[data-slot="card"] {
            background-color: white;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            padding: 28px 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
          }
          
          div[data-slot="card-title"] {
            font-size: 22px;
            font-weight: 500;
            margin-bottom: 10px;
          }
          
          div[data-slot="card-description"] {
            font-size: 16px;
            color: #718096;
            margin-bottom: 18px;
          }
          
          div[data-slot="card-content"] {
            font-size: 18px;
            line-height: 1.5;
          }
          
          /* Table styling */
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 18px;
          }
          
          th {
            text-align: left;
            padding: 18px;
            font-weight: 500;
            border-bottom: 2px solid #e2e8f0;
            font-size: 18px;
          }
          
          td {
            padding: 18px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 18px;
          }
          
          /* Button styling */
          button {
            background-color: #4B5EAA;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 20px;
            font-size: 18px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          button:hover {
            background-color: #3a4a8c;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          /* Input field styling */
          input, select, textarea {
            font-size: 18px;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            background-color: white;
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.2s ease;
            margin-bottom: 16px;
          }
          
          input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #4B5EAA;
            box-shadow: 0 0 0 3px rgba(75, 94, 170, 0.2);
          }
          
          /* Label styling */
          label {
            display: block;
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 8px;
            color: #2d3748;
          }
          
          /* Box and container labels */
          .box-label, .section-label, .container-label {
            font-size: 20px;
            font-weight: 500;
            margin-bottom: 12px;
            color: #2d3748;
          }
          
          /* Helper text and hints */
          .helper-text, .hint {
            font-size: 16px;
            color: #718096;
            margin-top: 4px;
            margin-bottom: 16px;
          }
          
          /* Layout */
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 28px;
          }
          
          /* Form groups */
          .form-group {
            margin-bottom: 24px;
          }
          
          /* Tabs styling */
          [data-slot="tabs-trigger"] {
            font-size: 20px !important;
            padding: 14px 22px !important;
            font-weight: 500 !important;
            letter-spacing: -0.01em !important;
          }
          
          [data-slot="tabs-content"] {
            font-size: 18px !important;
            padding-top: 24px !important;
            line-height: 1.5 !important;
          }
          
          [data-slot="tabs-list"] {
            border: none !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
          }
          
          .dark [data-slot="tabs-list"] {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          
          /* Improve legibility of small text */
          .small-text {
            font-size: 16px;
            line-height: 1.4;
          }
          
          /* Improve dashboard text */
          .dashboard-text {
            font-size: 18px;
            line-height: 1.5;
          }
          
          /* Improve chart labels */
          .chart-label, .axis-label {
            font-size: 16px;
            font-weight: 500;
          }
          
          /* Improve tooltips */
          .tooltip, [data-tooltip] {
            font-size: 16px;
            padding: 10px 14px;
          }
          
          /* Sidebar styling - removing borders and adding subtle separation */
          div[class*="bg-sidebar"] {
            border: none !important;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
          }
          
          /* Remove all sidebar internal borders */
          div[class*="bg-sidebar"] > div {
            border: none !important;
          }
          
          /* Add subtle separation between sidebar sections using background instead of borders */
          div[class*="bg-sidebar"] > div:not(:last-child) {
            position: relative;
          }
          
          div[class*="bg-sidebar"] > div:not(:last-child)::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 10%;
            right: 10%;
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.05), transparent);
          }
          
          /* Enhanced sidebar font styling */
          div[class*="bg-sidebar"] a {
            font-size: 18px !important;
            font-weight: 500 !important;
            letter-spacing: -0.01em !important;
          }
          
          div[class*="bg-sidebar"] p {
            font-size: 16px !important;
            letter-spacing: -0.01em !important;
          }
          
          div[class*="bg-sidebar"] p + p {
            font-size: 14px !important;
            font-weight: 400 !important;
          }
          
          /* Dark mode sidebar adjustments */
          .dark div[class*="bg-sidebar"] {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
          }
          
          .dark div[class*="bg-sidebar"] > div:not(:last-child)::after {
            background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.05), transparent);
          }
          
          /* Tab section pages styling */
          /* Page headers */
          h1 {
            font-size: 36px !important;
            font-weight: 500 !important;
            letter-spacing: -0.02em !important;
            margin-bottom: 24px !important;
          }
          
          /* Card elements in tab pages */
          [data-slot="card"] {
            border: none !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
            border-radius: 12px !important;
            overflow: hidden !important;
          }
          
          /* Card headers */
          [data-slot="card-header"] {
            padding: 24px 24px 12px 24px !important;
          }
          
          /* Card titles */
          [data-slot="card-title"] {
            font-size: 22px !important;
            font-weight: 500 !important;
            letter-spacing: -0.01em !important;
          }
          
          /* Card descriptions */
          [data-slot="card-description"] {
            font-size: 16px !important;
            color: #718096 !important;
            margin-top: 4px !important;
          }
          
          /* Card content */
          [data-slot="card-content"] {
            padding: 0 24px 24px 24px !important;
          }
          
          /* Section headers in cards */
          [data-slot="card-content"] h3 {
            font-size: 16px !important;
            font-weight: 500 !important;
            color: #64748b !important;
            margin-bottom: 6px !important;
          }
          
          /* Data text in cards */
          [data-slot="card-content"] p {
            font-size: 18px !important;
            margin-bottom: 16px !important;
          }
          
          /* Data boxes */
          .bg-muted\/30 {
            background-color: #f8fafc !important;
            border-radius: 8px !important;
            padding: 16px !important;
            border: 1px solid #e2e8f0 !important;
          }
          
          .dark .bg-muted\/30 {
            background-color: #1e293b !important;
            border: 1px solid #334155 !important;
          }
          
          /* Table styling in tab pages */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          
          table th {
            text-align: left !important;
            padding: 16px !important;
            font-size: 16px !important;
            font-weight: 500 !important;
            color: #64748b !important;
            border-bottom: 2px solid #e2e8f0 !important;
          }
          
          table td {
            padding: 16px !important;
            font-size: 16px !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          
          .dark table th {
            color: #94a3b8 !important;
            border-bottom: 2px solid #334155 !important;
          }
          
          .dark table td {
            border-bottom: 1px solid #334155 !important;
          }
          
          /* Button styling in tab pages */
          button {
            border-radius: 8px !important;
            font-size: 16px !important;
            font-weight: 500 !important;
            padding: 10px 16px !important;
            transition: all 0.2s ease !important;
          }
          
          button[variant="outline"] {
            border: 1px solid #e2e8f0 !important;
            background-color: transparent !important;
            color: #64748b !important;
          }
          
          button[variant="outline"]:hover {
            background-color: #f8fafc !important;
            border-color: #cbd5e1 !important;
          }
          
          .dark button[variant="outline"] {
            border-color: #334155 !important;
            color: #e2e8f0 !important;
          }
          
          .dark button[variant="outline"]:hover {
            background-color: #1e293b !important;
            border-color: #475569 !important;
          }
          
          /* Links in tab pages */
          a.text-primary {
            color: #4B5EAA !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
          }
          
          a.text-primary:hover {
            color: #3a4a8c !important;
            text-decoration: underline !important;
          }
          
          .dark a.text-primary {
            color: #93c5fd !important;
          }
          
          .dark a.text-primary:hover {
            color: #bfdbfe !important;
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            body {
              font-size: 16px;
            }
            
            h1 {
              font-size: 36px;
            }
            
            h2 {
              font-size: 30px;
            }
            
            h3 {
              font-size: 24px;
            }
            
            input, select, textarea, button, label {
              font-size: 16px;
              padding: 10px 14px;
            }
          }
        `}} />
      </head>
      <body className={`${inter.variable} ${jetBrainsMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
