"use client";

import React from 'react';
import { ThemeToggle } from './theme-toggle';
import { DolphinLogo } from './logo';

export function ClientThemeToggle() {
  return <ThemeToggle />;
}

export function ClientDolphinLogo({ size, variant }: { size?: 'sm' | 'md' | 'lg', variant?: 'light' | 'dark' }) {
  return <DolphinLogo size={size} variant={variant} />;
}
