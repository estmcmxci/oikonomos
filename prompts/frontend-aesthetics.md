# Frontend Aesthetics Prompt

Use this prompt as a system instruction when generating frontend code for Oikonomos.

```
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight.

PROJECT CONTEXT: Oikonomos - a DeFi strategy marketplace where users discover autonomous agents, delegate trading authority, and verify execution receipts. The aesthetic should feel like a premium governance dashboard—data-dense but elegant, trustworthy but not boring.

REFERENCE: ENS Pulse (ens-pulse.vercel.app) - dark mode, card-based layouts, real-time data visualization, modular sections, professional governance aesthetic.

Typography: Use JetBrains Mono for all data, numbers, addresses, and code. Use Space Grotesk for headings and UI labels. Never use Inter, Roboto, Arial, or system fonts. Use extreme weight contrasts (300 vs 700) and size jumps (3x minimum).

Color & Theme: ALWAYS dark mode. Deep charcoal base (#0a0a0b to #111114). Primary accent: ENS blue (#5298FF). Secondary: cyan/teal highlights. Use CSS variables for consistency. No purple gradients. No light mode. Dominant darks with sharp accent pops.

Motion: Orchestrated page loads with staggered reveals (animation-delay). Subtle hover states on cards. Smooth number transitions for live data. CSS-only where possible. One cohesive entrance animation beats scattered micro-interactions.

Backgrounds: Layer subtle gradients on the dark base. Use glass morphism on cards (backdrop-blur, semi-transparent borders). Add subtle grid or dot patterns for depth. Never flat solid backgrounds.

Layout: Card-based modular sections like a dashboard. Data tables for agents/transactions. Clear visual hierarchy. Mobile-first but optimize for desktop data density.

Avoid:
- Overused fonts (Inter, Roboto, Arial)
- Purple/violet gradients on white
- Generic SaaS landing page patterns
- Rounded-everything friendly aesthetic
- Light mode or white backgrounds
- Cookie-cutter Web3 "connect wallet" templates

This is a professional financial tool, not a consumer app. Think Bloomberg Terminal meets modern design, not Uniswap clone.
</frontend_aesthetics>
```

## Usage

Append this prompt to any frontend generation request to maintain consistent aesthetics across the Oikonomos consumer journey pages.

---

## Consumer Journey Frontend - Approach

### 1. Page Architecture (Map Steps → Routes)

Based on the journey, I'd structure it as 6 distinct pages:

```
┌─────────────────────┬───────────────┬────────────────────────────────────┐
│        Route        │ Journey Steps │              Purpose               │
├─────────────────────┼───────────────┼────────────────────────────────────┤
│ /                   │ Step 1        │ Connect wallet, landing hero       │
├─────────────────────┼───────────────┼────────────────────────────────────┤
│ /analyze            │ Step 2        │ Portfolio breakdown visualization  │
├─────────────────────┼───────────────┼────────────────────────────────────┤
│ /discover           │ Steps 3-4     │ Agent marketplace with filters     │
├─────────────────────┼───────────────┼────────────────────────────────────┤
│ /configure/:agentId │ Step 5        │ Policy configuration wizard        │
├─────────────────────┼───────────────┼────────────────────────────────────┤
│ /authorize          │ Step 6        │ Intent signing + confirmation      │
├─────────────────────┼───────────────┼────────────────────────────────────┤
│ /dashboard          │ Steps 7-8     │ Monitoring, receipts, verification │
└─────────────────────┴───────────────┴────────────────────────────────────┘
```

### 2. Locked Theme (ENS Pulse Inspired)

Drawing from both the aesthetic reference and the prompting guide:

**Theme: "Governance Dashboard Dark"**
- Background: Deep charcoal with subtle gradients (#0a0a0b → #111114)
- Accent: ENS blue (#5298FF) with cyan highlights
- Typography: JetBrains Mono for data/numbers, Space Grotesk for headings
- Cards: Glass morphism with subtle borders
- Motion: Staggered reveals on page load, smooth state transitions

### 3. Implementation Strategy

**Option A: Page-by-Page (Recommended)**
Build each page independently with the `/frontend-design` skill, using a locked theme prompt. This gives you:
- Review each page before moving on
- Consistent aesthetic via shared CSS variables
- Modular, testable components

**Option B: Design System First**
Create shared components (Button, Card, DataTable, AgentCard, etc.) first, then assemble pages. More upfront work but maximum consistency.

### 4. Prompting Approach

For each page, combine:
- **Theme lock**: Always dark mode, ENS Pulse inspired
- **Typography constraint**: JetBrains Mono + Space Grotesk only
- **Anti-patterns**: No purple gradients, no Inter/Roboto, no generic card layouts
- **Reference the journey**: Each page knows what data it receives and what action it enables

---

## Provider Journey Frontend - Approach

### 1. Page Architecture (Map Steps → Routes)

Based on the Provider Journey (STRATEGY_PROVIDER_JOURNEY.md), I'd structure it as 4 distinct pages:

```
┌──────────────────────────┬───────────────┬─────────────────────────────────────────────┐
│          Route           │ Journey Steps │                   Purpose                   │
├──────────────────────────┼───────────────┼─────────────────────────────────────────────┤
│ /provider                │ Step 1        │ Guide/docs for building A2A strategy        │
├──────────────────────────┼───────────────┼─────────────────────────────────────────────┤
│ /provider/register       │ Step 2        │ Register on-chain identity (mint agentId)   │
├──────────────────────────┼───────────────┼─────────────────────────────────────────────┤
│ /provider/ens            │ Step 3        │ Configure ENS records (agent:erc8004, a2a)  │
├──────────────────────────┼───────────────┼─────────────────────────────────────────────┤
│ /provider/dashboard      │ Steps 4-5     │ Reputation stats, execution history, x402   │
│                          │               │ earnings, cold-start strategies             │
└──────────────────────────┴───────────────┴─────────────────────────────────────────────┘
```

### 2. Page Details

#### `/provider` - Strategy Builder Guide
**Purpose**: Educate developers on building an A2A-compliant strategy
**Content**:
- Hero explaining the provider opportunity (earn fees via x402)
- Architecture diagram showing Cloudflare Worker structure
- Required endpoints: `/.well-known/agent-card.json`, `/capabilities`, `/quote`, `/execute`, `/pricing`
- Code snippets/examples
- "I've built my strategy" CTA → links to /provider/register

**Aesthetic**: Documentation-style but still on-brand. Code blocks with syntax highlighting. Terminal/CLI aesthetic for the technical audience.

#### `/provider/register` - Register On-Chain Identity
**Purpose**: Mint agentId via IdentityRegistry contract
**Content**:
- Progress indicator (Step 1 of 2: Identity)
- Form fields:
  - Agent URI (ENS name, e.g., "strategy.alice.eth")
  - Strategy endpoint URL (for validation)
  - Optional metadata
- "Validate Endpoint" button to check A2A compliance before registration
- Transaction preview showing IdentityRegistry.register() call
- Success state showing minted agentId (ERC-721 token)

**Aesthetic**: Form-centric, similar to /configure page. Validation feedback in real-time.

#### `/provider/ens` - Configure ENS Records
**Purpose**: Set required TXT records for agent discovery
**Content**:
- Progress indicator (Step 2 of 2: ENS)
- Current ENS status (checking if records exist)
- Two required records to set:
  1. `agent:erc8004` → "eip155:11155111:0x8004...:642"
  2. `agent:a2a` → "https://strategy-alice.workers.dev"
- CLI commands displayed (copy-to-clipboard)
- Alternative: "Set via ENS App" link
- Verification button to confirm records are set correctly
- Success state → CTA to provider dashboard

**Aesthetic**: Checklist/wizard style. Clear before/after states. Copy buttons for CLI commands.

#### `/provider/dashboard` - Reputation & Earnings
**Purpose**: Monitor strategy performance, reputation score, and x402 earnings
**Content**:
- **Stats Summary**: Total executions, compliance rate, avg slippage, reputation score
- **Reputation Card**:
  - Current score (0-100) with gauge visualization
  - Breakdown: execution count weight, slippage performance, compliance rate
  - "Cold Start" status if new (< 100 executions)
- **Execution History Table**: Similar to consumer dashboard but from provider POV
  - Columns: Date, User (truncated address), Trade, Slippage, Fee Earned, Receipt
- **Earnings Card**:
  - Total earned (USDC via x402)
  - This month / Last month
  - Fee rate (e.g., 0.05%)
  - Volume routed
- **Cold Start Strategies** (if score < 50):
  - Option A: Self-trade to build history
  - Option B: Subsidize (reduce fees temporarily)
  - Option C: Stake collateral (future feature)

**Aesthetic**: Data-dense dashboard. Multiple cards. Charts/gauges for reputation visualization. Similar to consumer /dashboard but provider-focused metrics.

### 3. Key Differences from Consumer Journey

| Aspect | Consumer | Provider |
|--------|----------|----------|
| **Primary accent** | Cyan (#00D4AA) | Blue (#5298FF) |
| **Tone** | Trust, simplicity | Technical, professional |
| **Data density** | Moderate | High (developer audience) |
| **Code visibility** | Hidden | Shown (CLI commands, API responses) |
| **Wallet actions** | Sign intents | Mint tokens, set records |

### 4. Shared Components

Both journeys share:
- Header with logo and wallet badge
- Background layers (grid, gradient, noise)
- Card styles (glass morphism)
- Table styles
- Button variants (primary, outline, danger)
- Modal component
- Status badges

### 5. Provider-Specific Components

New components needed:
- **Code Block**: Syntax-highlighted code with copy button
- **CLI Command**: Monospace command with copy button
- **Reputation Gauge**: Circular or linear gauge (0-100)
- **Earnings Chart**: Simple bar or line chart for x402 revenue
- **Validation Indicator**: Real-time endpoint validation feedback
- **Record Status**: Shows if ENS record is set/missing

### 6. Prompting Approach for Provider Pages

When generating provider pages, include:
```
PAGE CONTEXT: Provider Journey - Strategy providers are DEVELOPERS building trading strategies.
They need technical documentation, CLI commands, and transaction details visible.

ACCENT COLOR: Use blue (#5298FF) as primary accent for provider pages (cyan for consumers).

CODE BLOCKS: Show syntax-highlighted code snippets for:
- A2A endpoint examples
- Contract calls (TypeScript/ethers)
- ENS CLI commands

AUDIENCE: Technical developers familiar with Web3. Don't oversimplify.
Show transaction hashes, contract addresses, and API responses.
```
