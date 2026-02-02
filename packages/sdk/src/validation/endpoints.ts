/**
 * Service Endpoint Validation
 *
 * Validates A2A endpoints, ENS names, and URL formats for agent registration.
 * All validations are non-blocking (warnings) unless explicitly required.
 */

import { type PublicClient } from 'viem';
import { normalize } from 'viem/ens';

export interface ValidationResult {
  valid: boolean;
  warning?: string;
  error?: string;
}

/**
 * Validates a URL format
 */
export function validateEndpointFormat(url: string): ValidationResult {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: `Invalid protocol: ${parsed.protocol}. Must be http or https.`,
      };
    }

    if (parsed.protocol === 'http:' && !parsed.hostname.includes('localhost')) {
      return {
        valid: true,
        warning: 'Using HTTP for non-localhost URL. Consider using HTTPS for production.',
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: `Invalid URL format: ${url}`,
    };
  }
}

/**
 * Validates an A2A endpoint by checking for agent-card.json
 *
 * @param url - The base URL or agent-card.json URL
 * @returns ValidationResult with status and any warnings/errors
 */
export async function validateA2AEndpoint(url: string): Promise<ValidationResult> {
  // First validate the URL format
  const formatResult = validateEndpointFormat(url);
  if (!formatResult.valid) {
    return formatResult;
  }

  // Normalize the URL to point to agent-card.json
  let agentCardUrl = url;
  if (!url.endsWith('agent-card.json')) {
    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    agentCardUrl = `${baseUrl}/.well-known/agent-card.json`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(agentCardUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        valid: false,
        warning: `A2A endpoint returned ${response.status}. Agent card may not be deployed yet.`,
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return {
        valid: true,
        warning: `A2A endpoint Content-Type is "${contentType}", expected "application/json".`,
      };
    }

    // Try to parse as JSON to verify it's valid
    try {
      const data = await response.json();
      if (!data.name) {
        return {
          valid: true,
          warning: 'Agent card JSON is missing "name" field.',
        };
      }
    } catch {
      return {
        valid: false,
        warning: 'A2A endpoint returned invalid JSON.',
      };
    }

    return { valid: true };
  } catch (err) {
    const error = err as Error;
    if (error.name === 'AbortError') {
      return {
        valid: false,
        warning: 'A2A endpoint request timed out after 10 seconds.',
      };
    }
    return {
      valid: false,
      warning: `A2A endpoint unreachable: ${error.message}`,
    };
  }
}

/**
 * Validates that an ENS name resolves on-chain
 *
 * @param client - Viem public client
 * @param ensName - ENS name to validate (e.g., "treasury.oikonomos.eth")
 * @returns ValidationResult with status and any warnings/errors
 */
export async function validateENSName(
  client: PublicClient,
  ensName: string
): Promise<ValidationResult> {
  // Validate ENS name format
  try {
    normalize(ensName);
  } catch {
    return {
      valid: false,
      error: `Invalid ENS name format: ${ensName}`,
    };
  }

  // Check if it resolves to an address
  try {
    const address = await client.getEnsAddress({ name: normalize(ensName) });

    if (!address) {
      return {
        valid: true,
        warning: `ENS name "${ensName}" does not resolve to an address. Text records can still be set.`,
      };
    }

    return { valid: true };
  } catch (err) {
    const error = err as Error;
    return {
      valid: false,
      warning: `Could not validate ENS name: ${error.message}`,
    };
  }
}

/**
 * Validates a web endpoint URL (basic reachability check)
 */
export async function validateWebEndpoint(url: string): Promise<ValidationResult> {
  const formatResult = validateEndpointFormat(url);
  if (!formatResult.valid) {
    return formatResult;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        valid: true,
        warning: `Web endpoint returned ${response.status}. Service may not be deployed yet.`,
      };
    }

    return { valid: true };
  } catch (err) {
    const error = err as Error;
    if (error.name === 'AbortError') {
      return {
        valid: false,
        warning: 'Web endpoint request timed out after 10 seconds.',
      };
    }
    return {
      valid: false,
      warning: `Web endpoint unreachable: ${error.message}`,
    };
  }
}
