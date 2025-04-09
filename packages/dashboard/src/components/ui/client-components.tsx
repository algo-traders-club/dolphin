"use client";

import React from 'react';
import { ThemeToggle } from './theme-toggle';
import { NexwaveLogo } from './logo';

export function ClientThemeToggle() {
  return <ThemeToggle />;
}

export function ClientNexwaveLogo({ size, variant }: { size?: 'sm' | 'md' | 'lg', variant?: 'light' | 'dark' }) {
  return <NexwaveLogo size={size} variant={variant} />;
}
