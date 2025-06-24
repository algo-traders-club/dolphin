"use client";

import { useTheme } from 'next-themes';
import { DolphinLogo } from './logo';

interface ThemeAwareDolphinLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  defaultVariant?: 'light' | 'dark';
}

export function ThemeAwareDolphinLogo({
  className = '',
  size = 'md',
  defaultVariant = 'dark'
}: ThemeAwareDolphinLogoProps) {
  const { theme, resolvedTheme } = useTheme();
  
  // Determine the current variant based on the resolved theme
  const currentVariant = resolvedTheme === 'dark' ? 'light' : 'dark';
  
  // If we're still loading the theme, use the default variant
  if (theme === 'system' && !resolvedTheme) {
    return <DolphinLogo className={className} size={size} variant={defaultVariant} />;
  }
  
  // If we have a resolved theme, use the appropriate variant
  return <DolphinLogo className={className} size={size} variant={currentVariant} />;
}
