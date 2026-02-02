import type { Address } from 'viem';
import type { Env } from '../index';
import { evaluate, loadPolicy, type EvaluationResult } from './loop';

// Event types we care about from Ponder
type RelevantEventType = 'ExecutionReceipt';

interface WebhookEvent {
  type: string;
  eventId: string;
  data: {
    user?: Address; // The actual user wallet (from hookData)
    router?: Address; // The router contract
    strategyId?: string;
    quoteId?: string;
    amount0?: string;
    amount1?: string;
    actualSlippage?: string;
    policyCompliant?: boolean;
    timestamp?: string;
    transactionHash?: string;
  };
}

interface WebhookPayload {
  events: WebhookEvent[];
  chainId: number;
}

interface WebhookResult {
  processed: number;
  skipped: number;
  results: Array<{
    eventId: string;
    userAddress: string;
    result: EvaluationResult;
  }>;
}

const RELEVANT_EVENT_TYPES: RelevantEventType[] = ['ExecutionReceipt'];

/**
 * Handle POST /events webhook from Ponder indexer
 */
export async function handleEventsWebhook(
  request: Request,
  env: Env,
  kv: KVNamespace,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Parse request body
  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate payload structure
  if (!payload.events || !Array.isArray(payload.events)) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid events array' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!payload.chainId) {
    return new Response(
      JSON.stringify({ error: 'Missing chainId' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate chain ID matches
  const expectedChainId = parseInt(env.CHAIN_ID, 10);
  if (payload.chainId !== expectedChainId) {
    console.log(`[webhook] Ignoring events for chain ${payload.chainId}, expected ${expectedChainId}`);
    return new Response(
      JSON.stringify({ processed: 0, skipped: payload.events.length, results: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[webhook] Received ${payload.events.length} events`);

  const result = await processEvents(env, kv, payload.events);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Process webhook events
 */
async function processEvents(
  env: Env,
  kv: KVNamespace,
  events: WebhookEvent[]
): Promise<WebhookResult> {
  const results: WebhookResult['results'] = [];
  let processed = 0;
  let skipped = 0;

  for (const event of events) {
    // Filter for relevant event types
    if (!RELEVANT_EVENT_TYPES.includes(event.type as RelevantEventType)) {
      console.log(`[webhook] Skipping irrelevant event type: ${event.type}`);
      skipped++;
      continue;
    }

    // Extract user address from event data
    const userAddress = extractUserAddress(event);
    if (!userAddress) {
      console.log(`[webhook] No user address found in event: ${event.eventId}`);
      skipped++;
      continue;
    }

    // Check if user has a policy configured
    const policy = await loadPolicy(kv, userAddress);
    if (!policy) {
      console.log(`[webhook] No policy for user ${userAddress}, skipping event ${event.eventId}`);
      skipped++;
      continue;
    }

    // Evaluate
    try {
      const evalResult = await evaluate(env, kv, userAddress, {
        trigger: 'webhook',
        eventId: event.eventId,
        eventType: event.type,
      });

      results.push({
        eventId: event.eventId,
        userAddress,
        result: evalResult,
      });

      if (evalResult.evaluated) {
        processed++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`[webhook] Error processing event ${event.eventId}:`, error);
      skipped++;
    }
  }

  console.log(`[webhook] Processed: ${processed}, Skipped: ${skipped}`);

  return { processed, skipped, results };
}

/**
 * Extract user address from event data based on event type
 */
function extractUserAddress(event: WebhookEvent): Address | null {
  switch (event.type) {
    case 'ExecutionReceipt':
      // The user field contains the actual wallet (extracted from hookData by ReceiptHook)
      return event.data.user || null;
    default:
      return null;
  }
}
