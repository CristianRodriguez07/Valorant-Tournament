import type { TournamentRegistration } from "@/db/schema";

export const ACTIVE_REGISTRATION_STATUSES = [
  "pending_review",
  "approved",
  "waitlisted",
  "checked_in",
] as const satisfies readonly TournamentRegistration["status"][];

export function isActiveRegistrationStatus(status: TournamentRegistration["status"]) {
  return ACTIVE_REGISTRATION_STATUSES.includes(
    status as (typeof ACTIVE_REGISTRATION_STATUSES)[number],
  );
}

export function formatRegistrationStatus(status: TournamentRegistration["status"]) {
  const labels = {
    draft: "Borrador",
    pending_review: "Pendiente de revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
    waitlisted: "En lista de espera",
    checked_in: "Check-in confirmado",
  } satisfies Record<TournamentRegistration["status"], string>;

  return labels[status];
}
