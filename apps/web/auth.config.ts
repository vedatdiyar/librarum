import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";
import { getSafeRedirectTarget } from "@librarum/lib";


const authConfig = {
  secret: process.env.LIBRARUM_AUTH_SECRET,
  pages: {
    signIn: "/login"
  },
  providers: [],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isLoginRoute = nextUrl.pathname === "/login";

      if (isLoginRoute && isLoggedIn) {
        return NextResponse.redirect(
          new URL(
            getSafeRedirectTarget(nextUrl.searchParams.get("callbackUrl")),
            nextUrl
          )
        );
      }

      if (isLoginRoute) {
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email ?? "";
        session.user.name = token.name ?? "";
      }

      return session;
    }
  }
} satisfies NextAuthConfig;

export default authConfig;
