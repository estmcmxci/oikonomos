'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   Navbar Component — Arkham-Inspired Design
   ═══════════════════════════════════════════════════════════════════ */

const navLinks = [
  { href: '/', label: 'Discover' },
  { href: '/portfolio', label: 'Portfolio' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold text-brand-gradient">
              Oikonomos
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-[var(--color-bg-raised)] text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-raised)]'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
