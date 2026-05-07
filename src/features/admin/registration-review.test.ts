import assert from "node:assert/strict";

import { resolveRegistrationReview } from "./registration-review";

assert.deepEqual(resolveRegistrationReview({ decision: "approve" }), {
  status: "approved",
  rejectionReason: null,
  clearCheckIn: false,
});

assert.deepEqual(resolveRegistrationReview({ decision: "waitlist" }), {
  status: "waitlisted",
  rejectionReason: null,
  clearCheckIn: true,
});

assert.deepEqual(
  resolveRegistrationReview({
    decision: "reject",
    rejectionReason: "Roster has a duplicate Riot ID.",
  }),
  {
    status: "rejected",
    rejectionReason: "Roster has a duplicate Riot ID.",
    clearCheckIn: true,
  },
);

assert.throws(
  () => resolveRegistrationReview({ decision: "reject", rejectionReason: "  " }),
  /motivo/i,
);

console.log("registration-review tests passed");
