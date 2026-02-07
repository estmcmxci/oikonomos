// Shared Keychain Row + Icon components
// Used by the home page hero and the /keychain dashboard

export function KeychainRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: 'cyan' | 'blue' | 'amber' | 'purple' | 'pink'
}) {
  const colors = {
    cyan: 'bg-accent-cyan/10 border-accent-cyan/20 text-[#00D4AA]',
    blue: 'bg-accent-blue/10 border-accent-blue/20 text-[#5298FF]',
    amber: 'bg-[#F5AC37]/10 border-[#F5AC37]/20 text-[#F5AC37]',
    purple: 'bg-[#A78BFA]/10 border-[#A78BFA]/20 text-[#A78BFA]',
    pink: 'bg-[#FF007A]/10 border-[#FF007A]/20 text-[#FF007A]',
  }

  return (
    <div className="flex items-center gap-4 p-3 bg-bg-base/50 border border-border-subtle/50">
      <div className={`w-9 h-9 flex items-center justify-center border ${colors[accent]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-widest">
          {label}
        </div>
        <div className="font-mono text-sm text-text-primary truncate">{value}</div>
      </div>
    </div>
  )
}

// ── Icons ───────────────────────────────────────────────────────────

export function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <circle cx="16" cy="12" r="2"/>
      <path d="M6 12h4"/>
    </svg>
  )
}

export function ENSIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5298FF" strokeWidth="1.5">
      <path d="M7 8L12 4L17 8V14L12 20L7 14V8Z"/>
      <path d="M10 11L12 9L14 11V13L12 15L10 13V11Z" fill="#5298FF"/>
    </svg>
  )
}

export function IdentityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5AC37" strokeWidth="1.5">
      <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

export function NostrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  )
}

export function TokenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF007A" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v12M8 10h8M8 14h8"/>
    </svg>
  )
}

export function A2AIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
      <path d="M5 12h14"/>
      <path d="M15 6l4 6-4 6"/>
      <circle cx="3" cy="12" r="2"/>
      <circle cx="21" cy="12" r="2"/>
    </svg>
  )
}

export function DelegationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5">
      <path d="M16 3h5v5"/>
      <path d="M21 3L9 15"/>
      <path d="M8 3H3v18h18v-5"/>
    </svg>
  )
}
