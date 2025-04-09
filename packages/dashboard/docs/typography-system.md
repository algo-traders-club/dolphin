# Nexwave Dashboard Typography System

This document outlines the Apple/Neobank-inspired typography system implemented for the Nexwave Dashboard, focusing on modern minimalism, functional elegance, readability, and visual hierarchy. The system has been carefully designed to ensure consistent typography across all components while maintaining optimal visual appeal and readability.

## Core Typography Principles

1. **Optical Sizing & Rendering**
   - Font optical sizing is enabled with `font-optical-sizing: auto`
   - Text rendering is optimized with `text-rendering: optimizeLegibility`
   - Anti-aliasing is applied with `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale`

2. **Font Stack**
   - Primary: Inter (with fallback to SF Pro Display/SF Pro Text)
   - Monospace: JetBrains Mono (with fallback to SF Mono)
   - Both fonts are loaded with variable weights for optimal display

3. **Type Scale**
   ```
   h1: 32px (2rem) / 38px - Semibold - Tracking: -0.8%
   h2: 28px (1.75rem) / 34px - Semibold - Tracking: -0.6%
   h3: 22px (1.375rem) / 28px - Medium - Tracking: -0.4%
   h4: 18px (1.125rem) / 24px - Medium - Tracking: -0.2%
   h5: 16px (1rem) / 22px - Regular
   h6: 14px (0.875rem) / 20px - Regular
   ```

4. **Microtypography Refinements**
   - Letter spacing uses relative em units:
     - Headings: -0.8% to -0.2% (tighter for larger text)
     - Body: -0.16%
   - Line heights follow a 4px baseline grid
   - Font feature settings enable alternate glyphs: `"ss01", "ss03", "cv02", "cv11"`

5. **Dark Mode Optimizations**
   - Increased letter spacing (+0.02em)
   - Increased line height (+5%)
   - Reduced font weights (600→550, 500→450)

## Component-Specific Typography

1. **Cards**
   - Card titles: Semibold weight (600), reduced to 550 in dark mode
   - Card descriptions: 13px size with relaxed line height (1.4)
   - Subtle text shadows in light mode for depth
   - Optimized text rendering with `text-rendering: optimizeLegibility`
   - Component-specific class: `.typography-card-title` and `.typography-card-description`

2. **Tables**
   - Tabular figures enabled with `font-variant-numeric: tabular-nums`
   - Table headers: Semibold weight with slightly tighter tracking
   - Table cells: Normal tracking with tabular figures
   - Monospace for numerical data with slightly smaller size (0.925em)
   - Component-specific class: `.typography-table-header`

3. **Charts**
   - Chart labels: 11px with 0.1em tracking and tabular figures
   - Chart tooltips: 12px headers with 11px content
   - Monospace for numerical values (10px) with tabular figures
   - Optimized for data legibility with proper alignment
   - Component-specific class: `.typography-chart-label`

4. **Buttons**
   - Medium weight (500), reduced to 450 in dark mode
   - Slightly tighter tracking (-0.2%)
   - Optimized text rendering for crisp display
   - Component-specific class: `.typography-button`

## CSS Variables System

All typography values are defined as CSS variables for consistency:

```css
--font-size-xs: 0.75rem;      /* 12px */
--font-size-sm: 0.875rem;     /* 14px */
--font-size-base: 1rem;       /* 16px */
--font-size-lg: 1.125rem;     /* 18px */
--font-size-xl: 1.375rem;     /* 22px */
--font-size-2xl: 1.75rem;     /* 28px */
--font-size-3xl: 2rem;        /* 32px */

--line-height-tight: 1.2;     /* Headings */
--line-height-normal: 1.5;    /* Body text */
--line-height-relaxed: 1.6;   /* Larger text blocks */

--tracking-tightest: -0.008em; /* -0.8% */
--tracking-tighter: -0.006em;  /* -0.6% */
--tracking-tight: -0.004em;    /* -0.4% */
--tracking-slightly-tight: -0.002em; /* -0.2% */
--tracking-normal: -0.0016em;  /* -0.16% */
--tracking-wide: 0.001em;      /* 0.1% */
```

## Implementation Details

1. **File Structure**
   - `typography.css`: Core typography variables and styles within the `@layer components` directive
   - `tailwind.config.ts`: Typography scale configuration and utility classes
   - `globals.css`: Base typography styles and CSS variables
   - Custom plugins for text shadows and typography utilities

2. **Tailwind Integration**
   - Custom text shadow utilities via plugin
   - Typography-specific utilities for optical sizing, ligatures, and text rendering:
     - `.font-optical-sizing-auto`: Enables optical sizing
     - `.text-rendering-optimizeLegibility`: Optimizes text rendering
     - `.font-variant-numeric-tabular`: Enables tabular figures
     - `.font-variant-ligatures-common`: Enables common ligatures
     - `.font-feature-all`: Applies all font features
   - Component-specific typography classes:
     - `.typography-card-title`, `.typography-card-description`
     - `.typography-table-header`, `.typography-chart-label`
     - `.typography-button`, `.typography-mono`
   - Dark mode adaptations via CSS variables and media queries

3. **CSS Integration**
   - PostCSS processing with Tailwind directives
   - CSS imports for proper module loading
   - CSS variables for consistent typography across components

4. **Accessibility**
   - All text maintains WCAG 2.1 AA contrast compliance
   - Line lengths kept between 45-75 characters
   - Visual hierarchy is discernible at 200% zoom
   - Proper text scaling for responsive layouts

## Browser Compatibility

The typography system is optimized for Safari's font rendering engine while maintaining cross-browser compatibility. The implementation uses progressive enhancement to ensure that the typography looks good on all browsers, with enhanced features on Safari.

## Troubleshooting

If typography styles are not being properly applied, check the following:

1. **CSS Loading Order**: Ensure that typography.css is imported after the Tailwind base styles but before component styles.

2. **Layer Directives**: Typography styles should be defined within the `@layer components` directive to ensure proper cascade and specificity.

3. **PostCSS Configuration**: Verify that postcss.config.mjs includes the necessary plugins:
   ```js
   export default {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
       'postcss-import': {},
       'postcss-nested': {},
     },
   };
   ```

4. **CSS Variables**: Check that CSS variables are properly defined in :root and accessed correctly in component styles.

5. **Utility Classes**: Use the provided utility classes (e.g., `.typography-card-title`) for consistent styling across components.
