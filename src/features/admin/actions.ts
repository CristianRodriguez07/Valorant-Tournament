"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, or } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { matches, teams, tournamentRegistrations, tournamentTeamStandings, tournaments } from "@/db/schema";
import { resolveMatchAdvancement } from "@/features/brackets/advancement";

import { resolveAdminMatchLaunch } from "./match-launch";
import {
  resolveAdminMatchReview,
  type AdminMatchReviewDecision,
} from "./match-review";
import {
  resolveRegistrationReview,
  type RegistrationReviewDecision,
} from "./registration-review";

function readDecision(value: FormDataEntryValue | null): RegistrationReviewDecision | null {
  if (value === "approve" || value === "waitlist" || value === "reject") {
    return value;
  }

  return null;
}

export async function reviewTournamentRegistration(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "admin") {
    return;
  }

  const registrationId = formData.get("registrationId");
  const decision = readDecision(formData.get("decision"));

  if (typeof registrationId !== "string" || !decision) {
    return;
  }

  let review;

  try {
    review = resolveRegistrationReview({
      decision,
      rejectionReason: formData.get("rejectionReason")?.toString(),
    });
  } catch {
    return;
  }

  const updatedAt = new Date();
  const values = review.clearCheckIn
    ? {
        status: review.status,
        rejectionReason: review.rejectionReason,
        checkedInAt: null,
        updatedAt,
      }
    : {
        status: review.status,
        rejectionReason: review.rejectionReason,
        updatedAt,
      };

  await db
    .update(tournamentRegistrations)
    .set(values)
    .where(eq(tournamentRegistrations.id, registrationId));

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/brackets");
  revalidatePath("/dashboard/roster");
}

export async function launchAdminMatch(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "admin") {
    return;
  }

  const registrationId = formData.get("registrationId");

  if (typeof registrationId !== "string") {
    return;
  }

  const [registration] = await db
    .select({
      id: tournamentRegistrations.id,
      status: tournamentRegistrations.status,
      tournamentId: tournamentRegistrations.tournamentId,
      teamId: tournamentRegistrations.teamId,
      teamName: teams.name,
      teamRegion: teams.region,
    })
    .from(tournamentRegistrations)
    .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .where(eq(tournamentRegistrations.id, registrationId))
    .limit(1);

  if (!registration) {
    return;
  }

  const [existingMatch] = await db
    .select({ id: matches.id, status: matches.status })
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, registration.tournamentId),
        or(eq(matches.teamAId, registration.teamId), eq(matches.teamBId, registration.teamId)),
      ),
    )
    .limit(1);

  if (existingMatch) {
    if (existingMatch.status === "scheduled") {
      await db
        .update(matches)
        .set({ status: "ready", updatedAt: new Date() })
        .where(eq(matches.id, existingMatch.id));
    }

    revalidateTournamentControlRoom();
    return;
  }

  const [latestMatch] = await db
    .select({ matchNumber: matches.matchNumber })
    .from(matches)
    .where(and(eq(matches.tournamentId, registration.tournamentId), eq(matches.round, 1)))
    .orderBy(desc(matches.matchNumber))
    .limit(1);

  let plan;

  try {
    plan = resolveAdminMatchLaunch({
      registrationStatus: registration.status,
      teamId: registration.teamId,
      tournamentId: registration.tournamentId,
      nextMatchNumber: (latestMatch?.matchNumber ?? 0) + 1,
      scheduledFrom: new Date(),
    });
  } catch {
    return;
  }

  let [opponent] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.slug, plan.opponentSlug))
    .limit(1);

  if (!opponent) {
    [opponent] = await db
      .insert(teams)
      .values({
        captainId: session.user.id,
        name: plan.opponentName,
        slug: plan.opponentSlug,
        region: registration.teamRegion,
        metadata: {
          brandColor: "#ff4655",
        },
      })
      .returning({ id: teams.id });
  }

  if (!opponent) {
    return;
  }

  await db.insert(matches).values({
    tournamentId: registration.tournamentId,
    round: plan.round,
    matchNumber: plan.matchNumber,
    bestOf: plan.bestOf,
    teamAId: registration.teamId,
    teamBId: opponent.id,
    status: plan.status,
    scheduledAt: plan.scheduledAt,
  });

  revalidateTournamentControlRoom();
}

export async function completeAdminMatch(formData: FormData) {
  await reviewAdminMatch(formData, "complete");
}

export async function resetAdminMatch(formData: FormData) {
  await reviewAdminMatch(formData, "reset");
}

async function reviewAdminMatch(formData: FormData, decision: AdminMatchReviewDecision) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "admin") {
    return;
  }

  const matchId = formData.get("matchId");

  if (typeof matchId !== "string") {
    return;
  }

  const [match] = await db
    .select({
      id: matches.id,
      status: matches.status,
      teamAId: matches.teamAId,
      teamBId: matches.teamBId,
      winnerTeamId: matches.winnerTeamId,
      scoreA: matches.scoreA,
      scoreB: matches.scoreB,
      bracket: matches.bracket,
      nextMatchId: matches.nextMatchId,
      nextMatchSlot: matches.nextMatchSlot,
      loserNextMatchId: matches.loserNextMatchId,
      loserNextMatchSlot: matches.loserNextMatchSlot,
      tournamentId: matches.tournamentId,
      round: matches.round,
      matchNumber: matches.matchNumber,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) {
    return;
  }

  if (decision === "reset") {
    let review;

    try {
      review = resolveAdminMatchReview({
        decision,
        matchStatus: match.status,
        winnerTeamId: match.winnerTeamId,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
      });
    } catch {
      return;
    }

    await db
      .update(matches)
      .set({
        ...review,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId));

    revalidateTournamentControlRoom();
    return;
  }

  let advancement;

  try {
    advancement = resolveMatchAdvancement(match);
  } catch {
    return;
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(matches)
      .set({ ...advancement.completedMatch, updatedAt: now })
      .where(eq(matches.id, match.id));

    if (advancement.winnerMove) {
      await moveTeamIntoMatch(
        tx,
        advancement.winnerMove.matchId,
        advancement.winnerMove.slot,
        advancement.winnerMove.teamId,
        now,
      );
    }

    if (advancement.loserMove) {
      await moveTeamIntoMatch(
        tx,
        advancement.loserMove.matchId,
        advancement.loserMove.slot,
        advancement.loserMove.teamId,
        now,
      );
    }

    await incrementStanding(tx, match.tournamentId, advancement.completedMatch.winnerTeamId, "win", match.id, now);
    const loserTeamId = match.teamAId === advancement.completedMatch.winnerTeamId ? match.teamBId : match.teamAId;
    if (loserTeamId) {
      await incrementStanding(tx, match.tournamentId, loserTeamId, "loss", match.id, now);
    }

    if (advancement.createResetFinal && match.teamAId && match.teamBId) {
      await tx.insert(matches).values({
        tournamentId: match.tournamentId,
        round: match.round + 1,
        matchNumber: match.matchNumber + 1,
        bestOf: 3,
        bracket: "grand_final_reset",
        bracketRound: 1,
        bracketMatchNumber: 1,
        teamAId: match.teamAId,
        teamBId: match.teamBId,
        status: "ready",
        scheduledAt: new Date(now.getTime() + 60 * 60 * 1000),
      });
    }

    if (advancement.championTeamId) {
      await markChampion(tx, match.tournamentId, advancement.championTeamId, advancement.runnerUpTeamId, now);
    }
  });

  revalidateTournamentControlRoom();
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function moveTeamIntoMatch(
  tx: Transaction,
  matchId: string,
  slot: "team_a" | "team_b",
  teamId: string,
  updatedAt: Date,
) {
  if (slot === "team_a") {
    await tx.update(matches).set({ teamAId: teamId, updatedAt }).where(eq(matches.id, matchId));
  } else {
    await tx.update(matches).set({ teamBId: teamId, updatedAt }).where(eq(matches.id, matchId));
  }

  const target = await tx.query.matches.findFirst({ where: eq(matches.id, matchId) });
  if (target?.teamAId && target.teamBId) {
    await tx.update(matches).set({ status: "ready", updatedAt }).where(eq(matches.id, matchId));
  }
}

async function incrementStanding(
  tx: Transaction,
  tournamentId: string,
  teamId: string,
  kind: "win" | "loss",
  matchId: string,
  updatedAt: Date,
) {
  const [standing] = await tx
    .select({
      wins: tournamentTeamStandings.wins,
      losses: tournamentTeamStandings.losses,
    })
    .from(tournamentTeamStandings)
    .where(and(eq(tournamentTeamStandings.tournamentId, tournamentId), eq(tournamentTeamStandings.teamId, teamId)))
    .limit(1);

  if (!standing) {
    return;
  }

  const wins = kind === "win" ? standing.wins + 1 : standing.wins;
  const losses = kind === "loss" ? standing.losses + 1 : standing.losses;
  const status: "active" | "lower_bracket" | "eliminated" =
    losses >= 2 ? "eliminated" : losses === 1 ? "lower_bracket" : "active";

  await tx
    .update(tournamentTeamStandings)
    .set({ wins, losses, status, lastMatchId: matchId, updatedAt })
    .where(and(eq(tournamentTeamStandings.tournamentId, tournamentId), eq(tournamentTeamStandings.teamId, teamId)));
}

async function markChampion(
  tx: Transaction,
  tournamentId: string,
  championTeamId: string,
  runnerUpTeamId: string | null,
  updatedAt: Date,
) {
  await tx
    .update(tournamentTeamStandings)
    .set({ status: "champion", updatedAt })
    .where(
      and(eq(tournamentTeamStandings.tournamentId, tournamentId), eq(tournamentTeamStandings.teamId, championTeamId)),
    );

  await tx.update(tournaments).set({ status: "completed", updatedAt }).where(eq(tournaments.id, tournamentId));

  if (runnerUpTeamId) {
    await tx
      .update(tournamentTeamStandings)
      .set({ status: "runner_up", updatedAt })
      .where(
        and(eq(tournamentTeamStandings.tournamentId, tournamentId), eq(tournamentTeamStandings.teamId, runnerUpTeamId)),
      );
  }
}

function revalidateTournamentControlRoom() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/brackets");
  revalidatePath("/dashboard/roster");
}
