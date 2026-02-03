import { Hono } from 'hono';
import { db } from 'ponder:api';
import { executionReceipt, strategyMetrics, agent } from 'ponder:schema';
import { desc, eq } from 'ponder';

const app = new Hono();

// Helper to serialize BigInts to strings for JSON
function serializeBigInts<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString() as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeBigInts) as unknown as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInts(value);
    }
    return result as T;
  }
  return obj;
}

// Get all receipts (for reputation worker polling)
app.get('/receipts', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const orderDirection = c.req.query('orderDirection') || 'asc';

  const receipts = await db
    .select()
    .from(executionReceipt)
    .orderBy(orderDirection === 'desc' ? desc(executionReceipt.timestamp) : executionReceipt.timestamp)
    .limit(limit);

  return c.json({ items: serializeBigInts(receipts) });
});

// Get receipts for a strategy
app.get('/receipts/:strategyId', async (c) => {
  const strategyId = c.req.param('strategyId') as `0x${string}`;

  const receipts = await db
    .select()
    .from(executionReceipt)
    .where(eq(executionReceipt.strategyId, strategyId))
    .orderBy(desc(executionReceipt.timestamp))
    .limit(100);

  return c.json(serializeBigInts(receipts));
});

// Get receipts for a user
app.get('/receipts/user/:user', async (c) => {
  const user = c.req.param('user') as `0x${string}`;

  const receipts = await db
    .select()
    .from(executionReceipt)
    .where(eq(executionReceipt.user, user))
    .orderBy(desc(executionReceipt.timestamp))
    .limit(100);

  return c.json(serializeBigInts(receipts));
});

// Get a single receipt by ID
app.get('/receipt/:id', async (c) => {
  const id = c.req.param('id');

  const [receipt] = await db
    .select()
    .from(executionReceipt)
    .where(eq(executionReceipt.id, id))
    .limit(1);

  if (!receipt) {
    return c.json({ error: 'Receipt not found' }, 404);
  }

  return c.json(serializeBigInts(receipt));
});

// Get strategy metrics
app.get('/strategies/:strategyId', async (c) => {
  const strategyId = c.req.param('strategyId') as `0x${string}`;

  const [metrics] = await db
    .select()
    .from(strategyMetrics)
    .where(eq(strategyMetrics.id, strategyId))
    .limit(1);

  if (!metrics) {
    return c.json({ error: 'Strategy not found' }, 404);
  }

  return c.json(serializeBigInts(metrics));
});

// Get leaderboard (top strategies by volume)
app.get('/leaderboard', async (c) => {
  const strategies = await db
    .select()
    .from(strategyMetrics)
    .orderBy(desc(strategyMetrics.totalVolume))
    .limit(50);

  return c.json(serializeBigInts(strategies));
});

// Get leaderboard by compliance rate
app.get('/leaderboard/compliance', async (c) => {
  const strategies = await db
    .select()
    .from(strategyMetrics)
    .orderBy(desc(strategyMetrics.complianceRate))
    .limit(50);

  return c.json(serializeBigInts(strategies));
});

// Get leaderboard by execution count
app.get('/leaderboard/executions', async (c) => {
  const strategies = await db
    .select()
    .from(strategyMetrics)
    .orderBy(desc(strategyMetrics.totalExecutions))
    .limit(50);

  return c.json(serializeBigInts(strategies));
});

// Get agent by ID
app.get('/agents/:agentId', async (c) => {
  const agentId = c.req.param('agentId');

  const [agentRecord] = await db
    .select()
    .from(agent)
    .where(eq(agent.id, agentId))
    .limit(1);

  if (!agentRecord) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  return c.json(serializeBigInts(agentRecord));
});

// Get agents by owner
app.get('/agents/owner/:owner', async (c) => {
  const owner = c.req.param('owner') as `0x${string}`;

  const agents = await db
    .select()
    .from(agent)
    .where(eq(agent.owner, owner))
    .limit(50);

  return c.json(serializeBigInts(agents));
});

// Get all agents (paginated, with optional ENS filter) - OIK-35
app.get('/agents', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const ensFilter = c.req.query('ens');

  let query = db.select().from(agent);

  // Filter by ENS name if provided
  if (ensFilter) {
    query = query.where(eq(agent.ens, ensFilter));
  }

  const agents = await query
    .orderBy(desc(agent.registeredAt))
    .limit(Math.min(limit, 100))
    .offset(offset);

  return c.json(serializeBigInts(agents));
});

// Resolve strategyId → agentId (OIK-38: Dynamic resolution for reputation worker)
app.get('/agents/by-strategy/:strategyId', async (c) => {
  const strategyId = c.req.param('strategyId') as `0x${string}`;

  const [agentRecord] = await db
    .select()
    .from(agent)
    .where(eq(agent.strategyId, strategyId))
    .limit(1);

  if (!agentRecord) {
    return c.json({ error: 'No agent found for strategyId', strategyId }, 404);
  }

  return c.json({
    agentId: agentRecord.id,
    ens: agentRecord.ens,
    strategyId: agentRecord.strategyId,
  });
});

// Note: /health, /ready, /metrics are reserved by Ponder

export default app;
