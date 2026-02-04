/**
 * Oikonomos CCIP Gateway Worker
 *
 * Cloudflare Worker that handles CCIP-Read (EIP-3668) requests for
 * oikonomos.eth subname registration.
 *
 * Endpoints:
 * - POST / - CCIP-Read handler for OffchainLookup responses
 * - GET /health - Health check endpoint
 * - GET / - Info endpoint
 */

import { handleCCIPReadRequest, jsonResponse } from "./ccip-read";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight for all routes
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Health check endpoint
    if (url.pathname === "/health" && request.method === "GET") {
      return jsonResponse(200, {
        status: "ok",
        service: "oikonomos-ccip-gateway",
        chainId: env.CHAIN_ID,
        contractAddress: env.CONTRACT_ADDRESS,
      });
    }

    // Info endpoint
    if (url.pathname === "/" && request.method === "GET") {
      return jsonResponse(200, {
        name: "Oikonomos CCIP Gateway",
        description:
          "CCIP-Read gateway for oikonomos.eth subname registration",
        version: "0.1.0",
        endpoints: {
          "POST /": "CCIP-Read handler",
          "GET /health": "Health check",
        },
        config: {
          chainId: env.CHAIN_ID,
          parentDomain: "oikonomos.eth",
          identityRegistry: env.IDENTITY_REGISTRY,
        },
      });
    }

    // CCIP-Read handler (POST to root)
    if (request.method === "POST") {
      return handleCCIPReadRequest(request, env);
    }

    return jsonResponse(404, { error: "Not found" });
  },
};
