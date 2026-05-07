import type { Match, Team, TournamentRegistration } from "@/db/schema";

export type MissionTone = "danger" | "warning" | "ready" | "neutral";

export type ReadyRoomMatch = Match & {
  teamA?: Team | null;
  teamB?: Team | null;
};

export type MissionItem = {
  id: string;
  label: string;
  value: string;
  description: string;
  tone: MissionTone;
};

export function getRosterReadiness(memberCount: number) {
  if (memberCount >= 6) {
    return {
      label: "Plantilla cerrada",
      value: `${memberCount} / 6`,
      description: "Seis Riot IDs listos para revisión de administración.",
      tone: "ready" as const,
    };
  }

  const missingPlayers = 6 - memberCount;

  return {
    label: "Plantilla incompleta",
    value: `${memberCount} / 6`,
    description: `Faltan ${missingPlayers} ${missingPlayers === 1 ? "plaza" : "plazas"} antes de cerrar el equipo.`,
    tone: "danger" as const,
  };
}

export function getRegistrationMission(status: TournamentRegistration["status"]) {
  const states = {
    draft: ["Borrador", "Completa el registro del equipo antes de entrar en revisión.", "warning"],
    pending_review: ["En revisión", "Administración está validando el equipo y los Riot IDs.", "warning"],
    approved: ["Aprobado", "Tu equipo ya puede operar el día de partida.", "ready"],
    rejected: ["Rechazado", "El registro necesita una corrección antes de entrar al cuadro.", "danger"],
    waitlisted: ["En espera", "El equipo está en cola por detrás del cupo actual.", "warning"],
    checked_in: ["Presencia confirmada", "La presencia del capitán está confirmada para el día de partida.", "ready"],
  } satisfies Record<TournamentRegistration["status"], [string, string, MissionTone]>;

  const [value, description, tone] = states[status];

  return {
    label: "Inscripción",
    value,
    description,
    tone,
  };
}

export function getMatchMission(match: ReadyRoomMatch | null | undefined) {
  if (!match) {
    return {
      label: "Siguiente partida",
      value: "Cuadro pendiente",
      description: "El rival y la sala aparecerán cuando administración publique el cuadro.",
      tone: "neutral" as const,
    };
  }

  return {
    label: `Ronda ${match.round} / Partida ${match.matchNumber}`,
    value: `${match.teamA?.name ?? "Asignación pendiente"} vs ${match.teamB?.name ?? "Asignación pendiente"}`,
    description: match.scheduledAt ? `Programada para ${formatMatchDate(match.scheduledAt)}` : "La hora se está cerrando.",
    tone: match.status === "ready" || match.status === "live" ? "ready" as const : "warning" as const,
  };
}

export function buildMissionItems(input: {
  registrationStatus: TournamentRegistration["status"];
  memberCount: number;
  checkedInAt?: Date | null;
  nextMatch?: ReadyRoomMatch | null;
}): MissionItem[] {
  const registration = getRegistrationMission(input.registrationStatus);
  const roster = getRosterReadiness(input.memberCount);
  const match = getMatchMission(input.nextMatch);

  return [
    { id: "registration", ...registration },
    { id: "roster", ...roster },
    {
      id: "check-in",
      label: "Presencia",
      value: input.checkedInAt ? "Confirmada" : "Pendiente",
      description: input.checkedInAt
        ? `Confirmada el ${formatMatchDate(input.checkedInAt)}`
        : "La confirmación de presencia se abre cuando el equipo queda aprobado.",
      tone: input.checkedInAt ? "ready" : "warning",
    },
    { id: "match", ...match },
  ];
}

export function getReadyRoomActionState(input: {
  registrationStatus: TournamentRegistration["status"];
  checkedInAt?: Date | null;
  nextMatch?: ReadyRoomMatch | null;
}) {
  if (input.checkedInAt) {
    return {
      canCheckIn: false,
      label: "Capitán presente",
      description: "Tu equipo está marcado como presente para las operaciones del torneo.",
    };
  }

  if (input.registrationStatus !== "approved") {
    return {
      canCheckIn: false,
      label: "Esperando aprobación",
      description: "La presencia se desbloquea cuando administración aprueba la inscripción.",
    };
  }

  return {
    canCheckIn: true,
    label: input.nextMatch ? "Confirmar presencia" : "Presencia disponible",
    description: input.nextMatch ? "Confirma la presencia del capitán antes de la asignación de sala." : "Confirma presencia mientras administración prepara el cuadro.",
  };
}

export function formatMatchStatus(status: Match["status"]) {
  const labels = {
    scheduled: "Programada",
    ready: "Lista",
    live: "En directo",
    reported: "Reportada",
    disputed: "En disputa",
    completed: "Completada",
  } satisfies Record<Match["status"], string>;

  return labels[status];
}

type StandingStatus = "active" | "lower_bracket" | "eliminated" | "runner_up" | "champion";

export function formatStandingStatus(status: StandingStatus) {
  const labels = {
    active: "En competición",
    lower_bracket: "Cuadro inferior",
    eliminated: "Eliminado",
    runner_up: "Subcampeón",
    champion: "Campeón",
  } satisfies Record<StandingStatus, string>;

  return labels[status];
}

export function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
