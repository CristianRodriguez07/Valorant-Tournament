import assert from "node:assert/strict";

import { resolveAdminMatchReview } from "./match-review";

assert.deepEqual(
  resolveAdminMatchReview({
    decision: "complete",
    matchStatus: "reported",
    winnerTeamId: "team-alpha",
    scoreA: 1,
    scoreB: 0,
  }),
  {
    status: "completed",
    winnerTeamId: "team-alpha",
    scoreA: 1,
    scoreB: 0,
  },
);

assert.deepEqual(
  resolveAdminMatchReview({
    decision: "reset",
    matchStatus: "disputed",
    winnerTeamId: null,
    scoreA: 0,
    scoreB: 0,
  }),
  {
    status: "ready",
    winnerTeamId: null,
    scoreA: 0,
    scoreB: 0,
  },
);

assert.throws(
  () =>
    resolveAdminMatchReview({
      decision: "complete",
      matchStatus: "ready",
      winnerTeamId: "team-alpha",
      scoreA: 1,
      scoreB: 0,
    }),
  /reportada/i,
);

assert.throws(
  () =>
    resolveAdminMatchReview({
      decision: "complete",
      matchStatus: "reported",
      winnerTeamId: null,
      scoreA: 0,
      scoreB: 0,
    }),
  /ganador/i,
);

console.log("match-review tests passed");
