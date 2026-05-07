import "server-only";

import { and, asc, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { matches, teams, tournamentTeamStandings } from "@/db/schema";

export async function getTournamentBracket(tournamentId: string) {
  return db.query.matches.findMany({
    where: eq(matches.tournamentId, tournamentId),
    orderBy: [asc(matches.round), asc(matches.matchNumber)],
    with: {
      teamA: true,
      teamB: true,
      winner: true,
    },
  });
}

export async function getTeamStanding(tournamentId: string, teamId: string) {
  return db.query.tournamentTeamStandings.findFirst({
    where: and(eq(tournamentTeamStandings.tournamentId, tournamentId), eq(tournamentTeamStandings.teamId, teamId)),
    with: {
      team: true,
    },
  });
}

export async function getTournamentStandings(tournamentId: string) {
  return db.query.tournamentTeamStandings.findMany({
    where: eq(tournamentTeamStandings.tournamentId, tournamentId),
    orderBy: [
      asc(tournamentTeamStandings.status),
      desc(tournamentTeamStandings.wins),
      asc(tournamentTeamStandings.losses),
      asc(tournamentTeamStandings.seed),
    ],
    with: {
      team: true,
    },
  });
}

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

export async function getNextMatchForTeam(teamId: string) {
  const [match] = await db.query.matches.findMany({
    where: or(eq(matches.teamAId, teamId), eq(matches.teamBId, teamId)),
    orderBy: asc(matches.scheduledAt),
    with: {
      teamA: true,
      teamB: true,
    },
    limit: 1,
  });

  return match ?? null;
}

export async function getRosterForTeam(teamId: string) {
  return db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      members: true,
    },
  });
}
