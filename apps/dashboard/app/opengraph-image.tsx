import { ImageResponse } from 'next/og'

export const alt = 'Oikonomos — Agent Keychain & Portfolio Manager'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1b2a 50%, #0a1628 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 212, 170, 0.1)',
              border: '1px solid rgba(0, 212, 170, 0.3)',
              borderRadius: '20px',
              padding: '8px 20px',
              fontSize: '18px',
              color: '#00D4AA',
              letterSpacing: '0.1em',
            }}
          >
            LIVE ON SEPOLIA
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.1,
            marginBottom: '8px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>Agent Keychain &amp;</span>
        </div>
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            lineHeight: 1.1,
            color: '#00D4AA',
            display: 'flex',
          }}
        >
          Portfolio Manager
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.5)',
            maxWidth: '700px',
            lineHeight: 1.5,
            marginTop: '24px',
            display: 'flex',
          }}
        >
          Launch AI agents with deterministic wallets, ENS identity, and autonomous Uniswap V4 fee management.
        </div>

        {/* Bottom tags */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginTop: '48px',
          }}
        >
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 20px', display: 'flex' }}>Base</div>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 20px', display: 'flex' }}>Uniswap V4</div>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 20px', display: 'flex' }}>ENS</div>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 20px', display: 'flex' }}>ERC-8004</div>
        </div>

        {/* Owl logo - right side */}
        <div
          style={{
            position: 'absolute',
            right: '60px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            opacity: 0.15,
          }}
        >
          <svg width="380" height="380" viewBox="0 0 36 36" fill="none">
            <path d="M8 28C8 28 6 26 6 22C6 18 8 16 8 16C8 16 7 14 8 11C9 8 12 6 15 6C15 6 16 4 19 4C22 4 24 6 25 8C26 10 26 12 25 14C25 14 28 15 29 18C30 21 29 24 28 26L26 28" stroke="#00D4AA" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <circle cx="20" cy="11" r="5" stroke="#00D4AA" strokeWidth="1.5" fill="none"/>
            <circle cx="20" cy="11" r="2.5" fill="#00D4AA"/>
            <path d="M26 13L30 15L26 17" stroke="#00D4AA" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
            <path d="M10 18C12 17 14 18 16 20C18 22 18 25 17 27" stroke="#00D4AA" strokeWidth="1" opacity="0.6"/>
            <path d="M8 20C10 19 12 20 14 22" stroke="#00D4AA" strokeWidth="1" opacity="0.4"/>
            <path d="M6 26L4 30" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8 27L7 31" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M18 28L18 32M16 32H20" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M24 27L24 32M22 32H26" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Logo text bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '80px',
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.25)',
            letterSpacing: '0.05em',
            display: 'flex',
          }}
        >
          oikonomos
        </div>
      </div>
    ),
    { ...size }
  )
}
