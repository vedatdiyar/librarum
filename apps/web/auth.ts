import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { sql } from "drizzle-orm";
import { createDb, users } from "@exlibris/db";
import { loginSchema } from "@/lib/auth-schema";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email"
        },
        password: {
          label: "Password",
          type: "password"
        }
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const db = createDb();
        const email = parsedCredentials.data.email.toLowerCase();

        const user = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.displayName,
            passwordHash: users.passwordHash
          })
          .from(users)
          .where(sql`lower(${users.email}) = ${email}`)
          .limit(1);

        const existingUser = user[0];

        if (!existingUser) {
          return null;
        }

        const isPasswordValid = await compare(
          parsedCredentials.data.password,
          existingUser.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name
        };
      }
    })
  ]
});
