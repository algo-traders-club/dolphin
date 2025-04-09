import type { Config } from "tailwindcss";

// Import custom plugins
const textShadowPlugin = require('./src/lib/tailwind-plugins/text-shadow.js');

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.css",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)", 
          "SF Pro Display", 
          "SF Pro Text", 
          "system-ui", 
          "sans-serif"
        ],
        mono: [
          "var(--font-mono)", 
          "SF Mono", 
          "monospace"
        ],
      },
      fontSize: {
        // Apple-inspired typography scale with precise line heights and letter spacing
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "var(--tracking-normal)" }],
        sm: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "var(--tracking-normal)" }],
        base: ["1rem", { lineHeight: "1.5rem", letterSpacing: "var(--tracking-normal)" }],
        lg: ["1.125rem", { lineHeight: "1.5rem", letterSpacing: "var(--tracking-slightly-tight)" }],
        xl: ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "var(--tracking-tight)" }],
        "2xl": ["1.75rem", { lineHeight: "2.125rem", letterSpacing: "var(--tracking-tighter)" }],
        "3xl": ["2rem", { lineHeight: "2.375rem", letterSpacing: "var(--tracking-tightest)" }],
      },
      letterSpacing: {
        tightest: "var(--tracking-tightest)",
        tighter: "var(--tracking-tighter)",
        tight: "var(--tracking-tight)",
        "slightly-tight": "var(--tracking-slightly-tight)",
        normal: "var(--tracking-normal)",
        wide: "var(--tracking-wide)",
      },
      lineHeight: {
        none: "1",
        tight: "var(--line-height-tight)",
        normal: "var(--line-height-normal)",
        relaxed: "var(--line-height-relaxed)",
      },
      fontWeight: {
        light: "300",
        normal: "var(--font-weight-regular)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        // Dark mode weights
        "medium-dark": "var(--font-weight-medium-dark)",
        "semibold-dark": "var(--font-weight-semibold-dark)",
      },
      textShadow: {
        sm: "0 0.5px 0.5px rgba(0, 0, 0, 0.1)",
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
        xl: "var(--radius-xl)",
      },
    },
  },
  plugins: [
    textShadowPlugin,
    require('tailwindcss/plugin')(({ addUtilities, addComponents }: { addUtilities: any, addComponents: any }) => {
      // Typography rendering utilities
      addUtilities({
        '.font-optical-sizing-auto': {
          'font-optical-sizing': 'auto',
        },
        '.text-rendering-optimizeLegibility': {
          'text-rendering': 'optimizeLegibility',
        },
        '.text-rendering-optimizeSpeed': {
          'text-rendering': 'optimizeSpeed',
        },
        '.font-variant-numeric-tabular': {
          'font-variant-numeric': 'tabular-nums',
        },
        '.font-variant-numeric-proportional': {
          'font-variant-numeric': 'proportional-nums',
        },
        '.font-variant-ligatures-common': {
          'font-variant-ligatures': 'common-ligatures',
        },
        '.font-variant-ligatures-none': {
          'font-variant-ligatures': 'no-common-ligatures',
        },
        '.font-feature-ss01': {
          'font-feature-settings': "'ss01'",
        },
        '.font-feature-ss02': {
          'font-feature-settings': "'ss02'",
        },
        '.font-feature-cv01': {
          'font-feature-settings': "'cv01'",
        },
        '.font-feature-cv03': {
          'font-feature-settings': "'cv03'",
        },
        '.font-feature-all': {
          'font-feature-settings': "'ss01', 'ss02', 'cv01', 'cv03'",
        },
      });
      
      // Component-specific typography styles
      addComponents({
        '.typography-card-title': {
          'font-size': 'var(--font-size-lg)',
          'font-weight': 'var(--font-weight-semibold)',
          'letter-spacing': 'var(--tracking-slightly-tight)',
          'line-height': 'var(--line-height-tight)',
          '@media (prefers-color-scheme: dark)': {
            'font-weight': 'var(--font-weight-semibold-dark)',
          },
        },
        '.typography-card-description': {
          'font-size': '0.8125rem',
          'line-height': '1.4',
          'letter-spacing': 'var(--tracking-normal)',
          'color': 'var(--muted-foreground)',
        },
        '.typography-table-header': {
          'font-weight': 'var(--font-weight-semibold)',
          'letter-spacing': 'var(--tracking-slightly-tight)',
          '@media (prefers-color-scheme: dark)': {
            'font-weight': 'var(--font-weight-semibold-dark)',
          },
        },
        '.typography-chart-label': {
          'font-size': '0.6875rem',
          'letter-spacing': 'var(--tracking-wide)',
          'font-variant-numeric': 'tabular-nums',
        },
        '.typography-button': {
          'font-weight': 'var(--font-weight-medium)',
          'letter-spacing': 'var(--tracking-slightly-tight)',
          '@media (prefers-color-scheme: dark)': {
            'font-weight': 'var(--font-weight-medium-dark)',
          },
        },
        '.typography-mono': {
          'font-family': 'var(--font-mono)',
          'font-variant-ligatures': 'common-ligatures',
          'font-size': '0.925em',
        },
      });
    }),
  ],
};

export default config;
