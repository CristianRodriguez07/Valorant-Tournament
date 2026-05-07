import assert from "node:assert/strict";

import { resolveCaptainMatchDispute, resolveCaptainMatchReport } from "./results";

assert.deepEqual(
  resolveCaptainMatchReport({
    captainTeamId: "team-alpha",
    teamAId: "team-alpha",
    teamBId: "team-omega",
  }),
  {
    status: "reported",
    winnerTeamId: "team-alpha",
    scoreA: 1,
    scoreB: 0,
  },
);

assert.deepEqual(
  resolveCaptainMatchReport({
    captainTeamId: "team-omega",
    teamAId: "team-alpha",
    teamBId: "team-omega",
  }),
  {
    status: "reported",
    winnerTeamId: "team-omega",
    scoreA: 0,
    scoreB: 1,
  },
);

assert.deepEqual(
  resolveCaptainMatchDispute({
    captainTeamId: "team-alpha",
    teamAId: "team-alpha",
    teamBId: "team-omega",
  }),
  {
    status: "disputed",
    winnerTeamId: null,
  },
);

assert.throws(
  () =>
    resolveCaptainMatchReport({
      captainTeamId: "outsider",
      teamAId: "team-alpha",
      teamBId: "team-omega",
    }),
  /pertenece/i,
);

console.log("pruebas de resultados del día de partida superadas");
