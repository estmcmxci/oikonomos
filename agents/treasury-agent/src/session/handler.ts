import type { Env } from '../index';
import { storeSessionKey, getSessionKey, revokeSessionKey, type StoredSessionKey } from './storage';

interface CreateSessionRequest {
  /** User's EOA or smart account address */
  userAddress: string;
  /** The smart account address created with passkey */
  smartAccountAddress: string;
  /** Serialized session key from SDK */
  serializedSessionKey: string;
  /** Session validity end (unix timestamp) */
  validUntil: number;
  /** Session validity start (unix timestamp) */
  validAfter?: number;
  /** Maximum daily spend in USD (for display) */
  maxDailyUsd?: number;
}

/**
 * POST /session/create - Create session key for user
 *
 * Called by the frontend after user creates a session key via SDK
 */
export async function handleCreateSession(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: CreateSessionRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate required fields
  if (!body.userAddress || !body.smartAccountAddress || !body.serializedSessionKey || !body.validUntil) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required fields: userAddress, smartAccountAddress, serializedSessionKey, validUntil',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate expiry is in the future
  const now = Math.floor(Date.now() / 1000);
  if (body.validUntil <= now) {
    return new Response(
      JSON.stringify({ success: false, error: 'validUntil must be in the future' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate address format
  if (!body.userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid userAddress format' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Store the session key
    await storeSessionKey(env.TREASURY_KV, body.userAddress, {
      address: (env.AGENT_WALLET || '0x0') as `0x${string}`,
      serialized: body.serializedSessionKey as `0x${string}`,
      config: {
        agentAddress: (env.AGENT_WALLET || '0x0') as `0x${string}`,
        allowedTargets: [env.INTENT_ROUTER as `0x${string}`],
        allowedFunctions: ['executeIntent'],
        validAfter: body.validAfter || now,
        validUntil: body.validUntil,
        maxDailyUsd: body.maxDailyUsd || 10000,
      },
      smartAccountAddress: body.smartAccountAddress as `0x${string}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Session key stored successfully',
        data: {
          userAddress: body.userAddress,
          smartAccountAddress: body.smartAccountAddress,
          validUntil: body.validUntil,
          expiresIn: body.validUntil - now,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error storing session key:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to store session key', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /session/:userAddress - Get active session for user
 */
export async function handleGetSession(
  userAddress: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Validate address format
  if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid address format' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const session = await getSessionKey(env.TREASURY_KV, userAddress);

    if (!session) {
      return new Response(
        JSON.stringify({
          active: false,
          message: 'No active session found for this address',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = session.config.validUntil - now;

    return new Response(
      JSON.stringify({
        active: true,
        data: {
          smartAccountAddress: session.smartAccountAddress,
          validAfter: session.config.validAfter,
          validUntil: session.config.validUntil,
          expiresIn,
          maxDailyUsd: session.config.maxDailyUsd,
          allowedTargets: session.config.allowedTargets,
          allowedFunctions: session.config.allowedFunctions,
          createdAt: session.createdAt,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting session:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to get session', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /session/:userAddress - Revoke session for user
 */
export async function handleRevokeSession(
  userAddress: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Validate address format
  if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid address format' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Check if session exists first
    const session = await getSessionKey(env.TREASURY_KV, userAddress);
    const existed = session !== null;

    // Revoke (delete) the session
    await revokeSessionKey(env.TREASURY_KV, userAddress);

    return new Response(
      JSON.stringify({
        success: true,
        message: existed ? 'Session revoked successfully' : 'No session to revoke',
        wasActive: existed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error revoking session:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to revoke session', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
