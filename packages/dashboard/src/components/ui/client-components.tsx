"use client";

import React from 'react';
import { ThemeToggle } from './theme-toggle';
import { CashflowLogo } from './logo';

export function ClientThemeToggle() {
  return <ThemeToggle />;
}

export function ClientCashflowLogo({ size, variant }: { size?: 'sm' | 'md' | 'lg', variant?: 'light' | 'dark' }) {
  return <CashflowLogo size={size} variant={variant} />;
}
