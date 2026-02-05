const partners = [
  {
    name: 'Base',
    href: 'https://base.org',
    icon: (
      <svg width="28" height="28" viewBox="0 0 111 111" fill="none">
        <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
        <path d="M55.5 22C37 22 22 37 22 55.5C22 74 37 89 55.5 89C74 89 89 74 89 55.5C89 37 74 22 55.5 22ZM55.5 79.5C42.5 79.5 32 69 32 55.5C32 42 42.5 31.5 55.5 31.5C68.5 31.5 79 42 79 55.5C79 69 68.5 79.5 55.5 79.5Z" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'Uniswap',
    href: 'https://uniswap.org',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M10.5 5.5C10.5 5.5 9 6.5 9 8.5C9 10.5 10 11 10 11C10 11 9 11 8.5 12C8 13 8.5 14.5 8.5 14.5C8.5 14.5 7 14 6.5 15.5C6 17 7 18.5 7 18.5L6 20C6 20 8 22.5 11 23C14 23.5 16.5 22 16.5 22C16.5 22 17 23 18.5 23C20 23 21 22 21 22C21 22 21.5 23 22 22.5C22.5 22 22 21 22 21C22 21 23 20 22.5 18.5C22 17 20.5 17 20.5 17C20.5 17 21.5 15.5 21 14C20.5 12.5 19 12.5 19 12.5C19 12.5 20 11 19.5 9.5C19 8 17.5 8 17.5 8C17.5 8 17.5 6 16 5.5C14.5 5 13.5 6 13.5 6C13.5 6 12.5 5 10.5 5.5Z" fill="#FF007A"/>
        <circle cx="11" cy="10" r="1" fill="white"/>
        <circle cx="15" cy="9.5" r="0.75" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'ENS',
    href: 'https://ens.domains',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M7 8L14 4L21 8V14L14 24L7 14V8Z" stroke="#5298FF" strokeWidth="1.5" fill="none"/>
        <path d="M10 11L14 9L18 11V15L14 19L10 15V11Z" fill="#5298FF"/>
      </svg>
    ),
  },
  {
    name: 'x402',
    href: 'https://www.x402.org',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="8" width="20" height="12" rx="2" stroke="#00D4AA" strokeWidth="1.5" fill="none"/>
        <path d="M9 14L12 11L15 14L12 17L9 14Z" fill="#00D4AA"/>
        <circle cx="19" cy="14" r="2" stroke="#00D4AA" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  {
    name: 'ERC-8004',
    href: 'https://eips.ethereum.org/EIPS/eip-8004',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4L22 9V19L14 24L6 19V9L14 4Z" stroke="#F5AC37" strokeWidth="1.5" fill="none"/>
        <path d="M14 8L18 10.5V15.5L14 18L10 15.5V10.5L14 8Z" stroke="#F5AC37" strokeWidth="1" fill="none"/>
        <circle cx="14" cy="13" r="2" fill="#F5AC37"/>
      </svg>
    ),
  },
]

export function BuiltWith() {
  return (
    <section className="py-16 border-t border-border-subtle opacity-0 animate-fade-up delay-1100">
      <div className="font-mono text-[0.625rem] font-medium text-text-tertiary uppercase tracking-[0.2em] text-center mb-8">
        Built With
      </div>
      <div className="flex justify-center items-center gap-12 flex-wrap">
        {partners.map((partner) => (
          <a
            key={partner.name}
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-3 bg-bg-card border border-border-subtle backdrop-blur-xl no-underline transition-all duration-300 hover:border-border-accent hover:-translate-y-0.5"
          >
            <div className="w-7 h-7 flex items-center justify-center">
              {partner.icon}
            </div>
            <span className="font-mono text-[0.8125rem] font-medium text-text-primary">
              {partner.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
