/**
 * Execute Route Handler
 *
 * Executes management operations via DelegationRouter.
 */

import type { Address } from 'viem';
import type { Env, ExecuteRequest, ExecuteResponse } from '../types';
import { createPolicyExecutor } from '../services/policyExecutor';

/**
 * Handle POST /execute
 */
export async function handleExecute(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as ExecuteRequest;

    // Validate request
    if (!body.userWallet || !body.tokens || !body.policy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userWallet, tokens, policy' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate deadline
    if (body.deadline && body.deadline < Math.floor(Date.now() / 1000)) {
      return new Response(
        JSON.stringify({ error: 'Request deadline has passed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate policy percentages
    const totalPercentage =
      body.policy.wethStrategy.compound +
      body.policy.wethStrategy.toStables +
      body.policy.wethStrategy.hold;

    if (totalPercentage !== 100) {
      return new Response(
        JSON.stringify({ error: `WETH strategy percentages must sum to 100, got ${totalPercentage}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create policy executor
    const executor = createPolicyExecutor(
      env.BASE_SEPOLIA_RPC_URL,
      env.PROVIDER_PRIVATE_KEY
    );

    // Check if delegation is active
    const isActive = await executor.isDelegationActive(body.userWallet as Address);
    if (!isActive) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active delegation found for this user. Please create a delegation first.',
        } as ExecuteResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if we can execute (timing constraint)
    const canExecute = await executor.canExecuteManagement(body.userWallet as Address);
    if (!canExecute) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cannot execute management yet. Please wait until the claim frequency period has passed.',
        } as ExecuteResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Execute the management
    const result = await executor.executeManagement(
      body.userWallet as Address,
      body.policy
    );

    const statusCode = result.success ? 200 : 500;

    return new Response(JSON.stringify(result), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[execute] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute management',
      } as ExecuteResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
