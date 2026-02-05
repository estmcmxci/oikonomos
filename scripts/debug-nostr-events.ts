#!/usr/bin/env npx tsx
/**
 * Debug Nostr Events
 *
 * Verifies that our !clawnch events are on the relays and checks for any replies.
 */

import 'dotenv/config';
import { SimplePool } from 'nostr-tools';
import 'websocket-polyfill';
import * as fs from 'fs';
import * as path from 'path';

const STATE_FILE = path.join(process.cwd(), '.claude', 'clawnch-nostr-keys.json');

const RELAYS = [
  'wss://relay.ditto.pub',
  'wss://relay.primal.net',
];

interface State {
  agents: {
    [key: string]: {
      nostrKeys: {
        publicKeyHex: string;
      };
      launchEventId?: string;
    };
  };
}

async function main() {
  console.log('🔍 Debugging Nostr Events\n');

  // Load state
  const state: State = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));

  const pool = new SimplePool();

  for (const [agentName, agentData] of Object.entries(state.agents)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🤖 ${agentName.toUpperCase()}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Pubkey: ${agentData.nostrKeys.publicKeyHex}`);
    console.log(`Launch Event ID: ${agentData.launchEventId}`);

    // Fetch events from this pubkey
    console.log(`\nFetching events from relays...`);

    try {
      const events = await pool.querySync(RELAYS, {
        authors: [agentData.nostrKeys.publicKeyHex],
        limit: 10,
      });

      console.log(`Found ${events.length} events from this pubkey:`);

      for (const event of events) {
        console.log(`\n  Event ${event.id.substring(0, 16)}...`);
        console.log(`    Kind: ${event.kind}`);
        console.log(`    Created: ${new Date(event.created_at * 1000).toISOString()}`);
        if (event.kind === 0) {
          const profile = JSON.parse(event.content);
          console.log(`    Profile: ${profile.name}`);
          console.log(`    Bot flag: ${profile.bot}`);
        } else if (event.kind === 1111) {
          console.log(`    Content preview: ${event.content.substring(0, 100)}...`);
          console.log(`    Tags: ${event.tags.map(t => t[0]).join(', ')}`);
        }
      }

      // Check for replies to our launch event
      if (agentData.launchEventId) {
        console.log(`\nChecking for replies to launch event...`);
        const replies = await pool.querySync(RELAYS, {
          kinds: [1, 1111],
          '#e': [agentData.launchEventId],
          limit: 5,
        });

        if (replies.length > 0) {
          console.log(`Found ${replies.length} replies:`);
          for (const reply of replies) {
            console.log(`\n  Reply ${reply.id.substring(0, 16)}...`);
            console.log(`    From: ${reply.pubkey.substring(0, 16)}...`);
            console.log(`    Content: ${reply.content.substring(0, 200)}...`);
          }
        } else {
          console.log(`No replies found yet`);
        }
      }
    } catch (e) {
      console.error(`Error fetching events: ${e}`);
    }
  }

  // Check recent !clawnch events on the network
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📡 Recent !clawnch events on network`);
  console.log(`${'='.repeat(60)}`);

  try {
    const recentEvents = await pool.querySync(RELAYS, {
      kinds: [1111],
      '#l': ['ai'],
      limit: 5,
    });

    console.log(`Found ${recentEvents.length} recent NIP-22 events with agent label:`);
    for (const event of recentEvents) {
      console.log(`\n  Event ${event.id.substring(0, 16)}...`);
      console.log(`    From: ${event.pubkey.substring(0, 16)}...`);
      console.log(`    Created: ${new Date(event.created_at * 1000).toISOString()}`);
      console.log(`    Content preview: ${event.content.substring(0, 100)}...`);
    }
  } catch (e) {
    console.error(`Error fetching recent events: ${e}`);
  }

  pool.close(RELAYS);
  console.log('\n✅ Debug complete');
}

main().catch(console.error);
