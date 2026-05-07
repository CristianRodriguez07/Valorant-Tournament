import type { Match } from "@/db/schema";

export type AdminMatchReviewDecision = "complete" | "reset";

export type AdminMatchReviewInput = {
  decision: AdminMatchReviewDecision;
  matchStatus: Match["status"];
  winnerTeamId: string | null;
  scoreA: number;
  scoreB: number;
};

export type AdminMatchReviewResult = {
  status: Match["status"];
  winnerTeamId: string | null;
  scoreA: number;
  scoreB: number;
};

export function resolveAdminMatchReview(input: AdminMatchReviewInput): AdminMatchReviewResult {
  if (input.decision === "reset") {
    return {
      status: "ready",
      winnerTeamId: null,
      scoreA: 0,
      scoreB: 0,
    };
  }

  if (input.matchStatus !== "reported") {
    throw new Error("Solo una partida reportada se puede completar.");
  }

  if (!input.winnerTeamId) {
    throw new Error("La partida reportada necesita un ganador.");
  }

  return {
    status: "completed",
    winnerTeamId: input.winnerTeamId,
    scoreA: input.scoreA,
    scoreB: input.scoreB,
  };
}
