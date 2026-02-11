// P3 Gap 9: Nostr + Moltbook Integration
// Creates bot profiles and posts !clawnch commands for token launches
// Primary: Moltbook HTTP API (m/clawnch submolt) — Clawnch scanner auto-deploys
// Secondary: Nostr relays (profile events only)

import { getPublicKey, finalizeEvent, type EventTemplate, type Event } from 'nostr-tools';
import type { Address } from 'viem';

// Nostr relays — still used for profile events
const DEFAULT_RELAYS = [
  'wss://relay.ditto.pub',
  'wss://relay.primal.net',
] as const;

// Moltbook API for creating posts in m/clawnch submolt
const MOLTBOOK_API_URL = 'https://www.moltbook.com/api/v1/posts';

// 4claw.org API for creating threads on /crypto board
const FOURCLAW_API_URL = 'https://www.4claw.org/api/v1/boards/crypto/threads';

/**
 * Nostr keys derived from agent private key
 */
export interface NostrKeys {
  privateKey: Uint8Array;
  privateKeyHex: string;
  publicKey: string;
  npub: string;
  nsec: string;
}

/**
 * Result of publishing Nostr events
 */
export interface NostrPublishResult {
  success: boolean;
  profileEventId?: string;
  clawnchEventId?: string;
  relaysPublished: string[];
  error?: string;
}

/**
 * Convert hex private key to Uint8Array for nostr-tools
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get proper Nostr public key from private key using nostr-tools
 */
export function getNostrPublicKey(privateKeyHex: string): string {
  const cleanHex = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
  return getPublicKey(hexToBytes(cleanHex));
}

/**
 * Create Nostr profile event (kind 0)
 */
export function createProfileEvent(
  privateKeyHex: string,
  profile: {
    name: string;
    about: string;
    picture?: string;
    bot?: boolean;
    nip05?: string;
    lud16?: string;
  }
): Event {
  const cleanHex = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
  const privateKeyBytes = hexToBytes(cleanHex);

  const profileContent = JSON.stringify({
    name: profile.name,
    about: profile.about,
    picture: profile.picture || '',
    bot: profile.bot ?? true,
    nip05: profile.nip05,
    lud16: profile.lud16,
  });

  const eventTemplate: EventTemplate = {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: profileContent,
  };

  return finalizeEvent(eventTemplate, privateKeyBytes);
}

/**
 * Create !clawnch post event (kind 1111 — NIP-22 comment)
 *
 * The Clawnch scanner only monitors kind 1111 events tagged with the
 * clawnch community scope. Regular kind 1 notes are ignored.
 */
export function createClawnchEvent(
  privateKeyHex: string,
  params: {
    tokenSymbol: string;
    tokenName: string;
    description: string;
    imageUrl?: string;
    platform: 'moltbook' | '4claw' | 'clawstr' | 'moltx';
    agentWallet: Address;
  }
): Event {
  const cleanHex = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
  const privateKeyBytes = hexToBytes(cleanHex);

  // Build !clawnch content per Clawnch spec (image is required)
  const imageUrl = params.imageUrl || 'https://i.imgur.com/PZJt41r.png';
  let content = `!clawnch\nname: ${params.tokenName}\nsymbol: ${params.tokenSymbol}\n`;
  content += `wallet: ${params.agentWallet}\n`;
  content += `description: ${params.description}\n`;
  content += `image: ${imageUrl}\n`;

  const eventTemplate: EventTemplate = {
    kind: 1111, // NIP-22 Comment — required by Clawnch scanner
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      // NIP-22 community scope tags (required for Clawnch scanner)
      ['I', 'https://clawstr.com/c/clawnch'],  // Root scope
      ['K', 'web'],                             // Root scope type
      ['i', 'https://clawstr.com/c/clawnch'],  // Reply scope
      ['k', 'web'],                             // Reply scope type
      // Labels
      ['L', 'agent'],
      ['l', 'ai', 'agent'],
      // Hashtags
      ['t', params.platform],
      ['t', 'clawnch'],
      ['t', params.tokenSymbol.toLowerCase()],
    ],
    content,
  };

  return finalizeEvent(eventTemplate, privateKeyBytes);
}

/**
 * Publish a single event to a relay via WebSocket (Cloudflare Workers compatible)
 */
async function publishEventToRelay(relayUrl: string, event: Event): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(relayUrl);
      const timeout = setTimeout(() => { ws.close(); resolve(false); }, 5000);

      ws.addEventListener('open', () => {
        ws.send(JSON.stringify(['EVENT', event]));
      });

      ws.addEventListener('message', (msg) => {
        try {
          const data = JSON.parse(msg.data as string);
          // ["OK", event_id, true/false, "message"]
          if (data[0] === 'OK' && data[2] === true) {
            clearTimeout(timeout);
            ws.close();
            resolve(true);
          } else if (data[0] === 'OK') {
            clearTimeout(timeout);
            ws.close();
            // Still resolve true if relay accepted (some send false for duplicates)
            resolve(true);
          }
        } catch {
          // ignore parse errors
        }
      });

      ws.addEventListener('error', () => { clearTimeout(timeout); ws.close(); resolve(false); });
      ws.addEventListener('close', () => { clearTimeout(timeout); resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Publish events to Nostr relays via WebSocket
 */
export async function publishToRelays(
  events: Event[],
  relays: string[] = [...DEFAULT_RELAYS]
): Promise<NostrPublishResult> {
  // Publish to all relays in parallel to avoid Workers timeout
  // Must send ALL events per relay (profile + clawnch), not short-circuit after first
  const results = await Promise.allSettled(
    relays.map(async (relayUrl) => {
      let anySuccess = false;
      for (const event of events) {
        const ok = await publishEventToRelay(relayUrl, event);
        if (ok) anySuccess = true;
      }
      return anySuccess ? relayUrl : null;
    })
  );

  const relaysPublished = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);

  const profileEvent = events.find(e => e.kind === 0);
  const clawnchEvent = events.find(e => e.kind === 1111 || e.kind === 1);

  return {
    success: relaysPublished.length > 0,
    profileEventId: profileEvent?.id,
    clawnchEventId: clawnchEvent?.id,
    relaysPublished,
    error: relaysPublished.length === 0
      ? 'Failed to publish to any relay'
      : undefined,
  };
}

/**
 * Result of publishing to Moltbook
 */
export interface MoltbookPublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * Build the !clawnch post content string (shared between Nostr and Moltbook)
 */
export function buildClawnchContent(params: {
  tokenName: string;
  tokenSymbol: string;
  description: string;
  imageUrl?: string;
  agentWallet: Address;
}): string {
  const imageUrl = params.imageUrl || 'https://i.imgur.com/PZJt41r.png';
  let content = `!clawnch\nname: ${params.tokenName}\nsymbol: ${params.tokenSymbol}\n`;
  content += `wallet: ${params.agentWallet}\n`;
  content += `description: ${params.description}\n`;
  content += `image: ${imageUrl}\n`;
  content += `website: https://oikonomos.vercel.app\n`;
  content += `twitter: @estmcmxci`;
  return content;
}

/**
 * Publish a !clawnch post to the m/clawnch submolt on Moltbook.
 * The Clawnch scanner auto-picks this up every ~60s and deploys the token.
 */
export async function publishToMoltbook(
  apiKey: string,
  params: {
    tokenName: string;
    tokenSymbol: string;
    description: string;
    imageUrl?: string;
    agentWallet: Address;
  }
): Promise<MoltbookPublishResult> {
  const content = buildClawnchContent(params);

  try {
    const res = await fetch(MOLTBOOK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submolt: 'clawnch',
        title: `${params.tokenName} ($${params.tokenSymbol})`,
        content,
      }),
    });

    const body = await res.json() as Record<string, unknown>;

    if (!res.ok || !body.success) {
      return {
        success: false,
        error: (body.error as string) || `Moltbook API returned ${res.status}`,
      };
    }

    const data = body.data as Record<string, unknown> | undefined;
    return {
      success: true,
      postId: data?.id as string | undefined,
      postUrl: data?.url as string | undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Moltbook publish failed',
    };
  }
}

/**
 * Result of publishing to 4claw.org
 */
export interface FourClawPublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * Publish a !clawnch thread to the /crypto board on 4claw.org.
 * The Clawnch scanner auto-picks this up and deploys the token.
 */
export async function publishTo4claw(
  apiKey: string,
  params: {
    tokenName: string;
    tokenSymbol: string;
    description: string;
    imageUrl?: string;
    agentWallet: Address;
  }
): Promise<FourClawPublishResult> {
  const content = buildClawnchContent(params);

  try {
    const res = await fetch(FOURCLAW_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `${params.tokenName} - ${params.tokenSymbol}`,
        content,
        anon: false,
      }),
    });

    // 4claw returns 201 Created on success — res.ok covers 200-299
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      return {
        success: false,
        error: (body.error as string) || `4claw API returned ${res.status}`,
      };
    }

    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    // 4claw response shape: { id, url, ... } or { data: { id, url } }
    const data = (body.data as Record<string, unknown> | undefined) || body;
    return {
      success: true,
      postId: (data.id ?? data.thread_id ?? data.post_id) as string | undefined,
      postUrl: (data.url ?? data.thread_url) as string | undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '4claw publish failed',
    };
  }
}

/**
 * Create and publish Nostr profile + !clawnch via Moltbook
 *
 * 1. Publishes Nostr profile event to relays (agent identity)
 * 2. Posts !clawnch content to Moltbook m/clawnch submolt (token launch)
 *
 * If moltbookApiKey is not provided, falls back to Nostr-only publishing.
 */
export async function launchAgentOnNostr(
  privateKeyHex: string,
  params: {
    tokenName: string;
    tokenSymbol: string;
    description: string;
    imageUrl?: string;
    platform: 'moltbook' | '4claw' | 'clawstr' | 'moltx';
    agentWallet: Address;
    ensName?: string;
    moltbookApiKey?: string;
    fourClawApiKey?: string;
  }
): Promise<NostrPublishResult & { events: Event[]; moltbook?: MoltbookPublishResult; fourClaw?: FourClawPublishResult }> {
  // 1. Create & publish Nostr profile event (agent identity on relays)
  const profileEvent = createProfileEvent(privateKeyHex, {
    name: params.tokenName,
    about: `${params.description}\n\nENS: ${params.ensName || 'pending'}`,
    picture: params.imageUrl,
    bot: true,
  });
  const profilePublish = await publishToRelays([profileEvent]);

  const launchParams = {
    tokenName: params.tokenName,
    tokenSymbol: params.tokenSymbol,
    description: params.description,
    imageUrl: params.imageUrl,
    agentWallet: params.agentWallet,
  };

  // 2. Route to the right publisher based on platform
  if (params.platform === '4claw' && params.fourClawApiKey) {
    const fourClawResult = await publishTo4claw(params.fourClawApiKey, launchParams);

    return {
      success: fourClawResult.success,
      profileEventId: profileEvent.id,
      clawnchEventId: fourClawResult.postId,
      relaysPublished: profilePublish.relaysPublished,
      error: fourClawResult.error,
      events: [profileEvent],
      fourClaw: fourClawResult,
    };
  }

  if (params.platform === 'moltbook' && params.moltbookApiKey) {
    const moltbookResult = await publishToMoltbook(params.moltbookApiKey, launchParams);

    return {
      success: moltbookResult.success,
      profileEventId: profileEvent.id,
      clawnchEventId: moltbookResult.postId,
      relaysPublished: profilePublish.relaysPublished,
      error: moltbookResult.error,
      events: [profileEvent],
      moltbook: moltbookResult,
    };
  }

  // Fallback: Nostr-only publishing (legacy Clawstr path)
  const clawnchEvent = createClawnchEvent(privateKeyHex, {
    tokenSymbol: params.tokenSymbol,
    tokenName: params.tokenName,
    description: params.description,
    imageUrl: params.imageUrl,
    platform: params.platform,
    agentWallet: params.agentWallet,
  });

  const publishResult = await publishToRelays([profileEvent, clawnchEvent]);

  return {
    ...publishResult,
    events: [profileEvent, clawnchEvent],
  };
}

/**
 * Get Nostr event as JSON for manual publishing
 * Useful when WebSocket publishing isn't available in Workers
 */
export function getEventForManualPublish(event: Event): string {
  return JSON.stringify(['EVENT', event]);
}
