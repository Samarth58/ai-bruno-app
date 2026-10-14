import dns from 'node:dns/promises';
import net from 'node:net';
import pg from 'pg';
import dotenv from 'dotenv';
import { buildApp } from '../src/app.js';
import { pool } from '../src/db/connection.js';

dotenv.config();

type DiagnosticCategory =
  | 'DNS_FAILURE'
  | 'NETWORK_FAILURE'
  | 'AUTH_FAILURE'
  | 'DATABASE_NAME_FAILURE'
  | 'UNKNOWN';

interface DiagnosticResult {
  host: string;
  port: number;
  database: string;
  dns: {
    status: string;
    error: string | null;
    address: string | null;
  };
  tcp: {
    status: string;
    error: string | null;
  };
  postgres: {
    status: string;
    error: {
      category: DiagnosticCategory;
      code: string;
      message: string;
    } | null;
    currentDatabase: string | null;
    isBrunoDb: boolean;
  };
  healthProbes: {
    live: {
      statusCode: number;
      body: unknown;
    };
    ready: {
      statusCode: number;
      body: unknown;
    };
  };
}

async function runDiagnostics(): Promise<void> {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('DATABASE_URL is not set in environment');
  }

  const parsedUrl = new URL(rawUrl);
  const host = parsedUrl.hostname;
  const port = parseInt(parsedUrl.port || '5432', 10);
  const database = parsedUrl.pathname.replace(/^\//, '');

  const result: DiagnosticResult = {
    host,
    port,
    database,
    dns: { status: 'PENDING', error: null, address: null },
    tcp: { status: 'PENDING', error: null },
    postgres: {
      status: 'PENDING',
      error: null,
      currentDatabase: null,
      isBrunoDb: false,
    },
    healthProbes: {
      live: { statusCode: 0, body: null },
      ready: { statusCode: 0, body: null },
    },
  };

  console.log('====================================================');
  console.log('BRUNO BACKEND CONNECTIVITY & HEALTH DIAGNOSTIC REPORT');
  console.log('====================================================');
  console.log(`Target Host: ${host}`);
  console.log(`Target Port: ${port}`);
  console.log(`Target Database: ${database}`);
  console.log('----------------------------------------------------');

  // Step 1: DNS Resolution Check
  try {
    const lookup = await dns.lookup(host);
    result.dns.status = 'SUCCESS';
    result.dns.address = lookup.address;
    console.log(`[DNS] SUCCESS: Resolved to ${lookup.address}`);
  } catch (err: any) {
    result.dns.status = 'FAILED';
    result.dns.error = `${err.code || 'UNKNOWN'}: ${err.message}`;
    console.log(`[DNS] FAILED: ${result.dns.error}`);
  }

  // Step 2: TCP Reachability Check (only if DNS resolved)
  if (result.dns.status === 'SUCCESS') {
    await new Promise<void>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      socket.on('connect', () => {
        result.tcp.status = 'SUCCESS';
        console.log(`[TCP] SUCCESS: Connected to ${host}:${port}`);
        socket.destroy();
        resolve();
      });
      socket.on('timeout', () => {
        result.tcp.status = 'TIMEOUT';
        result.tcp.error = 'Connection timed out after 3000ms';
        console.log(`[TCP] TIMEOUT: Connection timed out after 3000ms`);
        socket.destroy();
        resolve();
      });
      socket.on('error', (err: any) => {
        result.tcp.status = 'FAILED';
        result.tcp.error = `${err.code || 'UNKNOWN'}: ${err.message}`;
        console.log(`[TCP] FAILED: ${result.tcp.error}`);
        resolve();
      });
      socket.connect(port, host);
    });
  } else {
    result.tcp.status = 'SKIPPED';
    result.tcp.error = 'Skipped because DNS resolution failed';
    console.log(`[TCP] SKIPPED: Hostname could not be resolved by DNS`);
  }

  // Step 3: PostgreSQL Protocol & Read-only Query Check
  if (result.tcp.status === 'SUCCESS') {
    const client = new pg.Client({
      connectionString: rawUrl,
      connectionTimeoutMillis: 3000,
    });
    try {
      await client.connect();
      // Read-only query only: SELECT current_database()
      const queryRes = await client.query('SELECT current_database();');
      const currentDb = queryRes.rows[0]?.current_database ?? null;
      result.postgres.status = 'SUCCESS';
      result.postgres.currentDatabase = currentDb;
      result.postgres.isBrunoDb = currentDb === 'bruno_db';
      console.log(`[PostgreSQL] SUCCESS: connected to database "${currentDb}" (matches bruno_db: ${result.postgres.isBrunoDb})`);
      await client.end();
    } catch (err: any) {
      result.postgres.status = 'FAILED';
      const errMsg = String(err.message || '').replace(/:[^@]+@/, ':***@');
      let category: DiagnosticCategory = 'UNKNOWN';

      if (err.code === '28P01' || err.code === '28000' || errMsg.includes('password authentication failed')) {
        category = 'AUTH_FAILURE';
      } else if (err.code === '3D000' || errMsg.includes('database') && errMsg.includes('does not exist')) {
        category = 'DATABASE_NAME_FAILURE';
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        category = 'NETWORK_FAILURE';
      } else if (err.code === 'ENOTFOUND') {
        category = 'DNS_FAILURE';
      }

      result.postgres.error = {
        category,
        code: err.code || 'UNKNOWN',
        message: errMsg,
      };
      console.log(`[PostgreSQL] FAILED [Category: ${category}]: ${errMsg}`);
      try {
        await client.end();
      } catch (_) {}
    }
  } else {
    result.postgres.status = 'BLOCKED';
    const reason = result.dns.status === 'FAILED' ? 'DNS_FAILURE' : 'NETWORK_FAILURE';
    result.postgres.error = {
      category: reason,
      code: result.dns.status === 'FAILED' ? 'DNS_ENOTFOUND' : 'TCP_UNREACHABLE',
      message: result.dns.status === 'FAILED'
        ? `Private network hostname "${host}" cannot be resolved from this environment.`
        : `TCP port ${port} is unreachable on ${host}.`,
    };
    console.log(`[PostgreSQL] BLOCKED [Category: ${reason}]: ${result.postgres.error.message}`);
  }

  // Step 4: Health Probes Check (/health/live and /health/ready)
  console.log('----------------------------------------------------');
  console.log('CHECKING APPLICATION HEALTH PROBES');
  console.log('----------------------------------------------------');
  const app = buildApp();
  try {
    const liveRes = await app.inject({ method: 'GET', url: '/health/live' });
    result.healthProbes.live = {
      statusCode: liveRes.statusCode,
      body: liveRes.json(),
    };
    console.log(`[GET /health/live] HTTP ${liveRes.statusCode} -> ${JSON.stringify(liveRes.json())}`);

    const readyRes = await app.inject({ method: 'GET', url: '/health/ready' });
    result.healthProbes.ready = {
      statusCode: readyRes.statusCode,
      body: readyRes.json(),
    };
    console.log(`[GET /health/ready] HTTP ${readyRes.statusCode} -> ${JSON.stringify(readyRes.json())}`);
  } catch (err: any) {
    console.error('Health probe evaluation failed:', err.message);
  } finally {
    await app.close();
    try {
      await pool.end();
    } catch (_) {}
  }

  console.log('----------------------------------------------------');
  console.log('DIAGNOSTIC SUMMARY JSON');
  console.log(JSON.stringify(result, null, 2));
  console.log('====================================================');
}

runDiagnostics()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal diagnostic failure:', err);
    process.exit(1);
  });
