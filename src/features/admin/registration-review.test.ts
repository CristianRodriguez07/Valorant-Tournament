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
    rejectionReason: "La plantilla tiene un Riot ID duplicado.",
  }),
  {
    status: "rejected",
    rejectionReason: "La plantilla tiene un Riot ID duplicado.",
    clearCheckIn: true,
  },
);

assert.throws(
  () => resolveRegistrationReview({ decision: "reject", rejectionReason: "  " }),
  /motivo/i,
);

console.log("pruebas de revisión de inscripción superadas");
