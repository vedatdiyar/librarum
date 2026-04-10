import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema/index.ts";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __librarumDbCache: Map<string, DbInstance> | undefined;
  var __librarumPoolCache: Map<string, Pool> | undefined;
}

if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

function getPool(connectionString: string) {
  const poolCache = globalThis.__librarumPoolCache ?? new Map<string, Pool>();

  if (!globalThis.__librarumPoolCache) {
    globalThis.__librarumPoolCache = poolCache;
  }

  const cachedPool = poolCache.get(connectionString);

  if (cachedPool) {
    return cachedPool;
  }

  const pool = new Pool({ connectionString });
  poolCache.set(connectionString, pool);

  return pool;
}

export function createDb(connectionString = process.env.LIBRARUM_DATABASE_URL) {
  if (!connectionString) {
    throw new Error("LIBRARUM_DATABASE_URL is not set.");
  }

  const dbCache = globalThis.__librarumDbCache ?? new Map<string, DbInstance>();

  if (!globalThis.__librarumDbCache) {
    globalThis.__librarumDbCache = dbCache;
  }

  const cachedDb = dbCache.get(connectionString);

  if (cachedDb) {
    return cachedDb;
  }

  const db = drizzle({
    client: getPool(connectionString),
    schema
  });

  dbCache.set(connectionString, db);

  return db;
}

export async function closeAllDbPools(): Promise<void> {
  const poolCache = globalThis.__librarumPoolCache;
  if (!poolCache || poolCache.size === 0) {
    return;
  }

  const endPromises: Promise<void>[] = [];
  for (const pool of poolCache.values()) {
    endPromises.push(pool.end());
  }

  await Promise.allSettled(endPromises);
  poolCache.clear();
  globalThis.__librarumDbCache?.clear();
}
