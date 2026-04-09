import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";
import { getSafeRedirectTarget } from "@/lib/shared";


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

      // If already logged in and trying to access /login, redirect to safe target
      if (isLoginRoute && isLoggedIn) {
        const callbackUrl = nextUrl.searchParams.get("callbackUrl");
        const target = getSafeRedirectTarget(callbackUrl);
        
        // Final guard: never redirect to /login if logged in
        if (target.startsWith("/login")) {
          return NextResponse.redirect(new URL("/", nextUrl));
        }

        return NextResponse.redirect(new URL(target, nextUrl));
      }

      // Allow access to login route for non-logged in users
      if (isLoginRoute) {
        return true;
      }

      // Otherwise, require authentication
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
