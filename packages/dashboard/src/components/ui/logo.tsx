"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export function CashflowLogo({ className = '', size = 'md', variant }: LogoProps) {
  const { theme } = useTheme();
  
  // Font sizes for each size to avoid layout shifts
  const sizeMap = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  
  const fontSize = sizeMap[size];
  
  // If variant is explicitly provided, use it; otherwise determine based on theme
  const logoVariant = variant || (theme === 'dark' ? 'light' : 'dark');
  
  // Text color based on variant
  const textColor = logoVariant === 'light' ? 'text-white' : 'text-black';
  
  return (
    <div className={cn(
      'flex items-center',
      className
    )}>
      <div className={cn(
        fontSize,
        textColor,
        'font-bold tracking-tight'
      )}>
        <span className={cn("font-extrabold", logoVariant === 'light' ? 'text-white' : 'text-black dark:text-white')}>Cash</span>
        <span className={logoVariant === 'light' ? 'text-white' : 'text-black dark:text-white'}>flow</span>
      </div>
    </div>
  );
}
