import type { Env } from '../index';
import { validatePolicy } from './validator';
import type { Policy } from './templates';

interface ConfigureRequest {
  userAddress: string;
  policy: Policy;
  signature?: string; // For authenticated configuration
}

interface ConfigureResponse {
  success: boolean;
  policyId?: string;
  userAddress?: string;
  policy?: Policy;
  error?: string;
  validationErrors?: string[];
}

export async function handleConfigure(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let body: ConfigureRequest;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!body.userAddress || !body.policy) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing userAddress or policy' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate policy
  const validation = validatePolicy(body.policy);
  if (!validation.valid) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Policy validation failed',
        validationErrors: validation.errors,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // In production: Store policy in KV or D1
  // For MVP: Return success with a generated policy ID
  const policyId = `policy-${body.userAddress.slice(2, 10)}-${Date.now()}`;

  const response: ConfigureResponse = {
    success: true,
    policyId,
    userAddress: body.userAddress,
    policy: body.policy,
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function parsePolicy(rawPolicy: unknown): Policy | null {
  if (typeof rawPolicy !== 'object' || rawPolicy === null) {
    return null;
  }

  const policy = rawPolicy as Record<string, unknown>;

  // Validate required fields
  if (!policy.type || !policy.tokens || !Array.isArray(policy.tokens)) {
    return null;
  }

  return policy as unknown as Policy;
}
