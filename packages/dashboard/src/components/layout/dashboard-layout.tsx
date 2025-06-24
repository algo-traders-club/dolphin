"use client";

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 overflow-auto bg-background flex flex-col">
        <main className="p-6 md:p-10 lg:p-12 font-light tracking-tight flex-1">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        <footer className="border-t border-border/10 bg-background/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12 py-4">
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <p>Copyright ©️ 2025 Algo Traders Club. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
