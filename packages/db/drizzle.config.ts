import type { Config } from "drizzle-kit";

const databaseUrl =
  process.env.LIBRARUM_DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/librarum";

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl
  }
} satisfies Config;
