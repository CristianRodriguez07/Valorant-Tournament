import "next-auth";

type UserRole = "player" | "captain" | "admin";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    riotId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      riotId: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
