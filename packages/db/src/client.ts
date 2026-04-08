import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __exlibrisDbCache: Map<string, DbInstance> | undefined;
  var __exlibrisPoolCache: Map<string, Pool> | undefined;
}

if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

function getPool(connectionString: string) {
  const poolCache = globalThis.__exlibrisPoolCache ?? new Map<string, Pool>();

  if (!globalThis.__exlibrisPoolCache) {
    globalThis.__exlibrisPoolCache = poolCache;
  }

  const cachedPool = poolCache.get(connectionString);

  if (cachedPool) {
    return cachedPool;
  }

  const pool = new Pool({ connectionString });
  poolCache.set(connectionString, pool);

  return pool;
}

export function createDb(connectionString = process.env.EXLIBRIS_DATABASE_URL) {
  if (!connectionString) {
    throw new Error("EXLIBRIS_DATABASE_URL is not set.");
  }

  const dbCache = globalThis.__exlibrisDbCache ?? new Map<string, DbInstance>();

  if (!globalThis.__exlibrisDbCache) {
    globalThis.__exlibrisDbCache = dbCache;
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
