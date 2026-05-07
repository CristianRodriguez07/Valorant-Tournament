import type { Match, TournamentRegistration } from "@/db/schema";

export type AdminMatchLaunchInput = {
  registrationStatus: TournamentRegistration["status"];
  teamId: string;
  tournamentId: string;
  nextMatchNumber: number;
  scheduledFrom: Date;
};

export type AdminMatchLaunchPlan = {
  round: number;
  matchNumber: number;
  bestOf: Match["bestOf"];
  status: Match["status"];
  scheduledAt: Date;
  opponentName: string;
  opponentSlug: string;
};

const ELIGIBLE_STATUSES = new Set<TournamentRegistration["status"]>([
  "approved",
  "checked_in",
]);

export function resolveAdminMatchLaunch(input: AdminMatchLaunchInput): AdminMatchLaunchPlan {
  if (!ELIGIBLE_STATUSES.has(input.registrationStatus)) {
    throw new Error("La inscripción debe estar aprobada antes de lanzar partida.");
  }

  if (!Number.isInteger(input.nextMatchNumber) || input.nextMatchNumber < 1) {
    throw new Error("El número de partida debe ser un entero positivo.");
  }

  return {
    round: 1,
    matchNumber: input.nextMatchNumber,
    bestOf: 1,
    status: "ready",
    scheduledAt: new Date(input.scheduledFrom.getTime() + 60 * 60 * 1000),
    opponentName: "Unidad Cabeza de Serie Ignition",
    opponentSlug: `ignition-seed-${idSegment(input.tournamentId)}-${idSegment(input.teamId)}`,
  };
}

function idSegment(value: string) {
  return value.replaceAll("-", "").slice(0, 8).toLowerCase();
}
