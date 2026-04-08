import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export function createDb(connectionString = process.env.EXLIBRIS_DATABASE_URL) {
  if (!connectionString) {
    throw new Error("EXLIBRIS_DATABASE_URL is not set.");
  }

  const sql = neon(connectionString);
  return drizzle(sql);
}
