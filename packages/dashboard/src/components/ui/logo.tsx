"use client";

import React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export function NexwaveLogo({ className = '', size = 'md', variant }: LogoProps) {
  const { theme } = useTheme();
  
  // Fixed dimensions for each size to avoid layout shifts
  const sizeMap = {
    sm: { height: 32, width: 128 },
    md: { height: 40, width: 160 },
    lg: { height: 48, width: 192 },
  };
  
  const { height, width } = sizeMap[size];
  
  // If variant is explicitly provided, use it; otherwise use the dark logo
  // We want to always use the dark logo on light backgrounds and light logo on dark backgrounds
  const logoVariant = variant || 'dark';
  
  // Ensure we're using the correct logo based on the variant
  const logoPath = logoVariant === 'light' 
    ? '/images/nexwave-logo-light.png'
    : '/images/nexwave-logo-dark.png';
  
  return (
    <div className={`flex items-center ${className}`}>
      <Image 
        src={logoPath}
        alt="Nexwave Logo"
        width={width}
        height={height}
        priority
      />
    </div>
  );
}
