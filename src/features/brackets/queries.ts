import "server-only";

import { asc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { matches, teams } from "@/db/schema";

export async function getUpcomingMatchesForTeam(teamId: string) {
  return db.query.matches.findMany({
    where: or(eq(matches.teamAId, teamId), eq(matches.teamBId, teamId)),
    orderBy: asc(matches.scheduledAt),
    with: {
      teamA: true,
      teamB: true,
    },
    limit: 8,
  });
}

export async function getRosterForTeam(teamId: string) {
  return db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      members: true,
    },
  });
}
