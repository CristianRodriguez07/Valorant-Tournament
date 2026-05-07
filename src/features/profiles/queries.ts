import "server-only";

import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { matches, tournamentPlayerSnapshots, tournamentTeamStandings } from "@/db/schema";

export async function getTeamTournamentHistory(tournamentId: string, teamId: string) {
  return db.query.matches.findMany({
    where: and(eq(matches.tournamentId, tournamentId), or(eq(matches.teamAId, teamId), eq(matches.teamBId, teamId))),
    orderBy: desc(matches.updatedAt),
    with: {
      teamA: true,
      teamB: true,
      winner: true,
    },
    limit: 12,
  });
}

export async function getTeamTournamentStanding(tournamentId: string, teamId: string) {
  return db.query.tournamentTeamStandings.findFirst({
    where: and(eq(tournamentTeamStandings.tournamentId, tournamentId), eq(tournamentTeamStandings.teamId, teamId)),
    with: {
      team: true,
    },
  });
}

export async function getUserTournamentAppearances(userId: string) {
  return db.query.tournamentPlayerSnapshots.findMany({
    where: eq(tournamentPlayerSnapshots.userId, userId),
    orderBy: desc(tournamentPlayerSnapshots.createdAt),
    with: {
      tournament: true,
      team: true,
    },
    limit: 20,
  });
}
