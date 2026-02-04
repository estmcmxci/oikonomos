# Oikonomos Design System Reference

This document extracts all reusable design tokens, components, and patterns from the landing page for migration to Next.js.

**Source file:** `apps/dashboard/index.html`

---

## 1. Design Tokens (CSS Variables)

Copy to `globals.css` or Tailwind config:

```css
:root {
  /* Background colors */
  --bg-base: #0a0a0b;
  --bg-elevated: #111114;
  --bg-card: rgba(17, 17, 20, 0.7);

  /* Border colors */
  --border-subtle: rgba(82, 152, 255, 0.15);
  --border-accent: rgba(82, 152, 255, 0.4);

  /* Text colors */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-tertiary: rgba(255, 255, 255, 0.4);

  /* Accent colors */
  --accent-blue: #5298FF;
  --accent-cyan: #00D4AA;
  --accent-blue-glow: rgba(82, 152, 255, 0.3);

  /* Typography */
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

## 2. Typography Scale

| Element | Font | Size | Weight | Letter Spacing |
|---------|------|------|--------|----------------|
| Hero title | Space Grotesk | 4rem | 700 | -0.03em |
| Section title | Space Grotesk | 2.5rem | 700 | -0.02em |
| Step title | Space Grotesk | 1.25rem | 600 | -0.01em |
| Body text | Space Grotesk | 1.125rem | 300 | normal |
| Description | Space Grotesk | 0.9375rem | 300 | normal |
| Logo text | JetBrains Mono | 1.125rem | 500 | -0.02em |
| Button text | JetBrains Mono | 0.8125rem | 500 | 0.08em |
| Nav links | JetBrains Mono | 0.75rem | 400 | 0.1em |
| Labels | JetBrains Mono | 0.6875rem | 500 | 0.15em |
| Stat values | JetBrains Mono | 2.5rem | 700 | normal |
| Small text | JetBrains Mono | 0.625rem | 400 | 0.1em |

---

## 3. Google Fonts Import

Add to `layout.tsx` or `_document.tsx`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet">
```

Or with Next.js font optimization:

```tsx
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500', '700'],
})
```

---

## 4. Background Layers

Three fixed layers create depth. Add to a `BackgroundLayers` component or layout:

### Grid Pattern
```css
.bg-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(82, 152, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(82, 152, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}
```

### Gradient Overlay
```css
.bg-gradient {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(82, 152, 255, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 80% 60%, rgba(0, 212, 170, 0.05), transparent);
  pointer-events: none;
  z-index: 0;
}
```

### Noise Texture
```css
.bg-noise {
  position: fixed;
  inset: 0;
  opacity: 0.4;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: overlay;
}
```

---

## 5. Logo Component

### Owl of Athena SVG (Side Profile)

```tsx
// components/Logo.tsx
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
```

---

## 6. Button Components

### Primary Button
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  background: var(--accent-blue);
  color: var(--bg-base);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  background: #6aa5ff;
  box-shadow: 0 0 40px var(--accent-blue-glow);
}

/* Shine effect on hover */
.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.btn-primary:hover::before {
  transform: translateX(100%);
}
```

### Secondary Button
```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 400;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  color: var(--text-primary);
  border-color: var(--border-accent);
}
```

---

## 7. Card Components

### Glass Card (Base)
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: var(--border-accent);
  transform: translateY(-4px);
}
```

### Stat Card
```css
.stat-card {
  background: var(--bg-base);
  padding: 32px;
  text-align: center;
  position: relative;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 1px;
  background: var(--accent-blue);
}
```

### Activity Panel
```css
.activity-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}
```

---

## 8. Animation Keyframes

```css
/* Fade and slide up (most common) */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade and slide down (header) */
@keyframes fadeSlideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide in for activity items */
@keyframes slideInFade {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse for live indicators */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

### Staggered Animation Delays
```css
/* Apply to sections for orchestrated page load */
header    { animation-delay: 0.1s; }
.hero     { animation-delay: 0.3s; }
.visual   { animation-delay: 0.5s; }
.stats    { animation-delay: 0.7s; }
.how      { animation-delay: 0.9s; }
footer    { animation-delay: 1.1s; }
```

---

## 9. Badge Component

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  backdrop-filter: blur(10px);
}

/* Pulsing dot before badge text */
.badge::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--accent-cyan);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}
```

---

## 10. Icon Box Component

```css
.icon-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(82, 152, 255, 0.1);
  border: 1px solid rgba(82, 152, 255, 0.2);
}

.icon-box.success {
  background: rgba(0, 212, 170, 0.1);
  border-color: rgba(0, 212, 170, 0.2);
}

.icon-box.small {
  width: 32px;
  height: 32px;
}
```

---

## 11. Responsive Breakpoints

```css
/* Tablet */
@media (max-width: 1024px) {
  /* Switch to single column layouts */
  /* Reduce title sizes: 4rem → 3rem */
  /* Hide step connectors */
}

/* Mobile */
@media (max-width: 640px) {
  /* Further reduce: 3rem → 2.25rem */
  /* Stack buttons vertically */
  /* Hide nav links */
  /* Single column stats */
}
```

---

## 12. SVG Icons Used

### Wallet Icon
```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="2" y="6" width="20" height="12" rx="2"/>
  <path d="M16 12h.01"/>
</svg>
```

### Arrow Icon
```html
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M7 17l10-10M7 7h10v10"/>
</svg>
```

### Clock Icon
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="1.5">
  <circle cx="12" cy="12" r="10"/>
  <path d="M12 6v6l4 2"/>
</svg>
```

### Shield Check Icon
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="1.5">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  <path d="M9 12l2 2 4-4"/>
</svg>
```

---

## 13. Page Structure Template

```tsx
// app/page.tsx structure
export default function Page() {
  return (
    <>
      {/* Background layers */}
      <div className="bg-grid" />
      <div className="bg-gradient" />
      <div className="bg-noise" />

      <div className="container">
        <Header />

        <section className="hero">
          <HeroContent />
          <HeroVisual />
        </section>

        <section className="stats-section">
          <StatsGrid />
        </section>

        <section className="how-section">
          <SectionHeader />
          <StepsGrid />
        </section>

        <Footer />
      </div>
    </>
  )
}
```

---

## 14. File Structure for Next.js

```
apps/dashboard/
├── app/
│   ├── layout.tsx          # Fonts, metadata, BackgroundLayers
│   ├── page.tsx            # Landing page (/)
│   ├── analyze/page.tsx    # Portfolio analysis
│   ├── discover/page.tsx   # Agent marketplace
│   ├── configure/[id]/page.tsx
│   ├── authorize/page.tsx
│   └── dashboard/page.tsx
├── components/
│   ├── Logo.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── IconBox.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── BackgroundLayers.tsx
│   └── ActivityFeed.tsx
├── styles/
│   └── globals.css         # CSS variables, base styles, animations
└── public/
    └── ...
```

---

## Quick Reference

| Token | Value |
|-------|-------|
| Primary BG | `#0a0a0b` |
| Card BG | `rgba(17, 17, 20, 0.7)` |
| Accent Blue | `#5298FF` |
| Accent Cyan | `#00D4AA` |
| Border Subtle | `rgba(82, 152, 255, 0.15)` |
| Display Font | Space Grotesk |
| Mono Font | JetBrains Mono |
| Container Max | 1400px |
| Card Blur | 10-20px |
