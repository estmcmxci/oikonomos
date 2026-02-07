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
