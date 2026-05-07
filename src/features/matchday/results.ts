import type { Match } from "@/db/schema";

export type CaptainMatchResultInput = {
  captainTeamId: string;
  teamAId: string | null;
  teamBId: string | null;
};

export type CaptainMatchReport = {
  status: Extract<Match["status"], "reported">;
  winnerTeamId: string;
  scoreA: number;
  scoreB: number;
};

export type CaptainMatchDispute = {
  status: Extract<Match["status"], "disputed">;
  winnerTeamId: null;
};

export function resolveCaptainMatchReport(input: CaptainMatchResultInput): CaptainMatchReport {
  const side = resolveCaptainSide(input);

  return {
    status: "reported",
    winnerTeamId: input.captainTeamId,
    scoreA: side === "A" ? 1 : 0,
    scoreB: side === "B" ? 1 : 0,
  };
}

export function resolveCaptainMatchDispute(input: CaptainMatchResultInput): CaptainMatchDispute {
  resolveCaptainSide(input);

  return {
    status: "disputed",
    winnerTeamId: null,
  };
}

function resolveCaptainSide(input: CaptainMatchResultInput): "A" | "B" {
  if (!input.teamAId || !input.teamBId) {
    throw new Error("La partida necesita dos equipos asignados.");
  }

  if (input.captainTeamId === input.teamAId) {
    return "A";
  }

  if (input.captainTeamId === input.teamBId) {
    return "B";
  }

  throw new Error("El equipo del capitán no pertenece a esta partida.");
}
