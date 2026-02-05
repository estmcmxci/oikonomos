#!/usr/bin/env npx tsx
/**
 * Check full Nostr replies for our launch events
 */

import 'dotenv/config';
import { SimplePool } from 'nostr-tools';
import 'websocket-polyfill';
import * as fs from 'fs';
import * as path from 'path';

const STATE_FILE = path.join(process.cwd(), '.claude', 'clawnch-nostr-keys.json');
const RELAYS = ['wss://relay.ditto.pub', 'wss://relay.primal.net'];

async function main() {
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  const pool = new SimplePool();

  for (const [agentName, agentData] of Object.entries(state.agents)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🤖 ${agentName.toUpperCase()}`);
    console.log(`Event ID: ${(agentData as any).launchEventId}`);

    if (!(agentData as any).launchEventId) continue;

    const replies = await pool.querySync(RELAYS, {
      kinds: [1, 1111],
      '#e': [(agentData as any).launchEventId],
      limit: 10,
    });

    if (replies.length > 0) {
      console.log(`\nReplies (${replies.length}):`);
      for (const reply of replies) {
        console.log(`\n  From: ${reply.pubkey.substring(0, 20)}...`);
        console.log(`  Time: ${new Date(reply.created_at * 1000).toISOString()}`);
        console.log(`  Full Content:\n${reply.content}`);
      }
    } else {
      console.log(`No replies yet`);
    }
  }

  pool.close(RELAYS);
}

main().catch(console.error);
