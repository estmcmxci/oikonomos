import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-10 border-t border-border-subtle opacity-0 animate-fade-up delay-1300">
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs text-text-tertiary">
          © 2026 Oikonomos. Built for ETHGlobal.
        </span>
        <div className="flex gap-6">
          <a
            href="https://github.com/estmcmxci/oikonomos"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-text-tertiary no-underline hover:text-accent-blue transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
