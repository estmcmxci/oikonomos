// P3 Gap 9: Nostr Integration
// Creates bot profiles and posts !clawnch commands for token launches

import { getPublicKey, finalizeEvent, type EventTemplate, type Event } from 'nostr-tools';
import type { Address } from 'viem';

// Default Nostr relays for Clawnch
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
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
 * Create !clawnch post event (kind 1)
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

  // Build !clawnch command
  // Format: !clawnch $SYMBOL TokenName
  // Description on next line
  // Wallet address for fee receiving
  const platformTag = PLATFORM_TAGS[params.platform] || '#clawstr';

  let content = `!clawnch $${params.tokenSymbol} ${params.tokenName}\n\n`;
  content += `${params.description}\n\n`;
  content += `Agent wallet: ${params.agentWallet}\n`;
  if (params.imageUrl) {
    content += `\n${params.imageUrl}`;
  }
  content += `\n\n${platformTag}`;

  const eventTemplate: EventTemplate = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['t', params.platform],
      ['t', 'clawnch'],
      ['t', params.tokenSymbol.toLowerCase()],
    ],
    content,
  };

  return finalizeEvent(eventTemplate, privateKeyBytes);
}

/**
 * Publish events to Nostr relays
 * Note: In Cloudflare Workers, we use fetch-based WebSocket alternatives
 */
export async function publishToRelays(
  events: Event[],
  relays: string[] = [...DEFAULT_RELAYS]
): Promise<NostrPublishResult> {
  const relaysPublished: string[] = [];
  const errors: string[] = [];

  // For each relay, attempt to publish via HTTP (if supported) or WebSocket
  for (const relayUrl of relays) {
    try {
      // Try HTTP-based Nostr relay API (NIP-XX proposal)
      // Fall back to noting the relay for manual publishing
      const httpUrl = relayUrl.replace('wss://', 'https://').replace('ws://', 'http://');

      for (const event of events) {
        try {
          const response = await fetch(`${httpUrl}/api/v1/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            relaysPublished.push(relayUrl);
          }
        } catch {
          // HTTP API not available, continue
        }
      }
    } catch (error) {
      errors.push(`${relayUrl}: ${String(error)}`);
    }
  }

  // If no relays accepted via HTTP, return events for manual publishing
  const profileEvent = events.find(e => e.kind === 0);
  const clawnchEvent = events.find(e => e.kind === 1);

  return {
    success: relaysPublished.length > 0 || events.length > 0,
    profileEventId: profileEvent?.id,
    clawnchEventId: clawnchEvent?.id,
    relaysPublished,
    error: relaysPublished.length === 0
      ? 'Events created but relay publishing requires WebSocket. Use external tool to publish.'
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

  // 3. Attempt to publish
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
