import "server-only";

import { and, asc, countDistinct, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { matches, teamMembers, teams, tournamentRegistrations, tournaments } from "@/db/schema";

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

export async function getCaptainMission(userId: string) {
  const [registration] = await db
    .select({
      registrationId: tournamentRegistrations.id,
      status: tournamentRegistrations.status,
      checkedInAt: tournamentRegistrations.checkedInAt,
      rejectionReason: tournamentRegistrations.rejectionReason,
      teamId: teams.id,
      teamName: teams.name,
      logoUrl: teams.logoUrl,
      createdAt: tournamentRegistrations.createdAt,
      tournamentId: tournaments.id,
      tournamentTitle: tournaments.title,
      tournamentStatus: tournaments.status,
      tournamentStartsAt: tournaments.startsAt,
      registrationClosesAt: tournaments.registrationClosesAt,
      maxTeams: tournaments.maxTeams,
    })
    .from(tournamentRegistrations)
    .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .innerJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
    .where(eq(teams.captainId, userId))
    .orderBy(desc(tournamentRegistrations.createdAt))
    .limit(1);

  return registration ?? null;
}

export async function getAdminRegistrationQueue() {
  return db
    .select({
      registrationId: tournamentRegistrations.id,
      status: tournamentRegistrations.status,
      checkedInAt: tournamentRegistrations.checkedInAt,
      rejectionReason: tournamentRegistrations.rejectionReason,
      tournamentId: tournaments.id,
      teamId: teams.id,
      teamName: teams.name,
      tournamentTitle: tournaments.title,
      memberCount: countDistinct(teamMembers.id),
      assignedMatchCount: countDistinct(matches.id),
      createdAt: tournamentRegistrations.createdAt,
    })
    .from(tournamentRegistrations)
    .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .innerJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
    .leftJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .leftJoin(
      matches,
      and(
        eq(matches.tournamentId, tournamentRegistrations.tournamentId),
        or(eq(matches.teamAId, teams.id), eq(matches.teamBId, teams.id)),
      ),
    )
    .groupBy(
      tournamentRegistrations.id,
      tournamentRegistrations.status,
      tournamentRegistrations.checkedInAt,
      tournamentRegistrations.rejectionReason,
      tournaments.id,
      teams.id,
      teams.name,
      tournaments.title,
      tournamentRegistrations.createdAt,
    )
    .orderBy(asc(tournamentRegistrations.createdAt));
}

export async function getAdminMatchQueue() {
  return db.query.matches.findMany({
    where: or(eq(matches.status, "reported"), eq(matches.status, "disputed")),
    orderBy: desc(matches.updatedAt),
    with: {
      teamA: true,
      teamB: true,
      tournament: true,
    },
    limit: 12,
  });
}

export async function getAdminSeedBoard(tournamentId?: string) {
  const registrations = await db.query.tournamentRegistrations.findMany({
    where: or(eq(tournamentRegistrations.status, "approved"), eq(tournamentRegistrations.status, "checked_in")),
    orderBy: asc(tournamentRegistrations.createdAt),
    with: {
      team: {
        with: {
          members: true,
        },
      },
      tournament: true,
    },
  });

  return registrations
    .filter((registration) => !tournamentId || registration.tournamentId === tournamentId)
    .map((registration) => ({
      registrationId: registration.id,
      tournamentId: registration.tournamentId,
      tournamentTitle: registration.tournament.title,
      teamId: registration.teamId,
      teamName: registration.team.name,
      seed: registration.seed,
      status: registration.status,
      checkedInAt: registration.checkedInAt,
      createdAt: registration.createdAt,
      members: registration.team.members,
    }));
}
