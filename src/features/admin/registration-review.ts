import type { TournamentRegistration } from "@/db/schema";

export type RegistrationReviewDecision = "approve" | "waitlist" | "reject";

export type RegistrationReviewInput = {
  decision: RegistrationReviewDecision;
  rejectionReason?: string | null;
};

export type RegistrationReviewResult = {
  status: TournamentRegistration["status"];
  rejectionReason: string | null;
  clearCheckIn: boolean;
};

export function resolveRegistrationReview(input: RegistrationReviewInput): RegistrationReviewResult {
  if (input.decision === "approve") {
    return {
      status: "approved",
      rejectionReason: null,
      clearCheckIn: false,
    };
  }

  if (input.decision === "waitlist") {
    return {
      status: "waitlisted",
      rejectionReason: null,
      clearCheckIn: true,
    };
  }

  const rejectionReason = input.rejectionReason?.trim();

  if (!rejectionReason) {
    throw new Error("El rechazo necesita un motivo.");
  }

  return {
    status: "rejected",
    rejectionReason,
    clearCheckIn: true,
  };
}
