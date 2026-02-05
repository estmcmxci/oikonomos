import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { WalletButton } from '@/components/WalletButton'

interface HeaderProps {
  showNav?: boolean
  showWallet?: boolean
}

export function Header({ showNav = true, showWallet = false }: HeaderProps) {
  return (
    <header className="flex justify-between items-center py-6 border-b border-border-subtle opacity-0 animate-fade-down delay-100">
      <Link href="/" className="flex items-center gap-3 no-underline text-text-primary">
        <div className="w-9 h-9 flex items-center justify-center">
          <Logo size={36} />
        </div>
        <span className="font-mono text-lg font-medium tracking-tight">oikonomos</span>
      </Link>

      <div className="flex items-center gap-6">
        {showNav && (
          <nav>
            <ul className="flex gap-8 list-none">
              <li>
                <Link
                  href="/discover"
                  className="font-mono text-xs font-normal text-text-secondary uppercase tracking-widest no-underline hover:text-accent-blue transition-colors"
                >
                  Agents
                </Link>
              </li>
              <li>
                <a
                  href="#docs"
                  className="font-mono text-xs font-normal text-text-secondary uppercase tracking-widest no-underline hover:text-accent-blue transition-colors"
                >
                  Docs
                </a>
              </li>
              <li>
                <a
                  href="#github"
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
    </header>
  )
}
