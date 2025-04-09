"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { NexwaveLogo } from './logo';

interface ThemeAwareLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  defaultVariant?: 'light' | 'dark';
}

export function ThemeAwareLogo({ 
  className, 
  size = 'md', 
  defaultVariant = 'dark' 
}: ThemeAwareLogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<'light' | 'dark'>(defaultVariant);
  
  // After mounting, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Update logo variant based on theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setCurrentVariant(currentTheme === 'dark' ? 'light' : 'dark');
  }, [theme, systemTheme, mounted]);
  
  // During SSR and initial mount, use the default variant
  if (!mounted) {
    return <NexwaveLogo className={className} size={size} variant={defaultVariant} />;
  }
  
  return <NexwaveLogo className={className} size={size} variant={currentVariant} />;
}
