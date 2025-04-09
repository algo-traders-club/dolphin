"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { NexwaveLogo } from '@/components/ui/logo';


const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Position Details', href: '/position' },
  { name: 'Liquidity History', href: '/liquidity' },
  { name: 'Fees & Revenue', href: '/revenue' },
  { name: 'Transactions', href: '/transactions' },
  { name: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-72 md:flex-col">
      <div className="sticky top-0 h-screen flex flex-col bg-sidebar dark:bg-opacity-95 backdrop-blur-sm">
        <div className="flex items-center h-20 flex-shrink-0 px-6">
          <NexwaveLogo size="md" variant="dark" />
        </div>
        <div className="flex-grow flex flex-col overflow-y-auto pt-2">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/10',
                    'group flex items-center px-4 py-3 text-base font-medium tracking-tight rounded-lg transition-all duration-200'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex p-6">
          <div className="flex items-center">
            <div className="space-y-1">
              <p className="text-base font-medium text-sidebar-foreground">Orca Liquidity Agent</p>
              <p className="text-sm text-sidebar-foreground/70">Connected to Solana Mainnet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
