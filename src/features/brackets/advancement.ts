import type { BracketLane, BracketSlot } from "./types";

export type AdvancementMatchInput = {
  id: string;
  status: "scheduled" | "ready" | "live" | "reported" | "disputed" | "completed";
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  scoreA: number;
  scoreB: number;
  bracket: BracketLane | null;
  nextMatchId: string | null;
  nextMatchSlot: BracketSlot | null;
  loserNextMatchId: string | null;
  loserNextMatchSlot: BracketSlot | null;
};

export type TeamMove = {
  matchId: string;
  slot: BracketSlot;
  teamId: string;
};

export type MatchAdvancement = {
  completedMatch: {
    status: "completed";
    winnerTeamId: string;
    scoreA: number;
    scoreB: number;
  };
  winnerMove: TeamMove | null;
  loserMove: TeamMove | null;
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  createResetFinal: boolean;
};

export function resolveMatchAdvancement(match: AdvancementMatchInput): MatchAdvancement {
  if (match.status !== "reported") {
    throw new Error("Solo las partidas reportadas pueden avanzar.");
  }

  if (!match.teamAId || !match.teamBId) {
    throw new Error("El avance de partida requiere dos equipos.");
  }

  if (!match.winnerTeamId) {
    throw new Error("La partida reportada necesita un ganador.");
  }

  if (match.winnerTeamId !== match.teamAId && match.winnerTeamId !== match.teamBId) {
    throw new Error("El ganador debe ser uno de los equipos de la partida.");
  }

  const loserTeamId = match.winnerTeamId === match.teamAId ? match.teamBId : match.teamAId;
  const completedMatch = {
    status: "completed" as const,
    winnerTeamId: match.winnerTeamId,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
  };

  if (match.bracket === "grand_final") {
    if (match.winnerTeamId === match.teamAId) {
      return {
        completedMatch,
        winnerMove: null,
        loserMove: null,
        championTeamId: match.teamAId,
        runnerUpTeamId: match.teamBId,
        createResetFinal: false,
      };
    }

    return {
      completedMatch,
      winnerMove: null,
      loserMove: null,
      championTeamId: null,
      runnerUpTeamId: null,
      createResetFinal: true,
    };
  }

  if (match.bracket === "grand_final_reset") {
    return {
      completedMatch,
      winnerMove: null,
      loserMove: null,
      championTeamId: match.winnerTeamId,
      runnerUpTeamId: loserTeamId,
      createResetFinal: false,
    };
  }

  return {
    completedMatch,
    winnerMove: moveIfReady(match.winnerTeamId, match.nextMatchId, match.nextMatchSlot),
    loserMove: moveIfReady(loserTeamId, match.loserNextMatchId, match.loserNextMatchSlot),
    championTeamId: null,
    runnerUpTeamId: null,
    createResetFinal: false,
  };
}

function moveIfReady(teamId: string, matchId: string | null, slot: BracketSlot | null): TeamMove | null {
  if (!matchId || !slot) {
    return null;
  }

  return {
    matchId,
    slot,
    teamId,
  };
}
