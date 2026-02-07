// P3 Gap 9: Nostr Integration
// Creates bot profiles and posts !clawnch commands for token launches

import { getPublicKey, finalizeEvent, type EventTemplate, type Event } from 'nostr-tools';
import type { Address } from 'viem';

// Nostr relays for Clawnch — only the 2 required for scanner to minimize Workers subrequests
const DEFAULT_RELAYS = [
  'wss://relay.ditto.pub',
  'wss://relay.primal.net',
] as const;

// Clawnch platform hashtags
const PLATFORM_TAGS: Record<string, string> = {
  moltbook: '#moltbook',
  '4claw': '#4claw',
  clawstr: '#clawstr',
  moltx: '#moltx',
};

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
 * Create and publish Nostr profile + !clawnch in one call
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
  }
): Promise<NostrPublishResult & { events: Event[] }> {
  // 1. Create profile event
  const profileEvent = createProfileEvent(privateKeyHex, {
    name: params.tokenName,
    about: `${params.description}\n\nENS: ${params.ensName || 'pending'}`,
    picture: params.imageUrl,
    bot: true,
  });

  // 2. Create !clawnch event
  const clawnchEvent = createClawnchEvent(privateKeyHex, {
    tokenSymbol: params.tokenSymbol,
    tokenName: params.tokenName,
    description: params.description,
    imageUrl: params.imageUrl,
    platform: params.platform,
    agentWallet: params.agentWallet,
  });

  // 3. Publish both events (profile first so bot flag exists when scanner checks)
  // The Clawnch scanner runs every ~60s, so profile has time to propagate
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
