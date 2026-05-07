"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  matches,
  tournamentPlayerSnapshots,
  tournamentRegistrations,
  tournamentTeamStandings,
} from "@/db/schema";

import { createDoubleEliminationPlan } from "./double-elimination";
import type { EligibleBracketTeam, PlannedBracketMatch } from "./types";

export type PublishBracketResult =
  | { ok: true; matchCount: number; warnings: string[] }
  | { ok: false; error: string };

export async function publishDoubleEliminationBracket(formData: FormData): Promise<PublishBracketResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, error: "Admin access is required to publish a bracket." };
  }

  const tournamentId = formData.get("tournamentId");
  if (typeof tournamentId !== "string") {
    return { ok: false, error: "Tournament id is required." };
  }

  const existing = await db.query.matches.findFirst({
    where: eq(matches.tournamentId, tournamentId),
  });
  if (existing) {
    return { ok: false, error: "This tournament already has bracket matches." };
  }

  let plan;

  try {
    const eligible = await loadEligibleBracketTeams(tournamentId);
    plan = createDoubleEliminationPlan({ tournamentId, teams: eligible });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Bracket generation failed.",
    };
  }

  await db.transaction(async (tx) => {
    const insertedIds = new Map<string, string>();

    for (const planned of plan.matches) {
      const [created] = await tx
        .insert(matches)
        .values(toMatchInsert(tournamentId, planned))
        .returning({ id: matches.id });
      if (!created) {
        throw new Error("Match insert failed.");
      }
      insertedIds.set(planned.planId, created.id);
    }

    for (const planned of plan.matches) {
      const matchId = insertedIds.get(planned.planId);
      if (!matchId) {
        throw new Error("Missing inserted match id.");
      }

      await tx
        .update(matches)
        .set({
          nextMatchId: planned.nextMatchPlanId ? insertedIds.get(planned.nextMatchPlanId) ?? null : null,
          loserNextMatchId: planned.loserNextMatchPlanId ? insertedIds.get(planned.loserNextMatchPlanId) ?? null : null,
          sourceMatchAId: planned.sourceMatchAPlanId ? insertedIds.get(planned.sourceMatchAPlanId) ?? null : null,
          sourceMatchBId: planned.sourceMatchBPlanId ? insertedIds.get(planned.sourceMatchBPlanId) ?? null : null,
        })
        .where(eq(matches.id, matchId));
    }

    await tx.insert(tournamentTeamStandings).values(
      plan.standings.map((standing) => ({
        tournamentId: standing.tournamentId,
        teamId: standing.teamId,
        seed: standing.seed,
        wins: standing.wins,
        losses: standing.losses,
        status: standing.status,
        lastMatchId: standing.lastMatchPlanId ? insertedIds.get(standing.lastMatchPlanId) ?? null : null,
      })),
    );

    if (plan.playerSnapshots.length) {
      await tx.insert(tournamentPlayerSnapshots).values(plan.playerSnapshots);
    }

    for (const team of plan.teams) {
      await tx
        .update(tournamentRegistrations)
        .set({ seed: team.seed, updatedAt: new Date() })
        .where(eq(tournamentRegistrations.id, team.registrationId));
    }
  });

  revalidateTournamentBracket();
  return { ok: true, matchCount: plan.matches.length, warnings: plan.warnings };
}

async function loadEligibleBracketTeams(tournamentId: string): Promise<EligibleBracketTeam[]> {
  const registrations = await db.query.tournamentRegistrations.findMany({
    where: eq(tournamentRegistrations.tournamentId, tournamentId),
    orderBy: asc(tournamentRegistrations.createdAt),
    with: {
      team: {
        with: {
          members: true,
        },
      },
    },
  });

  const eligible = registrations.filter(
    (registration) => registration.status === "approved" || registration.status === "checked_in",
  );

  if (eligible.length < 2) {
    throw new Error("At least two approved or checked-in teams are required.");
  }

  return eligible.map((registration) => ({
    registrationId: registration.id,
    tournamentId: registration.tournamentId,
    teamId: registration.teamId,
    teamName: registration.team.name,
    seed: registration.seed,
    status: registration.status,
    checkedInAt: registration.checkedInAt,
    createdAt: registration.createdAt,
    members: registration.team.members,
  }));
}

function toMatchInsert(tournamentId: string, planned: PlannedBracketMatch) {
  return {
    tournamentId,
    round: planned.displayRound,
    matchNumber: planned.displayMatchNumber,
    bestOf: planned.bestOf,
    bracket: planned.bracket,
    bracketRound: planned.bracketRound,
    bracketMatchNumber: planned.bracketMatchNumber,
    teamAId: planned.teamAId,
    teamBId: planned.teamBId,
    winnerTeamId: planned.winnerTeamId,
    status: planned.status,
    scoreA: planned.scoreA,
    scoreB: planned.scoreB,
    nextMatchSlot: planned.nextMatchSlot,
    loserNextMatchSlot: planned.loserNextMatchSlot,
  };
}

function revalidateTournamentBracket() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/brackets");
  revalidatePath("/dashboard/roster");
  revalidatePath("/");
}
