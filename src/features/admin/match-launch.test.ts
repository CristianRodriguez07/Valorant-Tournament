import assert from "node:assert/strict";

import { resolveAdminMatchLaunch } from "./match-launch";

const scheduledFrom = new Date("2026-05-06T18:00:00.000Z");

assert.deepEqual(
  resolveAdminMatchLaunch({
    registrationStatus: "approved",
    teamId: "8ef01c98-540a-4e9b-8267-3e4421716d54",
    tournamentId: "2c54f2a0-a02e-4b08-a195-ecf9129604f5",
    nextMatchNumber: 3,
    scheduledFrom,
  }),
  {
    round: 1,
    matchNumber: 3,
    bestOf: 1,
    status: "ready",
    scheduledAt: new Date("2026-05-06T19:00:00.000Z"),
    opponentName: "Unidad Cabeza de Serie Ignition",
    opponentSlug: "ignition-seed-2c54f2a0-8ef01c98",
  },
);

assert.equal(
  resolveAdminMatchLaunch({
    registrationStatus: "checked_in",
    teamId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    tournamentId: "ffffffff-1111-2222-3333-444444444444",
    nextMatchNumber: 1,
    scheduledFrom,
  }).status,
  "ready",
);

assert.throws(
  () =>
    resolveAdminMatchLaunch({
      registrationStatus: "pending_review",
      teamId: "8ef01c98-540a-4e9b-8267-3e4421716d54",
      tournamentId: "2c54f2a0-a02e-4b08-a195-ecf9129604f5",
      nextMatchNumber: 1,
      scheduledFrom,
    }),
  /aprobada/i,
);

assert.throws(
  () =>
    resolveAdminMatchLaunch({
      registrationStatus: "approved",
      teamId: "8ef01c98-540a-4e9b-8267-3e4421716d54",
      tournamentId: "2c54f2a0-a02e-4b08-a195-ecf9129604f5",
      nextMatchNumber: 0,
      scheduledFrom,
    }),
  /número de partida/i,
);

console.log("pruebas de lanzamiento de partida superadas");
