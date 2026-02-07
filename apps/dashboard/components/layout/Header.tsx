'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { WalletButton } from '@/components/WalletButton'

interface HeaderProps {
  showNav?: boolean
  showWallet?: boolean
}

export function Header({ showNav = true, showWallet = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="border-b border-border-subtle opacity-0 animate-fade-down delay-100">
      <div className="flex justify-between items-center py-4 md:py-6">
        <Link href="/" className="flex items-center gap-2.5 no-underline text-text-primary">
          <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center">
            <Logo size={32} />
          </div>
          <span className="font-mono text-base md:text-lg font-medium tracking-tight">oikonomos</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {showNav && (
            <nav>
              <ul className="flex gap-8 list-none">
                <li>
                  <Link
                    href="/launch"
                    className="font-mono text-xs font-normal text-text-secondary uppercase tracking-widest no-underline hover:text-accent-blue transition-colors"
                  >
                    Launch
                  </Link>
                </li>
                <li>
                  <Link
                    href="/keychain"
                    className="font-mono text-xs font-normal text-text-secondary uppercase tracking-widest no-underline hover:text-accent-blue transition-colors"
                  >
                    Keychain
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/estmcmxci/oikonomos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-normal text-text-secondary uppercase tracking-widest no-underline hover:text-accent-blue transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </nav>
          )}
          {showWallet && <WalletButton />}
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          {showWallet && <WalletButton />}
          {showNav && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 flex items-center justify-center text-text-secondary"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && showNav && (
        <nav className="md:hidden pb-4 border-t border-border-subtle/50 pt-3">
          <ul className="flex flex-col gap-4 list-none">
            <li>
              <Link
                href="/launch"
                onClick={() => setMobileOpen(false)}
                className="font-mono text-sm font-normal text-text-secondary uppercase tracking-widest no-underline hover:text-accent-blue transition-colors"
              >
                Launch
              </Link>
            </li>
            <li>
              <Link
                href="/keychain"
                onClick={() => setMobileOpen(false)}
                className="font-mono text-sm font-normal text-text-secondary uppercase tracking-widest no-underline hover:text-accent-blue transition-colors"
              >
                Keychain
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/estmcmxci/oikonomos"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm font-normal text-text-secondary uppercase tracking-widest no-underline hover:text-accent-blue transition-colors"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
