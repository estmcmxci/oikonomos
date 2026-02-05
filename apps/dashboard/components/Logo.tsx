export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
    >
      <defs>
        <linearGradient id="owlGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5298FF"/>
          <stop offset="100%" stopColor="#00D4AA"/>
        </linearGradient>
      </defs>
      {/* Body profile */}
      <path
        d="M8 28C8 28 6 26 6 22C6 18 8 16 8 16C8 16 7 14 8 11C9 8 12 6 15 6C15 6 16 4 19 4C22 4 24 6 25 8C26 10 26 12 25 14C25 14 28 15 29 18C30 21 29 24 28 26L26 28"
        stroke="url(#owlGradient)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Large eye */}
      <circle cx="20" cy="11" r="5" stroke="url(#owlGradient)" strokeWidth="1.5" fill="none"/>
      <circle cx="20" cy="11" r="2.5" fill="url(#owlGradient)"/>
      {/* Beak */}
      <path d="M26 13L30 15L26 17" stroke="url(#owlGradient)" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      {/* Wing details */}
      <path d="M10 18C12 17 14 18 16 20C18 22 18 25 17 27" stroke="url(#owlGradient)" strokeWidth="1" opacity="0.6"/>
      <path d="M8 20C10 19 12 20 14 22" stroke="url(#owlGradient)" strokeWidth="1" opacity="0.4"/>
      {/* Tail feathers */}
      <path d="M6 26L4 30" stroke="url(#owlGradient)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 27L7 31" stroke="url(#owlGradient)" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Talons */}
      <path d="M18 28L18 32M16 32H20" stroke="url(#owlGradient)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M24 27L24 32M22 32H26" stroke="url(#owlGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
