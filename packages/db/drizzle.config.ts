import type { Config } from "drizzle-kit";

if (!process.env.EXLIBRIS_DATABASE_URL) {
  throw new Error("EXLIBRIS_DATABASE_URL is required to use drizzle-kit.");
}

export default {
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.EXLIBRIS_DATABASE_URL
  }
} satisfies Config;
