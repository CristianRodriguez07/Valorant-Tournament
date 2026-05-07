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
      label: "Roster locked",
      value: `${memberCount} / 6`,
      description: "Six Riot IDs are ready for admin review.",
      tone: "ready" as const,
    };
  }

  const missingPlayers = 6 - memberCount;

  return {
    label: "Roster incomplete",
    value: `${memberCount} / 6`,
    description: `${missingPlayers} player slot${missingPlayers === 1 ? "" : "s"} must be filled before the squad can lock.`,
    tone: "danger" as const,
  };
}

export function getRegistrationMission(status: TournamentRegistration["status"]) {
  const states = {
    draft: ["Draft", "Finish the squad registration before entering review.", "warning"],
    pending_review: ["Under review", "Admin is validating the squad and Riot IDs.", "warning"],
    approved: ["Approved", "Your squad is eligible for matchday operations.", "ready"],
    rejected: ["Rejected", "Registration needs a correction before entering the bracket.", "danger"],
    waitlisted: ["Waitlisted", "The squad is queued behind the current tournament cap.", "warning"],
    checked_in: ["Checked in", "Captain presence is confirmed for matchday.", "ready"],
  } satisfies Record<TournamentRegistration["status"], [string, string, MissionTone]>;

  const [value, description, tone] = states[status];

  return {
    label: "Registration",
    value,
    description,
    tone,
  };
}

export function getMatchMission(match: ReadyRoomMatch | null | undefined) {
  if (!match) {
    return {
      label: "Next match",
      value: "Bracket pending",
      description: "Opponent and lobby details appear after admin publishes the bracket.",
      tone: "neutral" as const,
    };
  }

  return {
    label: `Round ${match.round} / Match ${match.matchNumber}`,
    value: `${match.teamA?.name ?? "Awaiting assignment"} vs ${match.teamB?.name ?? "Awaiting assignment"}`,
    description: match.scheduledAt ? `Scheduled for ${formatMatchDate(match.scheduledAt)}` : "Schedule is being finalized.",
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
      label: "Check-in",
      value: input.checkedInAt ? "Confirmed" : "Pending",
      description: input.checkedInAt
        ? `Confirmed at ${formatMatchDate(input.checkedInAt)}`
        : "Captain check-in opens once the squad is approved.",
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
      label: "Captain checked in",
      description: "Your team is marked present for tournament operations.",
    };
  }

  if (input.registrationStatus !== "approved") {
    return {
      canCheckIn: false,
      label: "Awaiting approval",
      description: "Check-in unlocks after admin approves the registration.",
    };
  }

  return {
    canCheckIn: true,
    label: input.nextMatch ? "Ready to check in" : "Pre-check available",
    description: input.nextMatch ? "Confirm captain presence before lobby assignment." : "Confirm presence while admin prepares the bracket.",
  };
}

export function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
