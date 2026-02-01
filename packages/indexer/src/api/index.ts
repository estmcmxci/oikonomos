import { Hono } from 'hono';
import { db } from 'ponder:api';
import { executionReceipt, strategyMetrics, agent } from 'ponder:schema';
import { desc, eq } from 'ponder';

const app = new Hono();

// Get receipts for a strategy
app.get('/receipts/:strategyId', async (c) => {
  const strategyId = c.req.param('strategyId') as `0x${string}`;

  const receipts = await db
    .select()
    .from(executionReceipt)
    .where(eq(executionReceipt.strategyId, strategyId))
    .orderBy(desc(executionReceipt.timestamp))
    .limit(100);

  return c.json(receipts);
});

// Get receipts for a user
app.get('/receipts/user/:sender', async (c) => {
  const sender = c.req.param('sender') as `0x${string}`;

  const receipts = await db
    .select()
    .from(executionReceipt)
    .where(eq(executionReceipt.sender, sender))
    .orderBy(desc(executionReceipt.timestamp))
    .limit(100);

  return c.json(receipts);
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

  return c.json(receipt);
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

  return c.json(metrics);
});

// Get leaderboard (top strategies by volume)
app.get('/leaderboard', async (c) => {
  const strategies = await db
    .select()
    .from(strategyMetrics)
    .orderBy(desc(strategyMetrics.totalVolume))
    .limit(50);

  return c.json(strategies);
});

// Get leaderboard by compliance rate
app.get('/leaderboard/compliance', async (c) => {
  const strategies = await db
    .select()
    .from(strategyMetrics)
    .orderBy(desc(strategyMetrics.complianceRate))
    .limit(50);

  return c.json(strategies);
});

// Get leaderboard by execution count
app.get('/leaderboard/executions', async (c) => {
  const strategies = await db
    .select()
    .from(strategyMetrics)
    .orderBy(desc(strategyMetrics.totalExecutions))
    .limit(50);

  return c.json(strategies);
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

  return c.json(agentRecord);
});

// Get agents by owner
app.get('/agents/owner/:owner', async (c) => {
  const owner = c.req.param('owner') as `0x${string}`;

  const agents = await db
    .select()
    .from(agent)
    .where(eq(agent.owner, owner))
    .limit(50);

  return c.json(agents);
});

// Get all agents (paginated)
app.get('/agents', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  const agents = await db
    .select()
    .from(agent)
    .limit(Math.min(limit, 100))
    .offset(offset);

  return c.json(agents);
});

// Note: /health, /ready, /metrics are reserved by Ponder

export default app;
