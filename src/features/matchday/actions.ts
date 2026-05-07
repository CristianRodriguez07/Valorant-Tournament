"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { matches, teams, tournamentRegistrations } from "@/db/schema";

import { resolveCaptainMatchDispute, resolveCaptainMatchReport } from "./results";

export type CheckInResult =
  | { ok: true; checkedInAt: Date }
  | { ok: false; error: string };

export async function checkInCaptainTeamFromForm(formData: FormData) {
  const registrationId = readFormString(formData, "registrationId");

  if (!registrationId) {
    return;
  }

  await checkInCaptainTeam(registrationId);
}

export async function checkInCaptainTeam(registrationId: string): Promise<CheckInResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "Necesitas iniciar sesión para confirmar presencia." };
  }

  const [registration] = await db
    .select({
      id: tournamentRegistrations.id,
      status: tournamentRegistrations.status,
      checkedInAt: tournamentRegistrations.checkedInAt,
    })
    .from(tournamentRegistrations)
    .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
    .where(
      and(
        eq(tournamentRegistrations.id, registrationId),
        eq(teams.captainId, session.user.id),
      ),
    )
    .limit(1);

  if (!registration) {
    return { ok: false, error: "No tienes permiso para confirmar presencia con este equipo." };
  }

  if (registration.checkedInAt) {
    return { ok: true, checkedInAt: registration.checkedInAt };
  }

  if (registration.status !== "approved") {
    return { ok: false, error: "La presencia se habilita cuando administración aprueba la plantilla." };
  }

  const checkedInAt = new Date();

  await db
    .update(tournamentRegistrations)
    .set({
      status: "checked_in",
      checkedInAt,
      updatedAt: checkedInAt,
    })
    .where(eq(tournamentRegistrations.id, registrationId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/brackets");
  revalidatePath("/dashboard/roster");

  return { ok: true, checkedInAt };
}

export async function reportCaptainMatchResultFromForm(formData: FormData) {
  const matchId = readFormString(formData, "matchId");

  if (!matchId) {
    return;
  }

  await reportCaptainMatchResult(matchId);
}

export async function reportCaptainMatchResult(matchId: string): Promise<CheckInResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "Necesitas iniciar sesión para reportar resultado." };
  }

  const captainMatch = await getCaptainMatch(matchId, session.user.id);

  if (!captainMatch) {
    return { ok: false, error: "No tienes permiso para reportar esta partida." };
  }

  if (captainMatch.match.status === "completed") {
    return { ok: false, error: "Esta partida ya está completada." };
  }

  const reportedAt = new Date();
  const report = resolveCaptainMatchReport({
    captainTeamId: captainMatch.captainTeamId,
    teamAId: captainMatch.match.teamAId,
    teamBId: captainMatch.match.teamBId,
  });

  await db
    .update(matches)
    .set({
      ...report,
      updatedAt: reportedAt,
    })
    .where(eq(matches.id, matchId));

  revalidateMatchday();

  return { ok: true, checkedInAt: reportedAt };
}

export async function openCaptainMatchDisputeFromForm(formData: FormData) {
  const matchId = readFormString(formData, "matchId");

  if (!matchId) {
    return;
  }

  await openCaptainMatchDispute(matchId);
}

export async function openCaptainMatchDispute(matchId: string): Promise<CheckInResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "Necesitas iniciar sesión para abrir disputa." };
  }

  const captainMatch = await getCaptainMatch(matchId, session.user.id);

  if (!captainMatch) {
    return { ok: false, error: "No tienes permiso para disputar esta partida." };
  }

  if (captainMatch.match.status === "completed") {
    return { ok: false, error: "Esta partida ya está completada." };
  }

  const disputedAt = new Date();
  const dispute = resolveCaptainMatchDispute({
    captainTeamId: captainMatch.captainTeamId,
    teamAId: captainMatch.match.teamAId,
    teamBId: captainMatch.match.teamBId,
  });

  await db
    .update(matches)
    .set({
      ...dispute,
      scoreA: 0,
      scoreB: 0,
      updatedAt: disputedAt,
    })
    .where(eq(matches.id, matchId));

  revalidateMatchday();

  return { ok: true, checkedInAt: disputedAt };
}

async function getCaptainMatch(matchId: string, userId: string) {
  const [match] = await db
    .select({
      id: matches.id,
      status: matches.status,
      teamAId: matches.teamAId,
      teamBId: matches.teamBId,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) {
    return null;
  }

  const teamIds = [match.teamAId, match.teamBId].filter((teamId): teamId is string => Boolean(teamId));

  if (!teamIds.length) {
    return null;
  }

  const [captainTeam] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.captainId, userId), inArray(teams.id, teamIds)))
    .limit(1);

  if (!captainTeam) {
    return null;
  }

  return {
    captainTeamId: captainTeam.id,
    match,
  };
}

function revalidateMatchday() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/brackets");
  revalidatePath("/dashboard/roster");
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" && value ? value : null;
}
