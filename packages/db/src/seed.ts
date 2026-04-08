import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { createDb } from "./client.ts";
import { users } from "./schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const nodeProcess = process as NodeJS.Process & {
  loadEnvFile?: (path?: string) => void;
};

const envLocalPath = resolve(repoRoot, ".env.local");
const envPath = resolve(repoRoot, ".env");

if (existsSync(envLocalPath)) {
  nodeProcess.loadEnvFile?.(envLocalPath);
}

if (existsSync(envPath)) {
  nodeProcess.loadEnvFile?.(envPath);
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to run the auth seed.`);
  }

  return value;
}

async function seedUser() {
  const databaseUrl = requireEnv("EXLIBRIS_DATABASE_URL");
  const email = requireEnv("EXLIBRIS_SEED_ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("EXLIBRIS_SEED_ADMIN_PASSWORD");
  const displayName = requireEnv("EXLIBRIS_SEED_ADMIN_NAME");

  const db = createDb(databaseUrl);
  const passwordHash = await hash(password, 12);

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (existingUser[0]) {
    await db
      .update(users)
      .set({
        email,
        passwordHash,
        displayName,
        updatedAt: new Date()
      })
      .where(eq(users.id, existingUser[0].id));

    console.log(`Updated seeded auth user: ${email}`);
    return;
  }

  await db.insert(users).values({
    email,
    passwordHash,
    displayName
  });

  console.log(`Created seeded auth user: ${email}`);
}

seedUser().catch((error) => {
  console.error(error);
  process.exit(1);
});
