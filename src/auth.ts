import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { authProviders } from "@/lib/auth-providers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "database",
  },
  providers: authProviders,
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    session({ session, user }) {
      const dbUser = user as typeof user & {
        role?: "player" | "captain" | "admin";
        riotId?: string | null;
      };

      if (session.user) {
        session.user.id = user.id;
        session.user.role = dbUser.role ?? "player";
        session.user.riotId = dbUser.riotId ?? null;
      }

      return session;
    },
  },
});
