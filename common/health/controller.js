// src/health/health.controller.js
// import { checkDatabase } from './checks/database.check.js';
// import { checkRedis }    from './checks/redis.check.js';
import { checkDisk }     from './checks/disk.js';
import { checkMemory }   from './checks/memory.js';

// NODE_ENV ?
// HTTPS_CERTIFICATE ?
// API_PORT ?
const VERSION  = process.env.npm_package_version ?? '0.0.0';
const SERVICE  = process.env.npm_package_name    ?? 'api'; // APP_NAME ? SERVICE_NAME?
const START_AT = Date.now();

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /health
 * Lightweight liveness probe — no external checks.
 * Use this for load balancer / k8s liveness probes.
 */
export async function liveness(req, res) {
  res.status(200).json({
    status:  'ok',
    service: SERVICE,
    version: VERSION,
    uptime:  getUptime(),
  });
}

/**
 * GET /health/ready
 * Full readiness probe — checks all dependencies.
 * Use this for k8s readiness probes and monitoring dashboards.
 */
export async function readiness(req, res) {
  const checks = await runChecks([
    checkDatabase,
    checkRedis,
    checkDisk,
    checkMemory,
  ]);

  const degraded  = checks.some(c => c.status === 'degraded');
  const unhealthy = checks.some(c => c.status === 'unhealthy');

  const overall = unhealthy ? 'unhealthy'
                : degraded  ? 'degraded'
                :             'ok';

  const statusCode = unhealthy ? 503
                   : degraded  ? 207  // partial success
                   :             200;

  res.status(statusCode).json({
    status:    overall,
    service:   SERVICE,
    version:   VERSION,
    uptime:    getUptime(),
    timestamp: new Date().toISOString(),
    checks:    formatChecks(checks),
  });
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function runChecks(fns) {
  return Promise.all(
    fns.map(async (fn) => {
      const start = Date.now();
      try {
        const result = await Promise.race([
          fn(),
          timeout(5_000, fn.name),  // per-check 5 s timeout
        ]);
        return { ...result, latencyMs: Date.now() - start };
      } catch (err) {
        return {
          name:      fn.name,
          status:    'unhealthy',
          message:   err.message,
          latencyMs: Date.now() - start,
        };
      }
    })
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChecks(checks) {
  return Object.fromEntries(
    checks.map(({ name, status, message, latencyMs, meta }) => [
      name,
      { status, message, latencyMs, ...(meta && { meta }) },
    ])
  );
}

function getUptime() {
  const ms = Date.now() - START_AT;
  const s  = Math.floor(ms / 1000);
  const m  = Math.floor(s  / 60);
  const h  = Math.floor(m  / 60);
  return `${h}h ${m % 60}m ${s % 60}s`;
}

function timeout(ms, name) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms)
  );
}