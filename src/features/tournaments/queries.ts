import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { teams, tournamentRegistrations } from "@/db/schema";

export async function getDashboardRegistrations(userId: string) {
  return db
    .select({
      registrationId: tournamentRegistrations.id,
      status: tournamentRegistrations.status,
      teamId: teams.id,
      teamName: teams.name,
      logoUrl: teams.logoUrl,
      createdAt: tournamentRegistrations.createdAt,
    })
    .from(tournamentRegistrations)
    .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .where(eq(teams.captainId, userId))
    .orderBy(desc(tournamentRegistrations.createdAt));
}
